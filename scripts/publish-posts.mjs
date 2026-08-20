/**
 * Bulk-publish the migrated blog drafts.
 *
 * Publishes every draft blog post that has the pieces a post needs
 * (title, web address, publish date, featured photograph); drafts missing
 * any of those are skipped and listed with the reason. Run it after the
 * image and text migrations, once spot-checking a few drafts in the
 * Studio looks right.
 *
 *   npm run publish:posts -- --dry-run     # list what would publish
 *   npm run publish:posts                   # publish them
 *
 * Flags: --dry-run, --limit N, --allow-empty-body (publish photo/date-only
 * posts that have no written story)
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ALLOW_EMPTY_BODY = args.includes("--allow-empty-body");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

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

const drafts = await client.fetch(
  `*[_type == "post" && _id in path("drafts.**")] | order(publishedAt asc)`
);
console.log(`${drafts.length} draft posts found\n`);

let published = 0;
let skipped = 0;

for (const draft of drafts.slice(0, LIMIT)) {
  const slug = draft.slug?.current;
  const problems = [];
  if (!draft.title) problems.push("no title");
  if (!slug) problems.push("no web address");
  if (!draft.publishedAt) problems.push("no publish date (run migrate:text)");
  if (!draft.featuredImage?.asset) problems.push("no featured photograph (run migrate:images)");
  const hasText = Array.isArray(draft.body) && draft.body.some((b) => b._type === "block");
  if (!hasText && !ALLOW_EMPTY_BODY) problems.push("no written story (use --allow-empty-body to publish anyway)");

  if (problems.length > 0) {
    skipped += 1;
    console.log(`↷ ${slug ?? draft._id}: ${problems.join(", ")}`);
    continue;
  }

  const publishedId = draft._id.replace(/^drafts\./, "");
  console.log(`✓ ${slug}${DRY_RUN ? " (dry-run)" : ""}`);
  if (!DRY_RUN) {
    const doc = { ...draft, _id: publishedId };
    delete doc._rev;
    await client.transaction().createOrReplace(doc).delete(draft._id).commit();
  }
  published += 1;
}

console.log(
  `\n${DRY_RUN ? "Would publish" : "Published"}: ${published} · skipped: ${skipped}`
);
if (!DRY_RUN && published > 0) {
  console.log("Refresh the site: the journal, category pages and old post URLs are live.");
}
