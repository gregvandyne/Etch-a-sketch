/** Canonical site constants used across metadata, sitemap and structured data. */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://courtneystockton.com"
).replace(/\/$/, "");

export const SITE_NAME = "Courtney Stockton Photography";

export const DEFAULT_DESCRIPTION =
  "Timeless, editorial wedding and family photography in Sonoma, Napa and Northern California wine country by Courtney Stockton.";

export const CATEGORY_META = {
  wedding: {
    plural: "Weddings",
    path: "/weddings",
    title: "Sonoma & Napa Wedding Photography",
    description:
      "Wedding photography in Sonoma, Napa and Northern California wine country — timeless, editorial storytelling of real wedding days by Courtney Stockton.",
  },
  engagement: {
    plural: "Engagements",
    path: "/engagements",
    title: "Engagement Photography in Sonoma & Napa",
    description:
      "Engagement sessions in Sonoma, Napa and Northern California — relaxed, romantic photographs in wine country light by Courtney Stockton.",
  },
  family: {
    plural: "Families",
    path: "/families",
    title: "Sonoma County Family Photography",
    description:
      "Family and little-ones photography in Sonoma County and Northern California — honest, warm photographs of your people by Courtney Stockton.",
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_META;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
