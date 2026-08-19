/**
 * Image migration: courtneystockton.com → Sanity, with mapping.
 *
 * Gathers ALL of the previous WordPress site's photographs and files them
 * into the right places in Sanity:
 *
 *  1. MEDIA LIBRARY SWEEP — every uploaded image via the WordPress REST API
 *     (/wp-json/wp/v2/media), at original upload resolution, with alt text
 *     and captions carried onto the Sanity asset. Each item also records the
 *     post/page it was uploaded to (its parent), which powers the mapping.
 *  2. PORTFOLIO MAPPING — pages that hold the portfolio (discovered from
 *     /galleries links and from media parents that are image-heavy pages)
 *     become draft `gallery` documents in the matching section (weddings /
 *     engagements / families), photographs and cover pre-filled.
 *  3. POST ATTACHMENT — each legacy blog post's images (its media-library
 *     children plus anything scraped from its page) attach to the matching
 *     pre-seeded Sanity draft: featured image + story body.
 *
 * Mapping only ever FILLS EMPTY fields and creates DRAFTS; nothing edited or
 * published in the Studio is overwritten. Unclassifiable galleries are
 * reported for a human decision instead of being guessed into a section.
 *
 * Run from the project folder on a machine that can reach the live site:
 *
 *   npm run migrate:images -- --dry-run          # preview all mapping
 *   npm run migrate:images                        # the real thing
 *
 * Flags: --dry-run, --limit N (posts), --max-media N, --media-only,
 *        --posts-only, --include-published, --debug, --self-test
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_WRITE_TOKEN   (sanity.io/manage → API → Tokens → Editor+)
 */
import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://courtneystockton.com";
const USER_AGENT =
  "courtney-stockton-site-migration/1.0 (moving this site's own images to its new CMS)";
const CRAWL_DELAY_MS = 1000;
const DOWNLOAD_DELAY_MS = 400;
const MIN_BYTES = 25 * 1024;
const MAX_BYTES = 30 * 1024 * 1024;
const MAX_IMAGES_PER_POST = 80;
const MIN_GALLERY_IMAGES = 6;
const MAX_GALLERY_PAGES = 40;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SELF_TEST = args.includes("--self-test");
const INCLUDE_PUBLISHED = args.includes("--include-published");
const DEBUG = args.includes("--debug");
const MEDIA_ONLY = args.includes("--media-only");
const POSTS_ONLY = args.includes("--posts-only");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
const maxMediaIdx = args.indexOf("--max-media");
const MAX_MEDIA = maxMediaIdx !== -1 ? Number(args[maxMediaIdx + 1]) : Infinity;

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

/* ——— image URL extraction from WordPress HTML ——— */
export function extractImageUrls(html, baseUrl) {
  const urls = new Set();
  const stats = {};
  const add = (raw, source) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (trimmed.startsWith("data:")) return;
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

  for (const m of html.matchAll(
    /<a\b[^>]*\bhref\s*=\s*["']([^"']*\/wp-content\/uploads\/[^"']+\.(?:jpe?g|png|webp))["']/gi
  )) {
    add(m[1], "a-href");
  }

  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\((["']?)([^"')]+)\1\)/gi)) {
    add(m[2], "background");
  }

  add(html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1], "og:image");
  add(html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1], "og:image");
  return { urls: [...urls], stats };
}

/** Same-site page links from HTML. */
export function extractPageLinks(html, baseUrl) {
  const links = new Set();
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi)) {
    let url;
    try {
      url = new URL(m[1].trim(), baseUrl);
    } catch {
      continue;
    }
    if (url.origin !== new URL(SITE).origin) continue;
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/") continue;
    if (/\.(jpe?g|png|webp|gif|svg|pdf|zip|xml|css|js)$/i.test(path)) continue;
    if (/^\/(wp-admin|wp-json|wp-login|feed|cart|checkout|category|tag|author|page)\b/.test(path))
      continue;
    if (url.search.includes("replytocom")) continue;
    links.add(`${SITE}${path}`);
  }
  return [...links];
}

/** name-768x1024.jpg → name.jpg (the WordPress full-size original). */
export function fullSizeCandidate(url) {
  const stripped = url.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, "$1");
  return stripped === url ? null : stripped;
}

/** Which portfolio section does a gallery page belong to? null = ask a human. */
export function classifyCategory(text) {
  const t = (text ?? "").toLowerCase();
  if (/(engagement|couple|proposal|in-love|in love)/.test(t)) return "engagement";
  if (/(famil|little|kids|maternity|newborn|senior)/.test(t)) return "family";
  if (/(wedding|bride|groom|elope|i-do|i do)/.test(t)) return "wedding";
  return null;
}

/** "Weddings | Courtney Stockton Photography" → "Weddings" */
export function cleanTitle(raw) {
  return (raw ?? "")
    .replace(/\s*[|–-]\s*Courtney Stockton( Photography)?.*$/i, "")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;/g, "'")
    .replace(/&#82(1[6-7]|2[0-1]);/g, "'")
    .trim();
}

/* ——— self-test ——— */
if (SELF_TEST) {
  let ok = true;
  const fail = (...msg) => ((ok = false), console.error(...msg));

  const fixture = `
    <img src="/wp-content/uploads/2021/06/a-683x1024.jpg"
         srcset="/wp-content/uploads/2021/06/a-683x1024.jpg 683w, /wp-content/uploads/2021/06/a-200x300.jpg 200w">
    <img src="data:image/gif;base64,x" data-src="/wp-content/uploads/2021/06/lazy.jpg">
    <img data-orig-file="${SITE}/wp-content/uploads/2021/06/jp.jpg">
    <a href="/wp-content/uploads/2021/06/full.jpg"><img src="data:image/gif;base64,x"></a>
    <div style="background-image: url('/wp-content/uploads/2021/06/bg.jpg')"></div>
    <img src="/wp-content/uploads/logo-white.png">
    <img src="/wp-content/uploads/2020/01/anim.gif">
    <a href="/wedding-portfolio/">w</a><a href="${SITE}/galleries">g</a>
    <a href="https://instagram.com/x">e</a><a href="/wp-admin/x">a</a><a href="/category/weddings-2/">c</a>
  `;
  const got = extractImageUrls(fixture, SITE).urls;
  for (const u of [
    `${SITE}/wp-content/uploads/2021/06/a-683x1024.jpg`,
    `${SITE}/wp-content/uploads/2021/06/lazy.jpg`,
    `${SITE}/wp-content/uploads/2021/06/jp.jpg`,
    `${SITE}/wp-content/uploads/2021/06/full.jpg`,
    `${SITE}/wp-content/uploads/2021/06/bg.jpg`,
  ])
    if (!got.includes(u)) fail("MISSING:", u);
  for (const u of [`${SITE}/wp-content/uploads/logo-white.png`, `${SITE}/wp-content/uploads/2020/01/anim.gif`])
    if (got.includes(u)) fail("SHOULD BE EXCLUDED:", u);

  const links = extractPageLinks(fixture, SITE).sort();
  if (JSON.stringify(links) !== JSON.stringify([`${SITE}/galleries`, `${SITE}/wedding-portfolio`].sort()))
    fail("extractPageLinks failed:", links);

  if (fullSizeCandidate(`${SITE}/wp-content/uploads/x-683x1024.jpg`) !== `${SITE}/wp-content/uploads/x.jpg`)
    fail("fullSizeCandidate strip failed");
  if (fullSizeCandidate(`${SITE}/wp-content/uploads/x.jpg`) !== null)
    fail("fullSizeCandidate null failed");

  const classifications = [
    ["wedding-portfolio", "wedding"],
    ["Sonoma Engagement Sessions", "engagement"],
    ["little-ones-gallery", "family"],
    ["families", "family"],
    ["In Love: Couples", "engagement"],
    ["about-me", null],
  ];
  for (const [input, want] of classifications)
    if (classifyCategory(input) !== want)
      fail(`classifyCategory(${input}) = ${classifyCategory(input)}, want ${want}`);

  if (cleanTitle("Weddings | Courtney Stockton Photography") !== "Weddings")
    fail("cleanTitle failed");

  console.log(ok ? "SELF-TEST PASSED" : "SELF-TEST FAILED");
  process.exit(ok ? 0 : 1);
}

/* ——— setup ——— */
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
    "Missing SANITY_API_WRITE_TOKEN in .env.local (Editor/Developer token from sanity.io/manage),\n" +
      "or run with --dry-run to preview without uploading."
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2025-06-01", token, useCdn: false });

const { posts } = JSON.parse(
  readFileSync(join(process.cwd(), "src/lib/legacy-posts.json"), "utf8")
);
const targets = posts.slice(0, LIMIT);
const legacySlugs = new Set(posts.map((p) => p.slug));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = () => createHash("md5").update(String(Math.random())).digest("hex").slice(0, 12);
const strip = (html) => html?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "";

async function fetchWithUA(url, opts = {}) {
  return fetch(url, { ...opts, headers: { "User-Agent": USER_AGENT, ...opts.headers } });
}

const report = [];
const log = (line) => {
  console.log(line);
  report.push(line);
};

/* Global caches: nothing fetched or uploaded twice, across all phases. */
const downloadedByUrl = new Map(); // image url -> local path (null = skipped)
const uploadedByPath = new Map(); // local path -> sanity asset
let imagesUploaded = 0;

async function downloadImage(url, dir) {
  if (downloadedByUrl.has(url)) {
    const path = downloadedByUrl.get(url);
    return path ? { path, filename: path.split("/").pop(), cached: true } : null;
  }
  const filename = decodeURIComponent(url.split("/").pop());
  const path = join(dir, filename);
  if (existsSync(path)) {
    downloadedByUrl.set(url, path);
    return { path, filename, cached: true };
  }

  let finalUrl = url;
  const full = fullSizeCandidate(url);
  if (full && !downloadedByUrl.has(full)) {
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
  if (buf.length < MIN_BYTES || buf.length > MAX_BYTES) {
    downloadedByUrl.set(url, null);
    return null;
  }
  writeFileSync(path, buf);
  downloadedByUrl.set(url, path);
  return { path, filename, cached: false };
}

async function uploadToSanity(file, meta = {}) {
  if (uploadedByPath.has(file.path)) return uploadedByPath.get(file.path);
  const asset = await client.assets.upload("image", readFileSync(file.path), {
    filename: file.filename,
  });
  const patchFields = {};
  if (meta.altText) patchFields.altText = meta.altText;
  if (meta.title) patchFields.title = meta.title;
  if (meta.description) patchFields.description = meta.description;
  if (Object.keys(patchFields).length > 0) {
    await client.patch(asset._id).set(patchFields).commit().catch(() => {});
  }
  uploadedByPath.set(file.path, asset);
  imagesUploaded += 1;
  return asset;
}

/** Download+upload one URL (with metadata); returns asset or null. */
async function assetForUrl(url, dir, meta) {
  try {
    const file = await downloadImage(url, dir);
    if (!file) return null;
    const asset = await uploadToSanity(file, meta);
    if (!file.cached) await sleep(DOWNLOAD_DELAY_MS);
    return asset;
  } catch (err) {
    log(`  ! ${url}: ${err.message}`);
    return null;
  }
}

const photographBlock = (asset, alt) => ({
  _type: "photograph",
  _key: key(),
  asset: { _type: "reference", _ref: asset._id },
  ...(alt ? { alt } : {}),
});

/* ——— Phase 1: media library sweep (+ parent mapping) ——— */
const mediaItems = []; // {url, alt, title, caption, parent, date}

async function sweepMediaLibrary(uploadNow = true) {
  log("Phase 1: WordPress media library (/wp-json/wp/v2/media)");
  const raw = [];
  for (let page = 1; raw.length < MAX_MEDIA; page += 1) {
    let res;
    try {
      res = await fetchWithUA(
        `${SITE}/wp-json/wp/v2/media?media_type=image&per_page=100&page=${page}`
      );
    } catch (err) {
      log(`  media API unreachable (${err.message})`);
      return null;
    }
    if (res.status === 400) break;
    if (!res.ok) {
      log(`  media API unavailable (HTTP ${res.status}); relying on page data only`);
      return null;
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    raw.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? page);
    log(`  fetched page ${page}/${totalPages} (${raw.length} items so far)`);
    if (page >= totalPages) break;
    await sleep(CRAWL_DELAY_MS / 2);
  }

  for (const item of raw.slice(0, MAX_MEDIA)) {
    if (!/image\/(jpe?g|png|webp)/.test(item.mime_type ?? "")) continue;
    const url = (item.source_url ?? "").split("?")[0];
    if (!/\/wp-content\/uploads\//.test(url)) continue;
    mediaItems.push({
      url,
      alt: strip(item.alt_text),
      title: strip(item.title?.rendered),
      caption: strip(item.caption?.rendered),
      parent: item.post || null,
      date: item.date ?? "",
    });
  }
  log(`  ${mediaItems.length} photographs in the media library`);

  if (!DRY_RUN && uploadNow) {
    const dir = join(process.cwd(), "migration", "downloads", "_media-library");
    mkdirSync(dir, { recursive: true });
    let done = 0;
    for (const item of mediaItems) {
      await assetForUrl(item.url, dir, {
        altText: item.alt,
        title: item.title,
        description: item.caption,
      });
      done += 1;
      if (done % 25 === 0) log(`  ${done}/${mediaItems.length} uploaded…`);
    }
    log(`  media library uploads done (${done})`);
  }
  return mediaItems.length;
}

/** Resolve media parents (the post/page each image was uploaded to). */
const parentGroups = new Map(); // slug -> {title, kind, items: [mediaItem]}

async function resolveParents() {
  const ids = [...new Set(mediaItems.map((i) => i.parent).filter(Boolean))];
  if (ids.length === 0) return;
  log(`  resolving ${ids.length} media parents (which post/page each image belongs to)`);
  for (const id of ids) {
    let info = null;
    for (const kind of ["posts", "pages"]) {
      try {
        const res = await fetchWithUA(
          `${SITE}/wp-json/wp/v2/${kind}/${id}?_fields=slug,title`
        );
        if (res.ok) {
          const body = await res.json();
          info = { slug: body.slug, title: cleanTitle(strip(body.title?.rendered)), kind };
          break;
        }
      } catch {
        /* try next kind */
      }
    }
    if (info?.slug) {
      const group = parentGroups.get(info.slug) ?? { ...info, items: [] };
      group.items.push(...mediaItems.filter((i) => i.parent === id));
      parentGroups.set(info.slug, group);
    }
    await sleep(150);
  }
  for (const group of parentGroups.values()) {
    group.items.sort((a, b) => a.date.localeCompare(b.date));
  }
  log(`  ${parentGroups.size} parent posts/pages mapped`);
}

/* ——— Phase 2: portfolio galleries ——— */
async function mapPortfolioGalleries() {
  log("\nPhase 2: mapping portfolio galleries");
  // Candidate galleries: pages linked from /galleries + image-heavy media parents
  const candidates = new Map(); // slug -> {title, urls:[{url,alt}], source}

  // 2a. Pages linked from the /galleries index.
  let galleryLinks = [];
  try {
    const res = await fetchWithUA(`${SITE}/galleries`);
    if (res.ok) galleryLinks = extractPageLinks(await res.text(), `${SITE}/galleries`);
  } catch {
    /* index unreachable; parent groups still cover us */
  }
  galleryLinks = galleryLinks
    .map((l) => l.replace(`${SITE}/`, ""))
    .filter((slug) => slug && slug !== "galleries" && !legacySlugs.has(slug))
    .slice(0, MAX_GALLERY_PAGES);

  for (const slug of galleryLinks) {
    try {
      const res = await fetchWithUA(`${SITE}/${slug}/`);
      if (!res.ok) continue;
      const html = await res.text();
      const title = cleanTitle(
        strip(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) ||
          strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]) ||
          slug
      );
      const { urls } = extractImageUrls(html, `${SITE}/${slug}/`);
      if (urls.length >= MIN_GALLERY_IMAGES) {
        candidates.set(slug, { title, urls: urls.map((url) => ({ url })), source: "galleries page" });
      }
    } catch {
      /* skip page */
    }
    await sleep(CRAWL_DELAY_MS);
  }

  // 2b. Image-heavy WordPress pages found via media parents.
  for (const [slug, group] of parentGroups) {
    if (group.kind !== "pages") continue;
    if (legacySlugs.has(slug)) continue;
    if (group.items.length < MIN_GALLERY_IMAGES) continue;
    const existing = candidates.get(slug);
    const urls = group.items.map((i) => ({ url: i.url, alt: i.alt }));
    if (existing) {
      const seen = new Set(existing.urls.map((u) => u.url));
      existing.urls.push(...urls.filter((u) => !seen.has(u.url)));
      existing.source += " + media parents";
    } else {
      candidates.set(slug, { title: group.title || slug, urls, source: "media parents" });
    }
  }

  if (candidates.size === 0) {
    log("  no portfolio gallery pages discovered; nothing to map");
    return;
  }

  const unclassified = [];
  for (const [slug, cand] of candidates) {
    const category = classifyCategory(`${slug} ${cand.title}`);
    if (!category) {
      unclassified.push(`${slug} ("${cand.title}", ${cand.urls.length} images)`);
      continue;
    }
    log(
      `  → ${cand.title}: ${cand.urls.length} images → ${category} portfolio [${cand.source}]${DRY_RUN ? " (dry-run)" : ""}`
    );
    if (DRY_RUN) continue;

    const draftId = `drafts.gallery-${slug.slice(0, 100)}`;
    const existing =
      (await client.getDocument(draftId).catch(() => null)) ??
      (await client
        .fetch(`*[_type == "gallery" && slug.current == $slug][0]`, { slug })
        .catch(() => null));
    if (existing?.photographs?.length) {
      log(`    ↷ gallery already has photographs; left untouched`);
      continue;
    }

    const dir = join(process.cwd(), "migration", "downloads", `gallery-${slug}`);
    mkdirSync(dir, { recursive: true });
    const assets = [];
    for (const { url, alt } of cand.urls.slice(0, 150)) {
      const asset = await assetForUrl(url, dir, { altText: alt });
      if (asset) assets.push({ asset, alt });
    }
    if (assets.length === 0) continue;

    const doc = {
      // Always write to the DRAFT id: if a published-but-empty gallery with
      // this slug exists, it gets a filled draft rather than being replaced.
      _id: draftId,
      _type: "gallery",
      title: existing?.title ?? cand.title,
      slug: existing?.slug ?? { _type: "slug", current: slug },
      category: existing?.category ?? category,
      coverImage:
        existing?.coverImage?.asset != null
          ? existing.coverImage
          : { _type: "photograph", asset: { _type: "reference", _ref: assets[0].asset._id }, alt: assets[0].alt || cand.title },
      photographs: assets.map(({ asset, alt }) => photographBlock(asset, alt)),
      introduction:
        existing?.introduction ??
        "Moved over from the previous website. Review the order, pick your favorite cover, then publish.",
    };
    const merged = { ...existing, ...doc };
    delete merged._rev;
    delete merged._createdAt;
    delete merged._updatedAt;
    await client.createOrReplace(merged);
    log(`    ✓ draft gallery created with ${assets.length} photographs (${draftId})`);
  }

  if (unclassified.length > 0) {
    log(`  ? could not classify (create these by hand in the Studio if wanted):`);
    for (const u of unclassified) log(`    - ${u}`);
  }
}

/* ——— Phase 3: attach images to legacy blog drafts ——— */
async function attachToPosts() {
  log(`\nPhase 3: attaching images to ${targets.length} legacy blog drafts`);
  let pagesFailed = 0;
  let postsPatched = 0;
  let postsSkipped = 0;

  for (const post of targets) {
    const pageUrl = `${SITE}/${post.slug}/`;
    const dir = join(process.cwd(), "migration", "downloads", post.slug);
    mkdirSync(dir, { recursive: true });

    // Primary source: the post's own media-library children (complete, ordered).
    const children = parentGroups.get(post.slug)?.items ?? [];
    const wanted = children.map((i) => ({ url: i.url, alt: i.alt }));

    // Supplement with whatever the page itself shows.
    let html = null;
    try {
      const res = await fetchWithUA(pageUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err) {
      if (wanted.length === 0) {
        pagesFailed += 1;
        log(`✗ ${post.slug}: page fetch failed (${err.message})`);
        await sleep(CRAWL_DELAY_MS);
        continue;
      }
    }
    if (html) {
      if (DEBUG) {
        const debugDir = join(process.cwd(), "migration", "debug");
        mkdirSync(debugDir, { recursive: true });
        writeFileSync(join(debugDir, `${post.slug}.html`), html);
      }
      const extracted = extractImageUrls(html, pageUrl);
      if (DEBUG) log(`  [debug] extraction sources: ${JSON.stringify(extracted.stats)}`);
      const seen = new Set(wanted.map((w) => w.url));
      for (const url of extracted.urls) {
        if (!seen.has(url)) wanted.push({ url });
      }
    }

    const capped = wanted.slice(0, MAX_IMAGES_PER_POST);
    log(
      `• ${post.slug}: ${capped.length} photographs (${children.length} from media library)${DRY_RUN ? " (dry-run)" : ""}`
    );

    if (DRY_RUN || capped.length === 0) {
      await sleep(CRAWL_DELAY_MS);
      continue;
    }

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
      log(`  ↷ no draft found (already published or removed); images kept in the media library`);
      await sleep(CRAWL_DELAY_MS);
      continue;
    }

    const assets = [];
    for (const { url, alt } of capped) {
      const asset = await assetForUrl(url, dir, { altText: alt });
      if (asset) assets.push({ asset, alt });
    }
    if (assets.length === 0) {
      await sleep(CRAWL_DELAY_MS);
      continue;
    }

    const patch = client.patch(docId);
    let changed = false;
    if (!doc.featuredImage?.asset) {
      patch.set({
        featuredImage: {
          _type: "photograph",
          asset: { _type: "reference", _ref: assets[0].asset._id },
          alt: assets[0].alt || post.title.replace(/\s*\|\s*/g, ", "),
        },
      });
      changed = true;
    }
    if (!doc.body || doc.body.length === 0) {
      patch.set({
        body: assets.slice(1).map(({ asset, alt }) => photographBlock(asset, alt)),
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
  return { pagesFailed, postsPatched, postsSkipped };
}

/* ——— main ——— */
log(`Image migration from ${SITE}`);
log(`dry-run: ${DRY_RUN} · media-only: ${MEDIA_ONLY} · posts-only: ${POSTS_ONLY}\n`);

let mediaCount = null;
if (!POSTS_ONLY) {
  mediaCount = await sweepMediaLibrary();
  if (mediaCount !== null) await resolveParents();
  if (!MEDIA_ONLY) await mapPortfolioGalleries();
} else {
  // Posts-only still benefits from parent mapping when the API is reachable,
  // but uploads happen lazily per post rather than for the whole library.
  mediaCount = await sweepMediaLibrary(false);
  if (mediaCount !== null) await resolveParents();
}

let postStats = { pagesFailed: 0, postsPatched: 0, postsSkipped: 0 };
if (!MEDIA_ONLY) {
  postStats = await attachToPosts();
}

log(`\nDone. Images uploaded to Sanity: ${imagesUploaded}`);
if (mediaCount !== null) log(`Media library items found: ${mediaCount}`);
if (!MEDIA_ONLY)
  log(
    `Posts filled: ${postStats.postsPatched} · skipped: ${postStats.postsSkipped} · page failures: ${postStats.pagesFailed}`
  );
log(
  DRY_RUN
    ? "Dry run only: nothing was uploaded or changed."
    : "In the Studio: Media tab for everything, Portfolio for the new gallery drafts, Blog → Posts for the filled drafts."
);

mkdirSync(join(process.cwd(), "migration"), { recursive: true });
writeFileSync(join(process.cwd(), "migration", "report.md"), report.join("\n") + "\n");
console.log("\nReport written to migration/report.md");
