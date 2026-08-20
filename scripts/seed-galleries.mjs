/**
 * Build the three portfolio galleries (Weddings / Engagements / Families)
 * from the photographs already migrated into the blog posts.
 *
 * For each portfolio section it gathers each matching post's featured
 * photograph plus its first few story photographs (newest posts first),
 * dedupes, and creates one gallery: cover, photographs, category, marked
 * "featured" so the homepage portfolio section picks it up.
 *
 * Skips any section that already has a gallery with photographs (for
 * example one created by the site-migration's portfolio mapping, or by
 * hand in the Studio), so nothing curated is ever disturbed.
 *
 *   npm run seed:galleries -- --dry-run    # preview counts
 *   npm run seed:galleries                  # create as drafts to review
 *   npm run seed:galleries -- --publish     # create and publish right away
 */
import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const PUBLISH = args.includes("--publish");

const PHOTOS_PER_POST = 4;
const MAX_PHOTOS = 40;

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
const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-06-01",
  token,
  useCdn: false,
  perspective: "raw", // see drafts too
});

const { posts } = JSON.parse(readFileSync(join(process.cwd(), "src/lib/legacy-posts.json"), "utf8"));
const categoryBySlug = new Map(
  posts.map((p) => [
    p.slug,
    { "/weddings": "wedding", "/engagements": "engagement", "/families": "family" }[p.target] ?? null,
  ])
);

const SECTIONS = {
  wedding: {
    title: "Weddings",
    slug: "wedding-highlights",
    introduction:
      "Highlights from real weddings across Sonoma, Napa and beyond. Each photograph links back to a full story in the journal.",
  },
  engagement: {
    title: "Engagements",
    slug: "engagement-highlights",
    introduction:
      "Engagement sessions and proposals in wine country, the city and the coast.",
  },
  family: {
    title: "Families",
    slug: "family-highlights",
    introduction: "Family and little-ones sessions, photographed warmly and unhurried.",
  },
};

// Posts with their photographs, newest first (drafts and published alike).
const allPosts = await client.fetch(
  `*[_type == "post"] | order(publishedAt desc) {
    "slug": slug.current, publishedAt, featuredImage, body
  }`
);

for (const [category, section] of Object.entries(SECTIONS)) {
  const existing = await client.fetch(
    `*[_type == "gallery" && category == $category && count(photographs) > 0][0]{ _id, title }`,
    { category }
  );
  if (existing) {
    console.log(
      `↷ ${section.title}: "${existing.title}" already has photographs; left untouched`
    );
    continue;
  }

  // De-dupe by both published/draft variants of a slug and by asset.
  const seenSlugs = new Set();
  const seenAssets = new Set();
  const photographs = [];
  for (const post of allPosts) {
    if (photographs.length >= MAX_PHOTOS) break;
    if (!post.slug || seenSlugs.has(post.slug)) continue;
    seenSlugs.add(post.slug);
    if (categoryBySlug.get(post.slug) !== category) continue;

    const candidates = [
      post.featuredImage,
      ...(Array.isArray(post.body) ? post.body.filter((b) => b._type === "photograph") : []),
    ]
      .filter((p) => p?.asset?._ref && !seenAssets.has(p.asset._ref))
      .slice(0, PHOTOS_PER_POST);
    for (const p of candidates) {
      seenAssets.add(p.asset._ref);
      photographs.push({
        _type: "photograph",
        _key: key(),
        asset: { _type: "reference", _ref: p.asset._ref },
        ...(p.alt ? { alt: p.alt } : {}),
      });
    }
  }

  if (photographs.length === 0) {
    console.log(`! ${section.title}: no photographs found in ${category} posts; publish those posts first`);
    continue;
  }

  const id = `gallery-${section.slug}`;
  const doc = {
    _id: PUBLISH ? id : `drafts.${id}`,
    _type: "gallery",
    title: section.title,
    slug: { _type: "slug", current: section.slug },
    category,
    featured: true,
    coverImage: { ...photographs[0], _key: undefined },
    photographs,
    introduction: section.introduction,
  };
  console.log(
    `✓ ${section.title}: ${photographs.length} photographs${PUBLISH ? ", published" : " (draft)"}${DRY_RUN ? " (dry-run)" : ""}`
  );
  if (!DRY_RUN) {
    await client.createOrReplace(doc);
    if (PUBLISH) await client.delete(`drafts.${id}`).catch(() => {});
  }
}

console.log(
  DRY_RUN
    ? "\nDry run only. Re-run without --dry-run to create the galleries."
    : PUBLISH
      ? "\nDone. Refresh the site: /weddings, /engagements, /families and the homepage portfolio are populated."
      : "\nDone. Review the drafts in Studio → Portfolio, adjust order and covers, then Publish each."
);
