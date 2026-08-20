/**
 * Page-image mapping: place migrated photographs onto the website pages the
 * way the live site lays them out.
 *
 * The live theme renders its imagery with JavaScript, so the images are NOT
 * in the HTML the server sends. This script therefore works through three
 * sources, best first:
 *
 *   1. WordPress's own API record of which images are attached to each page
 *      (/wp-json/wp/v2/media?parent=<page id>), in order.
 *   2. The page HTML (img tags, full-size links, CSS backgrounds), plus the
 *      page's og:image WHEN it is unique to that page. An og:image shared
 *      by several pages is the site's logo/social-share card, not a photo,
 *      and is excluded everywhere.
 *   3. The published portfolio galleries (Weddings / Engagements /
 *      Families): known-good photographs used to fill any slot the live
 *      site gave nothing for, so the hero is never left empty.
 *
 * Courtney's portrait is special-cased: only an image the live About page
 * offers, or a Media-library asset whose filename/alt/title reads like a
 * portrait or headshot, is used. A portfolio photo of a client is never
 * guessed as her portrait; if nothing matches, the field is left for the
 * Studio.
 *
 * Field mapping:
 *   Homepage: opening photograph, second opening photograph, introduction
 *             photograph (Courtney's portrait), philosophy photographs
 *   About:    portrait, additional photographs
 *   /information → Investment: opening photograph
 *   /contact     → Contact: photograph
 *
 * Only EMPTY fields are filled unless --redo is passed, which replaces the
 * fields this script manages with its current picks (use it to correct an
 * earlier bad guess). The dry run prints exactly which image lands where.
 *
 * Run AFTER the image migration and seed:galleries:
 *   npm run migrate:pages -- --dry-run
 *   npm run migrate:pages
 *   npm run migrate:pages -- --redo        # replace earlier picks
 */
import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://courtneystockton.com";
const USER_AGENT =
  "courtney-stockton-site-migration/1.0 (moving this site's own images to its new CMS)";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const REDO = args.includes("--redo");

const key = () => createHash("md5").update(String(Math.random())).digest("hex").slice(0, 12);

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
if (!projectId || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local.");
  process.exit(1);
}
const client = createClient({ projectId, dataset, apiVersion: "2025-06-01", token, useCdn: false });

/* Ordered image extraction (same patterns as migrate-images.mjs, kept in
   document order rather than deduped-set order). */
function orderedImageUrls(html, baseUrl) {
  const seen = new Set();
  const urls = [];
  const push = (raw) => {
    if (!raw || raw.trim().startsWith("data:")) return;
    let url;
    try {
      url = new URL(raw.trim(), baseUrl).href.split("?")[0].split("#")[0];
    } catch {
      return;
    }
    if (!/\/wp-content\/uploads\//.test(url)) return;
    if (!/\.(jpe?g|png|webp)$/i.test(url)) return;
    if (/logo|favicon|icon|watermark|signature/i.test(url)) return;
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };
  const attr = (tag, name) =>
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
  const widest = (srcset) => {
    let best = null;
    let bestW = 0;
    for (const part of srcset.split(",")) {
      const [u, d] = part.trim().split(/\s+/);
      const w = d?.endsWith("w") ? parseInt(d) : 0;
      if (w >= bestW) (bestW = w), (best = u);
    }
    return best;
  };
  for (const tag of html.match(/<(?:img|source)\b[^>]*>/gi) ?? []) {
    for (const name of ["data-orig-file", "data-large-file", "data-src", "data-lazy-src", "src"]) {
      const v = attr(tag, name);
      if (v) {
        push(v);
        break; // one URL per tag, best attribute first
      }
    }
    const set = attr(tag, "srcset") ?? attr(tag, "data-lazy-srcset");
    if (set) push(widest(set));
  }
  // Full-size lightbox links and CSS backgrounds (JS themes often keep the
  // real imagery in these even when no <img> tags are server-rendered).
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']*\/wp-content\/uploads\/[^"']+)["']/gi)) {
    push(m[1]);
  }
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    push(m[1]);
  }
  return urls;
}

/** The page's og:image, if any. Handled separately from the ordered list so
 *  a site-wide share card can be detected and excluded (see below). */
function ogImageUrl(html) {
  const tag = html?.match(/<meta\b[^>]*property\s*=\s*["']og:image(?::secure_url)?["'][^>]*>/i)?.[0];
  const v = tag?.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!v) return null;
  try {
    return new URL(v, SITE).href.split("?")[0].split("#")[0];
  } catch {
    return null;
  }
}

/* ——— WordPress API: the authoritative record of a page's images ——— */
async function wpJson(path) {
  try {
    const res = await fetch(`${SITE}/wp-json/wp/v2${path}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function pageIdBySlug(slug) {
  const rows = await wpJson(`/pages?slug=${encodeURIComponent(slug)}&_fields=id,link,slug`);
  return rows?.[0]?.id ?? null;
}

/** The front page has no slug in the URL; find it by its link. */
async function frontPageId() {
  const siteRoot = SITE.replace(/\/$/, "");
  for (let page = 1; page <= 3; page++) {
    const rows = await wpJson(`/pages?per_page=100&page=${page}&_fields=id,link,slug`);
    if (!rows?.length) break;
    const hit = rows.find((r) => r.link?.replace(/\/$/, "") === siteRoot);
    if (hit) return hit.id;
    if (rows.length < 100) break;
  }
  return null;
}

/** Images attached to a page, oldest first (usually the order they were placed). */
async function attachedImages(parentId) {
  if (!parentId) return [];
  const media = await wpJson(
    `/media?parent=${parentId}&per_page=100&orderby=date&order=asc&_fields=source_url,alt_text,media_type,mime_type`
  );
  return (media ?? [])
    .filter((m) => (m.media_type === "image" || /^image\//.test(m.mime_type ?? "")) && m.source_url)
    .map((m) => ({ url: m.source_url.split("?")[0], alt: m.alt_text ?? "" }));
}

const baseFilename = (url) =>
  decodeURIComponent(url.split("/").pop()).replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, "$1");

/* Asset lookup by filename (uploaded by the image migration). */
console.log("Loading uploaded image assets from Sanity…");
const assetRows = await client.fetch(
  `*[_type == "sanity.imageAsset"]{ _id, originalFilename, altText, title }`
);
const byFilename = new Map();
for (const row of assetRows) {
  if (!row.originalFilename) continue;
  byFilename.set(row.originalFilename, row._id);
  const base = row.originalFilename.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, "$1");
  if (!byFilename.has(base)) byFilename.set(base, row._id);
}
console.log(`${assetRows.length} assets loaded\n`);

async function pageImages(path) {
  const assets = [];
  const addUrl = (url) => {
    const id = byFilename.get(baseFilename(url));
    if (id && !assets.some((a) => a.id === id)) assets.push({ id, file: baseFilename(url) });
  };

  // 1. WordPress API: the images attached to this page, in order.
  const slug = path.replace(/^\/+|\/+$/g, "");
  const pageId = slug === "" ? await frontPageId() : await pageIdBySlug(slug);
  const attached = await attachedImages(pageId);
  for (const m of attached) addUrl(m.url);
  const source = attached.length ? `${attached.length} attached via the API` : null;

  // 2. HTML fallback/supplement for anything the API didn't list.
  let html = "";
  let error = null;
  try {
    const res = await fetch(`${SITE}${path}`, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) {
      html = await res.text();
      for (const url of orderedImageUrls(html, `${SITE}${path}`)) addUrl(url);
    } else if (assets.length === 0) {
      error = `HTTP ${res.status}`;
    }
  } catch (err) {
    if (assets.length === 0) error = err.message;
  }
  return { path, assets, html, error, source, og: html ? ogImageUrl(html) : null };
}

/** Find the live About page from the homepage navigation. */
function findAboutPath(homeHtml) {
  for (const m of homeHtml?.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi) ?? []) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (/about|meet/.test(text) || /about|meet-?courtney/i.test(href)) {
      try {
        const url = new URL(href, SITE);
        if (url.origin === new URL(SITE).origin && url.pathname !== "/") return url.pathname;
      } catch {
        /* ignore */
      }
    }
  }
  return "/about";
}

/** Known-good portfolio photographs, by category, for slots the live site
 *  gave nothing for. Reads the published galleries (seed:galleries). */
async function portfolioPool() {
  const gals = await client.fetch(
    `*[_type == "gallery" && category in ["wedding", "engagement", "family"]]{
      category, coverImage, photographs
    }`
  );
  const pool = { wedding: [], engagement: [], family: [] };
  for (const g of gals) {
    const list = [g.coverImage, ...(g.photographs ?? [])];
    for (const p of list) {
      if (!p?.asset?._ref || pool[g.category].some((x) => x.id === p.asset._ref)) continue;
      pool[g.category].push({
        id: p.asset._ref,
        alt: p.alt,
        file: `portfolio: ${g.category} photo ${pool[g.category].length + 1}`,
      });
    }
  }
  return pool;
}

/** Best guess at an actual portrait/headshot of Courtney from the Media
 *  library metadata. Deliberately conservative: better to leave the field
 *  empty than to put a client's photo in her introduction. */
function portraitCandidate() {
  const text = (r) => `${r.originalFilename ?? ""} ${r.altText ?? ""} ${r.title ?? ""}`.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const r of assetRows) {
    const t = text(r);
    if (/logo|brand|icon|watermark|favicon|card/.test(t)) continue;
    let s = 0;
    if (/headshot/.test(t)) s += 4;
    if (/portrait/.test(t)) s += 2;
    if (/\babout\b|\bbio\b|meet/.test(t)) s += 2;
    if (/courtney/.test(t)) s += 1;
    if (s >= 4 && s > bestScore) {
      bestScore = s;
      best = r;
    }
  }
  return best ? { id: best._id, file: best.originalFilename ?? "(media-library asset)" } : undefined;
}

const photo = (assetId, alt) => ({
  _type: "photograph",
  asset: { _type: "reference", _ref: assetId },
  ...(alt ? { alt } : {}),
});

/** Patch the singleton's draft if one exists, else its published document.
 *  Empty fields are filled; --redo replaces the managed fields outright. */
async function fillPage(type, fields) {
  const draft = await client.getDocument(`drafts.${type}`).catch(() => null);
  const doc = draft ?? (await client.getDocument(type).catch(() => null));
  if (!doc) {
    console.log(`  ! ${type}: document not found (import docs/seed/seed.ndjson first)`);
    return;
  }
  const sets = {};
  for (const [field, value] of Object.entries(fields)) {
    if (value == null) continue;
    const current = doc[field];
    const empty = Array.isArray(current) ? current.length === 0 : !current?.asset && !current;
    if (empty || REDO) sets[field] = value;
    else console.log(`  ↷ ${type}.${field} already set; left untouched (--redo replaces it)`);
  }
  if (Object.keys(sets).length === 0) return;
  for (const field of Object.keys(sets)) console.log(`  ✓ ${type}.${field} filled`);
  if (!DRY_RUN) {
    await client.patch(doc._id).set(sets).commit();
    if (draft) console.log(`  (note: ${type} has a draft open; publish it in the Studio to go live)`);
  }
}

/* ——— gather ——— */
const home = await pageImages("/");
const aboutPath = findAboutPath(home.html);
const about = await pageImages(aboutPath);
const info = await pageImages("/information");
const contact = await pageImages("/contact");
const pages = [home, about, info, contact];

/* An og:image shared by more than one page is the site's logo/social-share
   card (for example the beach graphic with the script "C"), never page
   content: exclude it everywhere. A unique og:image is a fine last
   candidate for its own page. */
const ogCounts = new Map();
for (const p of pages) if (p.og) ogCounts.set(p.og, (ogCounts.get(p.og) ?? 0) + 1);
const brandIds = new Set(
  [...ogCounts]
    .filter(([, n]) => n > 1)
    .map(([url]) => byFilename.get(baseFilename(url)))
    .filter(Boolean)
);
for (const p of pages) {
  if (p.og && ogCounts.get(p.og) === 1) {
    const id = byFilename.get(baseFilename(p.og));
    if (id && !p.assets.some((a) => a.id === id)) p.assets.push({ id, file: baseFilename(p.og) });
  }
  p.assets = p.assets.filter((a) => !brandIds.has(a.id));
}
if (brandIds.size > 0) {
  console.log(`Excluded ${brandIds.size} site-wide brand graphic(s) shared across pages.\n`);
}

const show = (label, page) =>
  console.log(
    `${label} (${page.path}${page.source ? `, ${page.source}` : ""}): ${
      page.error ?? (page.assets.map((a) => a.file).join(", ") || "none")
    }`
  );
show("Homepage images", home);
show("About images", about);
show("Information images", info);
show("Contact images", contact);
console.log("");

/* ——— choose ——— */
const pool = await portfolioPool();
const h = home.assets;
const a = about.assets;

const used = new Set();
const pick = (...candidates) => {
  for (const c of candidates.flat()) {
    if (c && !used.has(c.id)) {
      used.add(c.id);
      return c;
    }
  }
  return undefined;
};
const pickMany = (n, ...candidates) => {
  const out = [];
  for (const c of candidates.flat()) {
    if (out.length >= n) break;
    if (c && !used.has(c.id)) {
      used.add(c.id);
      out.push(c);
    }
  }
  return out;
};

// Courtney's portrait first (shared by About and the homepage intro), so a
// hero pick never swallows it.
const portrait = a[0] ?? portraitCandidate();
if (portrait) used.add(portrait.id);

const hero = pick(h[0], pool.wedding);
const heroSecondary = pick(h[1], pool.engagement);
const philosophy = pickMany(3, h.slice(2, 5), pool.family, pool.wedding);
const aboutPhotos = pickMany(2, a.slice(1, 3), pool.family, pool.engagement);
const infoHero = pick(info.assets[0], pool.wedding);
const contactImg = pick(contact.assets[0], pool.engagement);

const plan = [
  ["homePage.heroImage", hero],
  ["homePage.heroImageSecondary", heroSecondary],
  ["homePage.introImage (Courtney's portrait)", portrait],
  ["homePage.philosophyImages", philosophy.length ? { files: philosophy } : undefined],
  ["aboutPage.portrait", portrait],
  ["aboutPage.photographs", aboutPhotos.length ? { files: aboutPhotos } : undefined],
  ["investmentPage.heroImage", infoHero],
  ["contactPage.image", contactImg],
];
console.log(`Mapping plan${REDO ? " (--redo: replaces existing picks)" : ""}:`);
for (const [field, value] of plan) {
  const desc = value?.files
    ? value.files.map((f) => f.file).join(", ")
    : value?.file ?? "(no image found; pick one in the Studio)";
  console.log(`  ${field} ← ${desc}`);
}
console.log("");
if (!portrait) {
  console.log(
    "No portrait of Courtney could be identified automatically. In the Studio, open Pages → Homepage → Introduction photograph and Pages → About → Portrait, and choose her photo from the Media library.\n"
  );
}

if (DRY_RUN) {
  console.log("Dry run only: nothing was changed. Re-run without --dry-run to apply.");
  process.exit(0);
}

await fillPage("homePage", {
  heroImage: hero && photo(hero.id, hero.alt ?? "Courtney Stockton Photography"),
  heroImageSecondary: heroSecondary && photo(heroSecondary.id, heroSecondary.alt),
  introImage: portrait && photo(portrait.id, "Portrait of Courtney Stockton"),
  philosophyImages: philosophy.length
    ? philosophy.map((img) => ({ ...photo(img.id, img.alt), _key: key() }))
    : null,
});
await fillPage("aboutPage", {
  portrait: portrait && photo(portrait.id, "Portrait of Courtney Stockton"),
  photographs: aboutPhotos.length
    ? aboutPhotos.map((img) => ({ ...photo(img.id, img.alt), _key: key() }))
    : null,
});
await fillPage("investmentPage", { heroImage: infoHero && photo(infoHero.id, infoHero.alt) });
await fillPage("contactPage", { image: contactImg && photo(contactImg.id, contactImg.alt) });

console.log(
  "\nDone. Check the homepage, About, Investment and Contact pages; swap any image in the Studio if a guess missed (they're all in the Media library)."
);
