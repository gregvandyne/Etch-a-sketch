/**
 * Generates docs/seed/legacy-posts.ndjson from src/lib/legacy-posts.json:
 * one DRAFT blog post per legacy URL, with the original slug, indexed title
 * and category pre-filled. Importing it gives Courtney a ready-made draft
 * for every old post; she adds photographs and the story, then publishes,
 * and the original URL carries straight over.
 *
 * Run: node scripts/generate-legacy-seed.mjs
 * Import: npx sanity dataset import docs/seed/legacy-posts.ndjson production
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const data = JSON.parse(
  readFileSync(join(process.cwd(), "src/lib/legacy-posts.json"), "utf8")
);

const lines = data.posts.map((post) =>
  JSON.stringify({
    _id: `drafts.post-${post.slug.slice(0, 100)}`,
    _type: "post",
    title: post.title,
    slug: { _type: "slug", current: post.slug },
    categories: [
      { _type: "reference", _key: "cat0", _ref: post.categoryId },
    ],
    excerpt:
      "Draft carried over from the previous website. Add the photographs and story, set the publish date, then publish to bring this post back at its original address.",
  })
);

const out = join(process.cwd(), "docs/seed/legacy-posts.ndjson");
writeFileSync(out, lines.join("\n") + "\n");
console.log(`Wrote ${lines.length} draft posts to docs/seed/legacy-posts.ndjson`);
