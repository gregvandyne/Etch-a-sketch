export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-06-01";

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";

/** True when a Sanity project has been connected via environment variables. */
export const isSanityConfigured = Boolean(projectId);
