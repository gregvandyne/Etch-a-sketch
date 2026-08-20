import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { client } from "@/sanity/lib/client";

/**
 * Enables draft preview. Called by the Studio's Presentation tool with a
 * signed preview-URL secret (validated against the Sanity project using the
 * server-side viewer token), so drafts can never be viewed by guessing a URL.
 */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
});
