/**
 * Image migration: courtneystockton.com → Sanity.
 *
 * Crawls the previous WordPress site's blog posts (the URL inventory in
 * src/lib/legacy-posts.json), downloads Courtney's photographs, uploads them
 * to the Sanity asset store, and attaches them to the matching pre-seeded
 * draft posts (drafts.post-<slug>): the first image becomes the featured
 * photograph, the rest go into the story body. Only EMPTY fields are filled,
 * so nothing edited in the Studio is ever overwritten.
 *
 * Run from the project folder on a machine that can reach the live site:
 *
 *   npm run migrate:images -- --dry-run --limit 3    # preview, first 3 posts
 *   npm run migrate:images                            # the real thing
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_WRITE_TOKEN   (sanity.io/manage → API → Tokens → Editor)
 *
 * Notes:
 * - These are the site's web-resolution copies, not camera originals. Fine
 *   for review and interim content; long-term, upload originals in the Studio.
 * - Re-runs are safe: downloads are cached in migration/downloads/, Sanity
 *   dedupes identical assets by content hash, and filled fields are skipped.
 * - Flags: --dry-run (no uploads/writes), --limit N, --include-published
 *   (also fill empty published posts, not just drafts), --self-test.
 */
import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://courtneystockton.com";
const USER_AGENT =
  "courtney-stockton-site-migration/1.0 (moving this site's own images to its new CMS)";
const CRAWL_DELAY_MS = 1000;
const MIN_BYTES = 25 * 1024;
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_IMAGES_PER_POST = 80;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SELF_TEST = args.includes("--self-test");
const INCLUDE_PUBLISHED = args.includes("--include-published");
const DEBUG = args.includes("--debug");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

/* ——— tiny .env.local parser (no dependency) ——— */
function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) {
      out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

/* ——— image URL extraction from WordPress HTML ———
 * WordPress themes and lazy-load plugins scatter the real image URL across
 * many places: src, srcset, data-src / data-lazy-src (placeholder in src),
 * Jetpack's data-orig-file / data-large-file, lightbox <a href> links to the
 * full-size file, and inline background-image styles. Collect them all; the
 * shared filter keeps only real photographs from /wp-content/uploads/.
 * Returns {urls, stats} where stats counts contributions per pattern. */
export function extractImageUrls(html, baseUrl) {
  const urls = new Set();
  const stats = {};
  const add = (raw, source) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (trimmed.startsWith("data:")) return; // placeholder shims
    let url;
    try {
      url = new URL(trimmed, baseUrl).href.split("?")[0].split("#")[0];
    } catch {
      return;
    }
    if (!/\/wp-content\/uploads\//.test(url)) return;
    if (!/\.(jpe?g|png|webp)$/i.test(url)) return;
    if (/logo|favicon|icon|watermark|signature/i.test(url)) return;
    if (!urls.has(url)) {
      urls.add(url);
      stats[source] = (stats[source] ?? 0) + 1;
    }
  };

  const widest = (srcset) => {
    let best = null;
    let bestW = 0;
    for (const part of srcset.split(",")) {
      const [u, d] = part.trim().split(/\s+/);
      const w = d?.endsWith("w") ? parseInt(d) : 0;
      if (w >= bestW) {
        bestW = w;
        best = u;
      }
    }
    return best;
  };

  const attr = (tag, name) =>
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];

  for (const tag of html.match(/<(?:img|source)\b[^>]*>/gi) ?? []) {
    add(attr(tag, "src"), "src");
    // Lazy-load variants: the real image hides in data-* attributes.
    for (const name of [
      "data-src",
      "data-lazy-src",
      "data-orig-file",
      "data-large-file",
      "data-full-url",
      "data-large_image",
    ]) {
      add(attr(tag, name), name);
    }
    for (const name of ["srcset", "data-srcset", "data-lazy-srcset"]) {
      const set = attr(tag, name);
      if (set) add(widest(set), name);
    }
  }

  // Lightbox links to the full-size file.
  for (const m of html.matchAll(
    /<a\b[^>]*\bhref\s*=\s*["']([^"']*\/wp-content\/uploads\/[^"']+\.(?:jpe?g|png|webp))["']/gi
  )) {
    add(m[1], "a-href");
  }

  // Inline background images.
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\((["']?)([^"')]+)\1\)/gi)) {
    add(m[2], "background");
  }

  add(html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1], "og:image");
  add(html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1], "og:image");
  return { urls: [...urls], stats };
}

/** name-768x1024.jpg → name.jpg (the WordPress full-size original). */
export function fullSizeCandidate(url) {
  const stripped = url.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, "$1");
  return stripped === url ? null : stripped;
}

/* ——— self-test: verify extraction logic against a WordPress-style fixture ——— */
if (SELF_TEST) {
  const fixture = `
    <img src="/wp-content/uploads/2021/06/lisa-zach-0042-683x1024.jpg"
         srcset="/wp-content/uploads/2021/06/lisa-zach-0042-683x1024.jpg 683w,
                 /wp-content/uploads/2021/06/lisa-zach-0042-200x300.jpg 200w">
    <img src="https://courtneystockton.com/wp-content/uploads/2021/06/reception.jpeg">
    <img src="/wp-content/uploads/logo-white.png">
    <img src="/wp-content/themes/foo/decoration.jpg">
    <img src="/wp-content/uploads/2020/01/anim.gif">
    <img src="data:image/svg+xml,%3Csvg%20xmlns=..."
         data-src="/wp-content/uploads/2021/06/lazy-portrait.jpg">
    <img src="data:image/gif;base64,R0lGOD"
         data-lazy-srcset="/wp-content/uploads/2021/06/lazy-set-300x200.jpg 300w,
                           /wp-content/uploads/2021/06/lazy-set-1024x683.jpg 1024w">
    <img data-orig-file="https://courtneystockton.com/wp-content/uploads/2021/06/jetpack-orig.jpg">
    <a href="/wp-content/uploads/2021/06/lightbox-full.jpg"><img src="data:image/gif;base64,x"></a>
    <div style="background-image: url('/wp-content/uploads/2021/06/bg-hero.jpg')"></div>
    <meta property="og:image" content="https://courtneystockton.com/wp-content/uploads/2021/06/hero.jpg?fit=1200" />
  `;
  const got = extractImageUrls(fixture, SITE).urls.sort();
  const expectPresent = [
    `${SITE}/wp-content/uploads/2021/06/lisa-zach-0042-683x1024.jpg`,
    `${SITE}/wp-content/uploads/2021/06/reception.jpeg`,
    `${SITE}/wp-content/uploads/2021/06/hero.jpg`,
    `${SITE}/wp-content/uploads/2021/06/lazy-portrait.jpg`,
    `${SITE}/wp-content/uploads/2021/06/lazy-set-1024x683.jpg`,
    `${SITE}/wp-content/uploads/2021/06/jetpack-orig.jpg`,
    `${SITE}/wp-content/uploads/2021/06/lightbox-full.jpg`,
    `${SITE}/wp-content/uploads/2021/06/bg-hero.jpg`,
  ];
  const expectAbsent = [
    `${SITE}/wp-content/uploads/logo-white.png`,
    `${SITE}/wp-content/themes/foo/decoration.jpg`,
    `${SITE}/wp-content/uploads/2020/01/anim.gif`,
    `${SITE}/wp-content/uploads/2021/06/lazy-set-300x200.jpg`,
  ];
  let ok = true;
  for (const u of expectPresent)
    if (!got.includes(u)) (ok = false), console.error("MISSING:", u);
  for (const u of expectAbsent)
    if (got.includes(u)) (ok = false), console.error("SHOULD BE EXCLUDED:", u);
  const fs = fullSizeCandidate(`${SITE}/wp-content/uploads/2021/06/a-683x1024.jpg`);
  if (fs !== `${SITE}/wp-content/uploads/2021/06/a.jpg`)
    (ok = false), console.error("fullSizeCandidate failed:", fs);
  if (fullSizeCandidate(`${SITE}/wp-content/uploads/2021/06/a.jpg`) !== null)
    (ok = false), console.error("fullSizeCandidate should be null for originals");
  console.log(ok ? "SELF-TEST PASSED" : "SELF-TEST FAILED");
  process.exit(ok ? 0 : 1);
}

/* ——— main ——— */
const env = loadEnvLocal();
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN ?? env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local.");
  process.exit(1);
}
if (!token && !DRY_RUN) {
  console.error(
    "Missing SANITY_API_WRITE_TOKEN in .env.local.\n" +
      "Create one at sanity.io/manage → your project → API → Tokens → Add API token\n" +
      "(permissions: Editor), then add a line to .env.local:\n" +
      "SANITY_API_WRITE_TOKEN=sk...\n" +
      "Or run with --dry-run to preview without uploading."
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-06-01",
  token,
  useCdn: false,
});

const { posts } = JSON.parse(
  readFileSync(join(process.cwd(), "src/lib/legacy-posts.json"), "utf8")
);
const targets = posts.slice(0, LIMIT);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = () => createHash("md5").update(String(Math.random())).digest("hex").slice(0, 12);

async function fetchWithUA(url, opts = {}) {
  return fetch(url, { ...opts, headers: { "User-Agent": USER_AGENT, ...opts.headers } });
}

async function downloadImage(url, dir) {
  const filename = decodeURIComponent(url.split("/").pop());
  const path = join(dir, filename);
  if (existsSync(path)) return { path, filename, cached: true };

  // Prefer the WordPress full-size original when it exists.
  let finalUrl = url;
  const full = fullSizeCandidate(url);
  if (full) {
    try {
      const head = await fetchWithUA(full, { method: "HEAD" });
      if (head.ok) finalUrl = full;
    } catch {
      /* keep the sized URL */
    }
  }

  const res = await fetchWithUA(finalUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) return null; // thumbnail/icon, skip
  if (buf.length > MAX_BYTES) return null;
  writeFileSync(path, buf);
  return { path, filename, cached: false };
}

const report = [];
const log = (line) => {
  console.log(line);
  report.push(line);
};

let pagesOk = 0;
let pagesFailed = 0;
let imagesUploaded = 0;
let postsPatched = 0;
let postsSkipped = 0;

log(`Image migration from ${SITE}`);
log(`${targets.length} posts · dry-run: ${DRY_RUN}\n`);

for (const post of targets) {
  const pageUrl = `${SITE}/${post.slug}/`;
  const dir = join(process.cwd(), "migration", "downloads", post.slug);
  mkdirSync(dir, { recursive: true });

  let html;
  try {
    const res = await fetchWithUA(pageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
    pagesOk += 1;
  } catch (err) {
    pagesFailed += 1;
    log(`✗ ${post.slug}: page fetch failed (${err.message})`);
    await sleep(CRAWL_DELAY_MS);
    continue;
  }

  if (DEBUG) {
    const debugDir = join(process.cwd(), "migration", "debug");
    mkdirSync(debugDir, { recursive: true });
    writeFileSync(join(debugDir, `${post.slug}.html`), html);
  }
  const extracted = extractImageUrls(html, pageUrl);
  if (DEBUG) {
    log(`  [debug] extraction sources: ${JSON.stringify(extracted.stats)}`);
  }
  const urls = extracted.urls.slice(0, MAX_IMAGES_PER_POST);
  const files = [];
  for (const url of urls) {
    try {
      const file = await downloadImage(url, dir);
      if (file) files.push(file);
      if (!file?.cached) await sleep(CRAWL_DELAY_MS / 2);
    } catch (err) {
      log(`  ! image failed: ${url} (${err.message})`);
    }
  }
  log(`• ${post.slug}: ${files.length} photographs${DRY_RUN ? " (dry-run, not uploaded)" : ""}`);

  if (DRY_RUN || files.length === 0) {
    await sleep(CRAWL_DELAY_MS);
    continue;
  }

  // Find the target document: the seeded draft, else (optionally) the published post.
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
    postsSkipped += 1;
    log(`  ↷ no draft found (already published or removed); images downloaded only`);
    await sleep(CRAWL_DELAY_MS);
    continue;
  }

  // Upload assets (Sanity dedupes identical files by hash).
  const assets = [];
  for (const file of files) {
    const asset = await client.assets.upload("image", readFileSync(file.path), {
      filename: file.filename,
    });
    assets.push(asset);
    imagesUploaded += 1;
  }

  // Fill only empty fields.
  const patch = client.patch(docId);
  let changed = false;
  if (!doc.featuredImage?.asset) {
    patch.set({
      featuredImage: {
        _type: "photograph",
        asset: { _type: "reference", _ref: assets[0]._id },
        alt: post.title.replace(/\s*\|\s*/g, ", "),
      },
    });
    changed = true;
  }
  if (!doc.body || doc.body.length === 0) {
    patch.set({
      body: assets.slice(1).map((asset) => ({
        _type: "photograph",
        _key: key(),
        asset: { _type: "reference", _ref: asset._id },
      })),
    });
    changed = true;
  }
  if (changed) {
    await patch.commit();
    postsPatched += 1;
    log(`  ✓ attached ${assets.length} photographs to ${docId}`);
  } else {
    postsSkipped += 1;
    log(`  ↷ post already has a featured image and body; left untouched`);
  }

  await sleep(CRAWL_DELAY_MS);
}

log(`\nDone. Pages fetched: ${pagesOk} (failed: ${pagesFailed})`);
log(`Images uploaded: ${imagesUploaded} · posts filled: ${postsPatched} · skipped: ${postsSkipped}`);
log(
  DRY_RUN
    ? "Dry run only: nothing was uploaded or changed."
    : "Open the Studio → Blog → Posts to review the drafts, then publish each when ready."
);
log(
  "Reminder: these are the old site's web-resolution copies. For final quality, replace with full-resolution exports in the Studio over time."
);

mkdirSync(join(process.cwd(), "migration"), { recursive: true });
writeFileSync(join(process.cwd(), "migration", "report.md"), report.join("\n") + "\n");
console.log("\nReport written to migration/report.md");
