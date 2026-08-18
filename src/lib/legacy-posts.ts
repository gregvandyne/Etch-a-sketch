import data from "./legacy-posts.json";

export interface LegacyPost {
  slug: string;
  title: string;
  /** Where the old URL points until the post is recreated in the CMS. */
  target: string;
  categoryId: string;
}

export const LEGACY_POSTS: LegacyPost[] = data.posts;

const bySlug = new Map(LEGACY_POSTS.map((p) => [p.slug, p]));

/**
 * Look up a legacy WordPress post slug. Used by the root catch-all as a
 * safety net: a known old URL whose post hasn't been recreated yet gets a
 * temporary redirect to the most relevant section instead of a 404, so
 * inbound links and rankings survive the migration window. The moment
 * Courtney publishes a post with the same slug, the real page wins.
 */
export function getLegacyPost(slug: string): LegacyPost | undefined {
  return bySlug.get(slug);
}
