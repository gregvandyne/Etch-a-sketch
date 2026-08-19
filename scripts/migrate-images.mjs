/**
 * Image migration: courtneystockton.com → Sanity.
 *
 * Gathers ALL of the previous WordPress site's photographs in three phases:
 *
 *  1. MEDIA LIBRARY SWEEP — WordPress exposes every uploaded image through
 *     its built-in REST API (/wp-json/wp/v2/media), at original upload
 *     resolution, with alt text and captions. This captures the whole
 *     library regardless of where (or whether) each image appears on a page.
 *  2. SITE CRAWL (fallback / supplement) — if the API is disabled, crawl
 *     every same-site page (seeds + sitemap + internal links) and harvest
 *     images from the HTML, including lazy-loaded and lightbox variants.
 *  3. POST ATTACHMENT — images found on each legacy blog post's page are
 *     attached to its pre-seeded Sanity draft (featured image + body).
 *     Only EMPTY fields are filled; Studio edits are never overwritten.
 *
 * Everything uploaded lands in the Sanity asset store, browsable under the
 * Studio's Media tab and selectable from any image field.
 *
 * Run from the project folder on a machine that can reach the live site:
 *
 *   npm run migrate:images -- --dry-run          # preview counts, no writes
 *   npm run migrate:images                        # the real thing
 *
 * Flags: --dry-run, --limit N (posts), --max-media N, --media-only,
 *        --posts-only, --include-published, --debug, --self-test
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_WRITE_TOKEN   (sanity.io/manage → API → Tokens → Editor+)
 *
 * Notes:
 * - Media-library originals are the files Courtney uploaded to WordPress:
 *   the best quality the old site has, though possibly below camera-original
 *   resolution. Replaceable with full exports in the Studio over time.
 * - Re-runs are safe: downloads cache under migration/downloads/, Sanity
 *   dedupes identical assets by content hash, filled post fields are skipped.
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
const MAX_CRAWL_PAGES = 200;

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

/* ——— image URL extraction from WordPress HTML ———
 * Real URLs hide in many places: src, srcset, lazy-load data-* attributes,
 * Jetpack's data-orig-file, lightbox <a href> links, background-image styles.
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

/** Same-site page links from HTML (for the crawl fallback). */
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
    if (/\.(jpe?g|png|webp|gif|svg|pdf|zip|xml|css|js)$/i.test(path)) continue;
    if (/^\/(wp-admin|wp-json|wp-login|feed|cart|checkout)/.test(path)) continue;
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

/* ——— self-test: extraction logic against WordPress-style fixtures ——— */
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
    <a href="/weddings-page/">link</a>
    <a href="https://courtneystockton.com/galleries">g</a>
    <a href="https://instagram.com/whatever">ext</a>
    <a href="/wp-admin/post.php">admin</a>
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
  const links = extractPageLinks(fixture, SITE).sort();
  const wantLinks = [`${SITE}/galleries`, `${SITE}/weddings-page`].sort();
  if (JSON.stringify(links.filter((l) => !l.includes("uploads"))) !== JSON.stringify(wantLinks))
    (ok = false), console.error("extractPageLinks failed:", links);
  const fs = fullSizeCandidate(`${SITE}/wp-content/uploads/2021/06/a-683x1024.jpg`);
  if (fs !== `${SITE}/wp-content/uploads/2021/06/a.jpg`)
    (ok = false), console.error("fullSizeCandidate failed:", fs);
  if (fullSizeCandidate(`${SITE}/wp-content/uploads/2021/06/a.jpg`) !== null)
    (ok = false), console.error("fullSizeCandidate should be null for originals");
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
    "Missing SANITY_API_WRITE_TOKEN in .env.local.\n" +
      "Create one at sanity.io/manage → your project → API → Tokens (Editor or Developer),\n" +
      "add: SANITY_API_WRITE_TOKEN=sk...\n" +
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

const report = [];
const log = (line) => {
  console.log(line);
  report.push(line);
};

/* Global download + upload caches so no file is fetched or uploaded twice. */
const downloadedByUrl = new Map(); // image url -> local path (or null = skipped)
const uploadedByPath = new Map(); // local path -> sanity asset

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

  // Prefer the WordPress full-size original when it exists.
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
    return null; // icon/thumbnail or unreasonably large
  }
  writeFileSync(path, buf);
  downloadedByUrl.set(url, path);
  return { path, filename, cached: false };
}

let imagesUploaded = 0;

async function uploadToSanity(file, meta = {}) {
  if (uploadedByPath.has(file.path)) return uploadedByPath.get(file.path);
  const asset = await client.assets.upload("image", readFileSync(file.path), {
    filename: file.filename,
  });
  // Carry WordPress alt text / captions onto the Sanity asset where present.
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

const strip = (html) => html?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "";

/* ——— Phase 1: WordPress media library sweep ——— */
async function sweepMediaLibrary() {
  log("Phase 1: WordPress media library (/wp-json/wp/v2/media)");
  const items = [];
  for (let page = 1; items.length < MAX_MEDIA; page += 1) {
    let res;
    try {
      res = await fetchWithUA(
        `${SITE}/wp-json/wp/v2/media?media_type=image&per_page=100&page=${page}`
      );
    } catch (err) {
      log(`  media API unreachable (${err.message})`);
      return null;
    }
    if (res.status === 400) break; // past the last page
    if (!res.ok) {
      log(`  media API unavailable (HTTP ${res.status}); will crawl pages instead`);
      return null;
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? page);
    log(`  fetched page ${page}/${totalPages} (${items.length} items so far)`);
    if (page >= totalPages) break;
    await sleep(CRAWL_DELAY_MS / 2);
  }

  const images = items
    .filter((i) => /image\/(jpe?g|png|webp)/.test(i.mime_type ?? ""))
    .slice(0, MAX_MEDIA);
  log(`  ${images.length} photographs in the media library`);
  if (DRY_RUN) {
    log("  (dry-run: not downloading or uploading)");
    return images.length;
  }

  const dir = join(process.cwd(), "migration", "downloads", "_media-library");
  mkdirSync(dir, { recursive: true });
  let done = 0;
  for (const item of images) {
    const url = (item.source_url ?? "").split("?")[0];
    if (!/\/wp-content\/uploads\//.test(url)) continue;
    try {
      const file = await downloadImage(url, dir);
      if (file) {
        await uploadToSanity(file, {
          altText: strip(item.alt_text),
          title: strip(item.title?.rendered),
          description: strip(item.caption?.rendered),
        });
      }
      if (!file?.cached) await sleep(DOWNLOAD_DELAY_MS);
    } catch (err) {
      log(`  ! ${url}: ${err.message}`);
    }
    done += 1;
    if (done % 25 === 0) log(`  ${done}/${images.length} processed…`);
  }
  log(`  media library done: ${done} processed`);
  return images.length;
}

/* ——— Phase 2: site crawl (fallback when the media API is unavailable) ——— */
async function crawlSite() {
  log("Phase 2: crawling site pages for images");
  const seeds = [
    `${SITE}/`,
    `${SITE}/galleries`,
    `${SITE}/blog`,
    `${SITE}/information`,
    `${SITE}/sonoma-wedding-photography`,
    `${SITE}/napa-wedding-photography`,
    `${SITE}/seattle-wedding-photography`,
    `${SITE}/sonoma-elopement-photography`,
    `${SITE}/guerneville-wedding-photographer`,
    ...posts.map((p) => `${SITE}/${p.slug}`),
  ];
  const queue = [...new Set(seeds)];
  const visited = new Set();
  const dir = join(process.cwd(), "migration", "downloads", "_crawl");
  mkdirSync(dir, { recursive: true });
  let found = 0;

  while (queue.length > 0 && visited.size < MAX_CRAWL_PAGES) {
    const pageUrl = queue.shift();
    if (visited.has(pageUrl)) continue;
    visited.add(pageUrl);
    let html;
    try {
      const res = await fetchWithUA(pageUrl);
      if (!res.ok) continue;
      if (!(res.headers.get("content-type") ?? "").includes("text/html")) continue;
      html = await res.text();
    } catch {
      continue;
    }
    for (const link of extractPageLinks(html, pageUrl)) {
      if (!visited.has(link)) queue.push(link);
    }
    const { urls } = extractImageUrls(html, pageUrl);
    found += urls.length;
    if (!DRY_RUN) {
      for (const url of urls) {
        try {
          const file = await downloadImage(url, dir);
          if (file) await uploadToSanity(file);
          if (!file?.cached) await sleep(DOWNLOAD_DELAY_MS);
        } catch (err) {
          log(`  ! ${url}: ${err.message}`);
        }
      }
    }
    log(`  ${pageUrl} → ${urls.length} images (${visited.size} pages, ${queue.length} queued)`);
    await sleep(CRAWL_DELAY_MS);
  }
  log(`  crawl done: ${visited.size} pages, ${found} image references`);
}

/* ——— Phase 3: attach post-page images to the seeded drafts ——— */
async function attachToPosts() {
  log(`Phase 3: attaching images to ${targets.length} legacy blog drafts`);
  let pagesFailed = 0;
  let postsPatched = 0;
  let postsSkipped = 0;

  for (const post of targets) {
    const pageUrl = `${SITE}/${post.slug}/`;
    const dir = join(process.cwd(), "migration", "downloads", post.slug);
    mkdirSync(dir, { recursive: true });

    let html;
    try {
      const res = await fetchWithUA(pageUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
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
    if (DEBUG) log(`  [debug] extraction sources: ${JSON.stringify(extracted.stats)}`);
    const urls = extracted.urls.slice(0, MAX_IMAGES_PER_POST);

    const files = [];
    for (const url of urls) {
      try {
        const file = await downloadImage(url, dir);
        if (file) files.push(file);
        if (!file?.cached) await sleep(DOWNLOAD_DELAY_MS);
      } catch (err) {
        log(`  ! image failed: ${url} (${err.message})`);
      }
    }
    log(`• ${post.slug}: ${files.length} photographs${DRY_RUN ? " (dry-run)" : ""}`);

    if (DRY_RUN || files.length === 0) {
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
    for (const file of files) {
      assets.push(await uploadToSanity(file));
    }

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
  return { pagesFailed, postsPatched, postsSkipped };
}

/* ——— main ——— */
log(`Image migration from ${SITE}`);
log(`dry-run: ${DRY_RUN} · media-only: ${MEDIA_ONLY} · posts-only: ${POSTS_ONLY}\n`);

let mediaCount = null;
if (!POSTS_ONLY) {
  mediaCount = await sweepMediaLibrary();
  if (mediaCount === null) await crawlSite();
  log("");
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
    : "Open the Studio's Media tab to browse everything, and Blog → Posts to review the drafts."
);

mkdirSync(join(process.cwd(), "migration"), { recursive: true });
writeFileSync(join(process.cwd(), "migration", "report.md"), report.join("\n") + "\n");
console.log("\nReport written to migration/report.md");
