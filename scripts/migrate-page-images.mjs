/**
 * Page-image mapping: place migrated photographs onto the website pages the
 * way the live site lays them out.
 *
 * Reads each live page's images IN ORDER and slots the matching uploaded
 * assets into the corresponding fields of the new site's page documents:
 *
 *   old homepage   → Homepage: opening photograph, second opening
 *                    photograph, philosophy photographs
 *   old about page → About: portrait (+ Homepage introduction photograph,
 *                    so Courtney's portrait appears in her intro),
 *                    additional photographs
 *   /information   → Investment: opening photograph
 *   /contact       → Contact: photograph
 *
 * Only EMPTY fields are filled. The dry run prints exactly which image
 * file lands in which field so mis-guesses can be caught before writing;
 * anything imperfect is a 30-second swap in the Studio afterwards (all
 * images are already in the Media library).
 *
 * Run AFTER the image migration:
 *   npm run migrate:pages -- --dry-run
 *   npm run migrate:pages
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
  return urls;
}

const baseFilename = (url) =>
  decodeURIComponent(url.split("/").pop()).replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, "$1");

/* Asset lookup by filename (uploaded by the image migration). */
console.log("Loading uploaded image assets from Sanity…");
const assetRows = await client.fetch(`*[_type == "sanity.imageAsset"]{ _id, originalFilename }`);
const byFilename = new Map();
for (const row of assetRows) {
  if (!row.originalFilename) continue;
  byFilename.set(row.originalFilename, row._id);
  const base = row.originalFilename.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, "$1");
  if (!byFilename.has(base)) byFilename.set(base, row._id);
}
console.log(`${assetRows.length} assets loaded\n`);

async function pageImages(path) {
  try {
    const res = await fetch(`${SITE}${path}`, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return { path, assets: [], error: `HTTP ${res.status}` };
    const html = await res.text();
    const assets = [];
    for (const url of orderedImageUrls(html, `${SITE}${path}`)) {
      const id = byFilename.get(baseFilename(url));
      if (id && !assets.some((a) => a.id === id)) assets.push({ id, file: baseFilename(url) });
    }
    return { path, assets, html };
  } catch (err) {
    return { path, assets: [], error: err.message };
  }
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

const photo = (assetId, alt) => ({
  _type: "photograph",
  asset: { _type: "reference", _ref: assetId },
  ...(alt ? { alt } : {}),
});

/** Patch the singleton's draft if one exists, else its published document. */
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
    if (empty) sets[field] = value;
    else console.log(`  ↷ ${type}.${field} already set; left untouched`);
  }
  if (Object.keys(sets).length === 0) return;
  for (const field of Object.keys(sets)) console.log(`  ✓ ${type}.${field} filled`);
  if (!DRY_RUN) await client.patch(doc._id).set(sets).commit();
}

/* ——— gather ——— */
const home = await pageImages("/");
const aboutPath = findAboutPath(home.html);
const [about, info, contact] = [
  await pageImages(aboutPath),
  await pageImages("/information"),
  await pageImages("/contact"),
];

const show = (label, page) =>
  console.log(
    `${label} (${page.path}): ${page.error ?? page.assets.map((a) => a.file).join(", ") ?? "none"}`
  );
show("Homepage images", home);
show("About images", about);
show("Information images", info);
show("Contact images", contact);
console.log("");

/* ——— mapping plan ——— */
const h = home.assets;
const a = about.assets;

const plan = [
  ["homePage.heroImage", h[0]],
  ["homePage.heroImageSecondary", h[1]],
  ["homePage.introImage (Courtney's portrait, from the About page)", a[0]],
  ["homePage.philosophyImages", h.slice(2, 5).length ? { files: h.slice(2, 5) } : undefined],
  ["aboutPage.portrait", a[0]],
  ["aboutPage.photographs", a.slice(1, 3).length ? { files: a.slice(1, 3) } : undefined],
  ["investmentPage.heroImage", info.assets[0]],
  ["contactPage.image", contact.assets[0]],
];
console.log("Mapping plan:");
for (const [field, value] of plan) {
  const desc = value?.files
    ? value.files.map((f) => f.file).join(", ")
    : value?.file ?? "(no image found)";
  console.log(`  ${field} ← ${desc}`);
}
console.log("");

if (DRY_RUN) {
  console.log("Dry run only: nothing was changed. Re-run without --dry-run to apply.");
  process.exit(0);
}

await fillPage("homePage", {
  heroImage: h[0] && photo(h[0].id, "Courtney Stockton Photography"),
  heroImageSecondary: h[1] && photo(h[1].id),
  introImage: a[0] && photo(a[0].id, "Portrait of Courtney Stockton"),
  philosophyImages: h.slice(2, 5).length
    ? h.slice(2, 5).map((img) => ({ ...photo(img.id), _key: key() }))
    : null,
});
await fillPage("aboutPage", {
  portrait: a[0] && photo(a[0].id, "Portrait of Courtney Stockton"),
  photographs: a.slice(1, 3).length
    ? a.slice(1, 3).map((img) => ({ ...photo(img.id), _key: key() }))
    : null,
});
await fillPage("investmentPage", { heroImage: info.assets[0] && photo(info.assets[0].id) });
await fillPage("contactPage", { image: contact.assets[0] && photo(contact.assets[0].id) });

console.log(
  "\nDone. Check the homepage, About, Investment and Contact pages; swap any image in the Studio if a guess missed (they're all in the Media library)."
);
