import { draftMode } from "next/headers";
import type { QueryParams } from "next-sanity";

import { client } from "./client";
import { isSanityConfigured } from "@/sanity/env";

/**
 * Fetch content from Sanity with cache tags for on-demand revalidation.
 *
 * - Published content is cached indefinitely and revalidated by the
 *   Sanity webhook (see /api/revalidate) whenever Courtney publishes.
 * - In draft/preview mode, drafts are fetched fresh with the read token.
 * - When no Sanity project is configured (local development before
 *   credentials exist), returns null so pages can fall back to the
 *   clearly-labeled sample content.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = ["content"],
}: {
  query: string;
  params?: QueryParams;
  tags?: string[];
}): Promise<T | null> {
  if (!isSanityConfigured) return null;

  let isDraft = false;
  try {
    isDraft = (await draftMode()).isEnabled;
  } catch {
    // draftMode() is unavailable outside request scope (e.g. sitemap generation).
  }

  if (isDraft) {
    if (!process.env.SANITY_API_READ_TOKEN) {
      throw new Error("Draft preview requires SANITY_API_READ_TOKEN.");
    }
    return client.fetch<T>(query, params, {
      perspective: "drafts",
      useCdn: false,
      token: process.env.SANITY_API_READ_TOKEN,
      next: { revalidate: 0 },
    });
  }

  return client.fetch<T>(query, params, {
    perspective: "published",
    next: { tags },
  });
}
