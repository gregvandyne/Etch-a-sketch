/**
 * Set Courtney's portrait — the introduction photograph on the Homepage and
 * the portrait on the About page — when the migration couldn't find one
 * (her old About page renders its images with JavaScript, so the portrait
 * often never reached the Media library).
 *
 * Three ways to supply the photo:
 *
 *   npm run set:portrait                        # search the OLD site's whole
 *                                               # media library and list
 *                                               # numbered candidates
 *   npm run set:portrait -- --pick 3            # use candidate 3 from the list
 *   npm run set:portrait -- --url <image url>   # use a specific image URL
 *   npm run set:portrait -- --file <path>       # use a local file (simplest:
 *                                               # any portrait she has)
 *
 * Add --dry-run to preview without changing anything. The chosen image is
 * uploaded to Sanity (reused if the same filename is already there) and set
 * on BOTH fields, replacing whatever is there now. If either document has an
 * open draft, the draft is patched — publish it in the Studio to go live.
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const SITE = "https://courtneystockton.com";
const USER_AGENT =
  "courtney-stockton-site-migration/1.0 (moving this site's own images to its new CMS)";
const ALT = "Portrait of Courtney Stockton";
const SEARCH_TERMS = ["courtney", "headshot", "portrait", "about", "bio", "meet"];

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const PICK = flag("--pick");
const URL_ARG = flag("--url");
const FILE_ARG = flag("--file");

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

/* ——— Candidate search across the old site's WHOLE media library ———
   (The page-scoped migration only saw images attached to pages; the media
   search endpoint reaches everything ever uploaded.) */
async function searchOldSite() {
  const seen = new Map();
  for (const term of SEARCH_TERMS) {
    let rows = null;
    try {
      const res = await fetch(
        `${SITE}/wp-json/wp/v2/media?search=${encodeURIComponent(term)}&per_page=100&_fields=id,source_url,alt_text,title,mime_type,date`,
        { headers: { "User-Agent": USER_AGENT } }
      );
      if (res.ok) rows = await res.json();
    } catch {
      /* network hiccup on one term is fine */
    }
    for (const m of rows ?? []) {
      if (!/^image\//.test(m.mime_type ?? "") || !m.source_url) continue;
      const url = m.source_url.split("?")[0];
      const text = `${url.split("/").pop()} ${m.alt_text ?? ""} ${m.title?.rendered ?? ""}`.toLowerCase();
      if (/logo|favicon|icon|watermark|signature|card/.test(text)) continue;
      let score = 0;
      if (/headshot/.test(text)) score += 4;
      if (/portrait/.test(text)) score += 2;
      if (/\babout\b|\bbio\b|meet/.test(text)) score += 2;
      if (/courtney/.test(text)) score += 1;
      const prev = seen.get(url);
      if (!prev || score > prev.score) {
        seen.set(url, { url, score, alt: m.alt_text ?? "", date: (m.date ?? "").slice(0, 10) });
      }
    }
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, 25);
}

/* ——— Choose the image bytes ——— */
async function imageToUpload() {
  if (FILE_ARG) {
    if (!existsSync(FILE_ARG)) {
      console.error(`File not found: ${FILE_ARG}`);
      process.exit(1);
    }
    return { buffer: readFileSync(FILE_ARG), filename: basename(FILE_ARG) };
  }
  let url = URL_ARG;
  if (!url) {
    const candidates = await searchOldSite();
    if (candidates.length === 0) {
      console.log(
        `No image on ${SITE} matched ${SEARCH_TERMS.join(", ")}.\n` +
          "The portrait probably isn't in the old media library at all — use a file instead:\n" +
          "  npm run set:portrait -- --file ~/Desktop/courtney.jpg"
      );
      process.exit(0);
    }
    if (!PICK) {
      console.log(`Portrait candidates from ${SITE} (best guesses first):\n`);
      candidates.forEach((c, i) => {
        console.log(`  ${String(i + 1).padStart(2)}. ${c.url}`);
        console.log(`      ${[c.date, c.alt].filter(Boolean).join(" — ") || "(no alt text)"}`);
      });
      console.log(
        "\nOpen the URLs in a browser to see them, then apply one with:\n" +
          "  npm run set:portrait -- --pick <number>\n" +
          "Or skip the search entirely:\n" +
          "  npm run set:portrait -- --file <path>   |   --url <image url>"
      );
      process.exit(0);
    }
    const chosen = candidates[Number(PICK) - 1];
    if (!chosen) {
      console.error(`--pick ${PICK} is out of range (1–${candidates.length}).`);
      process.exit(1);
    }
    url = chosen.url;
  }
  console.log(`Downloading ${url} …`);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    console.error(`Download failed: HTTP ${res.status}`);
    process.exit(1);
  }
  return { buffer: Buffer.from(await res.arrayBuffer()), filename: url.split("/").pop() };
}

/* ——— Upload (or reuse) and set both fields ——— */
const { buffer, filename } = await imageToUpload();
console.log(`Portrait image: ${filename} (${(buffer.length / 1024).toFixed(0)} kB)`);

if (DRY_RUN) {
  console.log("Dry run: would upload this image and set homePage.introImage + aboutPage.portrait.");
  process.exit(0);
}

const existing = await client.fetch(
  `*[_type == "sanity.imageAsset" && originalFilename == $name][0]._id`,
  { name: filename }
);
const assetId =
  existing ?? (await client.assets.upload("image", buffer, { filename }))._id;
console.log(existing ? "Reusing the already-uploaded asset." : "Uploaded to the Media library.");

const photo = {
  _type: "photograph",
  asset: { _type: "reference", _ref: assetId },
  alt: ALT,
};

for (const [type, field] of [
  ["homePage", "introImage"],
  ["aboutPage", "portrait"],
]) {
  const draft = await client.getDocument(`drafts.${type}`).catch(() => null);
  const doc = draft ?? (await client.getDocument(type).catch(() => null));
  if (!doc) {
    console.log(`  ! ${type}: document not found`);
    continue;
  }
  await client.patch(doc._id).set({ [field]: photo }).commit();
  console.log(
    `  ✓ ${type}.${field} set${draft ? " (draft — publish it in the Studio to go live)" : ""}`
  );
}
console.log("\nDone. The homepage introduction and the About portrait now show this photo.");
