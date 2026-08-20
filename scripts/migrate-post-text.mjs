/**
 * Post text migration: courtneystockton.com → Sanity.
 *
 * Companion to migrate-images.mjs; RUN THIS AFTER the image migration
 * finishes. For each legacy blog draft it fetches the original WordPress
 * post (via /wp-json/wp/v2/posts) and fills in:
 *
 *  - the written story, converted to the site's rich-text blocks
 *    (paragraphs, headings, quotes, lists, links), with the already-migrated
 *    photographs woven back into their original positions in the text
 *  - the REAL publish date (original dates matter for search rankings)
 *  - the excerpt / search description
 *
 * Photos referenced by the text are matched to the assets the image
 * migration already uploaded (by filename); nothing is re-downloaded.
 * Photograph-only blocks the image migration appended that the text does
 * not reference are kept at the end of the story, so no image is lost.
 *
 * Safe by design: drafts whose body already contains WRITTEN text are
 * skipped (a photo-only body from the image migration is merged, not
 * treated as content). Published posts are untouched unless
 * --include-published is passed.
 *
 *   npm run migrate:text -- --dry-run          # preview
 *   npm run migrate:text                        # the real thing
 *
 * Flags: --dry-run, --limit N, --include-published, --self-test
 */
import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://courtneystockton.com";
const USER_AGENT =
  "courtney-stockton-site-migration/1.0 (moving this site's own content to its new CMS)";
const REQUEST_DELAY_MS = 700;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SELF_TEST = args.includes("--self-test");
const INCLUDE_PUBLISHED = args.includes("--include-published");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

const key = () => createHash("md5").update(String(Math.random())).digest("hex").slice(0, 12);

/* ——— entity decoding (the handful WordPress actually emits) ——— */
export function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&(l|r)squo;/g, "'")
    .replace(/&(l|r)dquo;/g, '"')
    .replace(/&(m|n)dash;/g, "-");
}

/* ——— inline HTML → Portable Text children (spans with marks + links) ——— */
export function parseInline(html) {
  const children = [];
  const markDefs = [];
  const active = []; // stack of marks
  let buffer = "";

  const flush = () => {
    const text = decodeEntities(buffer);
    if (text.length > 0) {
      children.push({ _type: "span", _key: key(), text, marks: [...active] });
    }
    buffer = "";
  };

  const tokens = html.split(/(<\/?(?:a|strong|b|em|i)\b[^>]*>)/gi);
  for (const token of tokens) {
    const open = token.match(/^<(a|strong|b|em|i)\b([^>]*)>$/i);
    const close = token.match(/^<\/(a|strong|b|em|i)>$/i);
    if (open) {
      flush();
      const tag = open[1].toLowerCase();
      if (tag === "a") {
        const href = open[2].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
        if (href && !href.startsWith("javascript:")) {
          const def = { _type: "link", _key: key(), href };
          markDefs.push(def);
          active.push(def._key);
        } else {
          active.push(null); // unmatched/unsafe link: track depth, no mark
        }
      } else {
        active.push(tag === "b" ? "strong" : tag === "i" ? "em" : tag);
      }
    } else if (close) {
      flush();
      active.pop();
    } else if (token) {
      // Drop any remaining inline tags (spans, wbr, etc.), keep their text.
      buffer += token.replace(/<[^>]+>/g, "");
    }
  }
  flush();
  return {
    children,
    markDefs,
    // null placeholders (unsafe links) removed from span marks
    sanitize() {
      for (const child of children) child.marks = child.marks.filter(Boolean);
      return { children, markDefs };
    },
  };
}

const textBlock = (style, html, listItem) => {
  const { children, markDefs } = parseInline(html).sanitize();
  if (children.every((c) => !c.text.trim())) return null;
  return {
    _type: "block",
    _key: key(),
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  };
};

/**
 * WordPress post HTML → Portable Text blocks. `resolveImage(url)` returns a
 * Sanity asset id (or null); resolved images become photograph blocks in
 * their original position in the story.
 */
export function htmlToBlocks(html, resolveImage) {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|form|iframe)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");

  const blocks = [];
  const usedAssets = new Set();
  const styleFor = { h1: "h2", h2: "h2", h3: "h3", h4: "h3", h5: "h3", h6: "h3" };

  const pattern = /<(h[1-6]|p|blockquote|li)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*\/?>/gi;
  let m;
  while ((m = pattern.exec(cleaned)) !== null) {
    if (m[0].toLowerCase().startsWith("<img")) {
      const src = m[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      const assetId = src ? resolveImage(src) : null;
      if (assetId && !usedAssets.has(assetId)) {
        usedAssets.add(assetId);
        blocks.push({
          _type: "photograph",
          _key: key(),
          asset: { _type: "reference", _ref: assetId },
        });
      }
      continue;
    }
    const tag = m[1].toLowerCase();
    let inner = m[2];

    // Images nested inside the element render after its text.
    const nestedImages = [];
    inner = inner.replace(/<img\b[^>]*\/?>/gi, (img) => {
      const src = img.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      const assetId = src ? resolveImage(src) : null;
      if (assetId && !usedAssets.has(assetId)) {
        usedAssets.add(assetId);
        nestedImages.push({
          _type: "photograph",
          _key: key(),
          asset: { _type: "reference", _ref: assetId },
        });
      }
      return "";
    });

    // Paragraph-level splits from <br> newlines.
    const pieces = tag === "p" ? inner.split(/\n{2,}/) : [inner];
    for (const piece of pieces) {
      const block =
        tag === "li"
          ? textBlock("normal", piece, "bullet")
          : textBlock(styleFor[tag] ?? (tag === "blockquote" ? "blockquote" : "normal"), piece);
      if (block) blocks.push(block);
    }
    blocks.push(...nestedImages);
  }
  return { blocks, usedAssets };
}

/** name-768x1024.jpg → name.jpg */
const baseFilename = (url) =>
  decodeURIComponent(url.split("/").pop().split("?")[0]).replace(
    /-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i,
    "$1"
  );

/* ——— self-test ——— */
if (SELF_TEST) {
  let ok = true;
  const fail = (...msg) => ((ok = false), console.error(...msg));

  const resolver = (src) =>
    src.includes("known") ? "image-known" : null;
  const { blocks } = htmlToBlocks(
    `<h2>The Day</h2>
     <p>They met at <a href="https://example.com">Viansa</a> &amp; married under the oaks. <strong>Unforgettable.</strong></p>
     <figure><img src="/wp-content/uploads/2021/06/known-1.jpg"></figure>
     <p><img src="/wp-content/uploads/2021/06/unknown.jpg">A caption line.</p>
     <blockquote>So much love.</blockquote>
     <ul><li>First</li><li>Second</li></ul>
     <script>evil()</script>`,
    resolver
  );

  const styles = blocks.map((b) => (b._type === "photograph" ? "IMG" : b.style + (b.listItem ? ":li" : "")));
  const wantStyles = ["h2", "normal", "IMG", "normal", "blockquote", "normal:li", "normal:li"];
  if (JSON.stringify(styles) !== JSON.stringify(wantStyles))
    fail("block structure mismatch:", styles, "want", wantStyles);

  const para = blocks[1];
  const linked = para.children.find((c) => c.marks.length > 0 && c.text === "Viansa");
  if (!linked) fail("link span missing:", JSON.stringify(para.children));
  if (!para.markDefs.some((d) => d.href === "https://example.com")) fail("markDef missing");
  if (!para.children.some((c) => c.marks.includes("strong") && /Unforgettable/.test(c.text)))
    fail("strong mark missing");
  if (!para.children.map((c) => c.text).join("").includes("Viansa & married"))
    fail("entity decode failed:", para.children.map((c) => c.text).join(""));
  if (blocks.some((b) => JSON.stringify(b).includes("evil"))) fail("script not stripped");

  if (baseFilename(`${SITE}/wp-content/uploads/a/b/photo-683x1024.jpg?x=1`) !== "photo.jpg")
    fail("baseFilename failed");

  console.log(ok ? "SELF-TEST PASSED" : "SELF-TEST FAILED");
  process.exit(ok ? 0 : 1);
}

/* ——— setup ——— */
function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnvLocal();
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN ?? env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local.");
  process.exit(1);
}
if (!token) {
  console.error("Missing SANITY_API_WRITE_TOKEN in .env.local (needed even for --dry-run to read drafts).");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2025-06-01", token, useCdn: false });
const { posts } = JSON.parse(readFileSync(join(process.cwd(), "src/lib/legacy-posts.json"), "utf8"));
const targets = posts.slice(0, LIMIT);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (html) => html?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "";

const report = [];
const log = (line) => {
  console.log(line);
  report.push(line);
};

/* Map already-uploaded assets by filename (with and without WP size suffix). */
log("Loading uploaded image assets from Sanity…");
const assetRows = await client.fetch(
  `*[_type == "sanity.imageAsset"]{ _id, originalFilename }`
);
const assetsByFilename = new Map();
for (const row of assetRows) {
  if (!row.originalFilename) continue;
  assetsByFilename.set(row.originalFilename, row._id);
  const base = row.originalFilename.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, "$1");
  if (!assetsByFilename.has(base)) assetsByFilename.set(base, row._id);
}
log(`${assetRows.length} assets loaded\n`);

const resolveImage = (src) => {
  const name = baseFilename(src);
  return assetsByFilename.get(name) ?? assetsByFilename.get(decodeURIComponent(src.split("/").pop())) ?? null;
};

let filled = 0;
let skipped = 0;
let failed = 0;

for (const post of targets) {
  // Original post content via the WordPress API.
  let wp;
  try {
    const res = await fetch(
      `${SITE}/wp-json/wp/v2/posts?slug=${encodeURIComponent(post.slug)}&_fields=slug,date_gmt,title,content,excerpt`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    wp = (await res.json())[0];
  } catch (err) {
    failed += 1;
    log(`✗ ${post.slug}: WordPress fetch failed (${err.message})`);
    await sleep(REQUEST_DELAY_MS);
    continue;
  }
  if (!wp?.content?.rendered) {
    failed += 1;
    log(`✗ ${post.slug}: no content returned by the API`);
    await sleep(REQUEST_DELAY_MS);
    continue;
  }

  // Target document: the seeded draft (or, optionally, the published post).
  const draftId = `drafts.post-${post.slug.slice(0, 100)}`;
  let doc = await client.getDocument(draftId).catch(() => null);
  let docId = draftId;
  if (!doc && INCLUDE_PUBLISHED) {
    doc = await client
      .fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: post.slug })
      .catch(() => null);
    docId = doc?._id;
  }
  if (!doc) {
    skipped += 1;
    log(`↷ ${post.slug}: no draft found`);
    await sleep(REQUEST_DELAY_MS);
    continue;
  }

  const existingBody = Array.isArray(doc.body) ? doc.body : [];
  const hasWrittenText = existingBody.some((b) => b._type === "block");
  if (hasWrittenText) {
    skipped += 1;
    log(`↷ ${post.slug}: story already has written text; left untouched`);
    await sleep(REQUEST_DELAY_MS);
    continue;
  }

  const { blocks, usedAssets } = htmlToBlocks(wp.content.rendered, resolveImage);
  // Keep image-migration photographs the text does not already place.
  const leftover = existingBody.filter(
    (b) => b._type === "photograph" && b.asset?._ref && !usedAssets.has(b.asset._ref)
  );
  const body = [...blocks, ...leftover];
  const textCount = blocks.filter((b) => b._type === "block").length;
  const imageCount = body.length - textCount;

  const sets = { body };
  if (wp.date_gmt) sets.publishedAt = `${wp.date_gmt}Z`.replace("ZZ", "Z");
  const excerpt = strip(wp.excerpt?.rendered).replace(/\s*\[…\]$/, "…").slice(0, 300);
  // The seed pre-fills the summary with a "Draft carried over…" placeholder;
  // treat that as empty so the real WordPress excerpt replaces it.
  const excerptIsPlaceholder =
    !doc.excerpt || doc.excerpt.startsWith("Draft carried over from the previous website");
  if (excerptIsPlaceholder && excerpt) sets.excerpt = excerpt;

  log(
    `• ${post.slug}: ${textCount} text blocks, ${imageCount} photographs, date ${wp.date_gmt?.slice(0, 10) ?? "unknown"}${DRY_RUN ? " (dry-run)" : ""}`
  );
  if (!DRY_RUN) {
    await client.patch(docId).set(sets).commit();
    filled += 1;
  }
  await sleep(REQUEST_DELAY_MS);
}

log(`\nDone. Stories filled: ${filled} · skipped: ${skipped} · failures: ${failed}`);
log(
  DRY_RUN
    ? "Dry run only: nothing was changed."
    : "Review the drafts in Studio → Blog → Posts, then publish. Original publish dates are set."
);
mkdirSync(join(process.cwd(), "migration"), { recursive: true });
writeFileSync(join(process.cwd(), "migration", "report-text.md"), report.join("\n") + "\n");
console.log("\nReport written to migration/report-text.md");
