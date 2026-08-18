/**
 * Local-SEO service-area pages, preserved at the exact URLs the previous
 * website ranks for. Copy is drawn from Courtney's verified positioning and
 * the venues/locations she has actually photographed (see docs/CONTENT-AUDIT.md).
 * These are code-managed; venue names below are real past work, not claims.
 */

export interface ServiceArea {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  label: string;
  intro: string;
  body: string[];
  venuesNote?: string;
  portfolioCategory: "wedding" | "engagement" | "family";
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "sonoma-wedding-photography",
    title: "Sonoma Wedding Photography",
    metaTitle: "Sonoma Wedding Photography | Sonoma County Weddings",
    metaDescription:
      "Sonoma County wedding photographer Courtney Stockton — timeless, editorial photography at Sonoma's wineries, vineyard estates and gathering places.",
    label: "Sonoma County",
    intro:
      "Sonoma is home. Courtney lives in Sonoma County wine country, married to a local winemaker — which means she photographs these vineyards, valleys and small towns with a local's knowledge of their light.",
    body: [
      "From Healdsburg and Geyserville down through Glen Ellen, Kenwood and the town of Sonoma itself, Courtney has photographed weddings across the county — at wineries like Trentadue, Trione, Imagery Estate, Annadel Estate, Paradise Ridge and Viansa, at Barndiva and New Tree Ranch in Healdsburg, at Ramekins in Sonoma, and at the Fairmont Sonoma Mission Inn.",
      "Her approach blends gentle direction with documentary storytelling — carefully crafted portraits in the vineyard light, and the unscripted moments in between, photographed in both digital and film.",
    ],
    venuesNote: "Planning at a Sonoma County venue? Courtney may already know its light — explore the venues she has photographed.",
    portfolioCategory: "wedding",
  },
  {
    slug: "napa-wedding-photography",
    title: "Napa Wedding Photography",
    metaTitle: "Napa Wedding Photography | Napa County Weddings",
    metaDescription:
      "Napa Valley wedding photographer Courtney Stockton — editorial, romantic wedding photography at Napa's resorts, wineries and estates.",
    label: "Napa Valley",
    intro:
      "Just over the Mayacamas from home, Napa Valley's resorts, castles and stone wineries have hosted some of Courtney's favorite wedding days.",
    body: [
      "She has photographed weddings and celebrations throughout the valley — at the Meritage Resort & Spa, the CIA at Greystone in St. Helena, Hans Fahden Winery in Calistoga, and Castello di Amorosa, along with engagement sessions in Yountville and proposals above the vines.",
      "Whether your day is a grand valley celebration or an intimate gathering on a Calistoga hillside, the photographs stay honest: real moments, real light, real connection.",
    ],
    portfolioCategory: "wedding",
  },
  {
    slug: "seattle-wedding-photography",
    title: "Seattle Wedding Photography",
    metaTitle: "Seattle Wedding Photography | Seattle Weddings",
    metaDescription:
      "Seattle wedding photographer Courtney Stockton — editorial wedding photography in the Pacific Northwest, with no travel fee for Seattle weddings.",
    label: "Pacific Northwest",
    intro:
      "Seattle is Courtney's favorite place — so much so that her travel fee never applies to Seattle wedding bookings.",
    body: [
      "She has photographed Pacific Northwest weddings at Kiana Lodge on the water in Poulsbo, at Kerry Park with the city skyline behind the ceremony, and at Maplehurst Farm in the Skagit Valley — along with engagement sessions across the city.",
      "If you're planning a Seattle or Pacific Northwest wedding, Courtney brings the same editorial, story-first photography north — evergreen light instead of vineyard light, told just as honestly.",
    ],
    portfolioCategory: "wedding",
  },
  {
    slug: "sonoma-elopement-photography",
    title: "Elopement Photography — Napa & Sonoma",
    metaTitle: "Elopement Photography | Napa & Sonoma County",
    metaDescription:
      "Napa and Sonoma County elopement photographer Courtney Stockton — intimate weddings and elopements in wine country, on the coast and beyond.",
    label: "Elopements & intimate weddings",
    intro:
      "Some of the best wedding days are the smallest ones. Courtney adores intimate weddings and elopements — days built around two people, unhurried and entirely their own.",
    body: [
      "Wine country was made for eloping: a vow exchange among the vines, dinner at a long table under the olive trees, golden hour with nowhere else to be. Courtney photographs elopements and intimate weddings throughout Sonoma and Napa counties, on the Sonoma coast, and anywhere your plans lead.",
      "With gentle planning help — light, timing, flow — your day stays simple, and the photographs hold everything worth remembering.",
    ],
    portfolioCategory: "wedding",
  },
  {
    slug: "guerneville-wedding-photographer",
    title: "Guerneville Wedding Photographer",
    metaTitle: "Guerneville Wedding Photographer | Russian River Weddings",
    metaDescription:
      "Guerneville and Russian River wedding photographer Courtney Stockton — editorial wedding photography among the redwoods and along the river.",
    label: "Russian River",
    intro:
      "Redwoods, river light and a town that doesn't take itself too seriously — Guerneville weddings have a magic all their own.",
    body: [
      "A short drive from Courtney's Sonoma County home, Guerneville and the Russian River Valley pair towering redwood ceremonies with golden-hour river banks. It's some of the most photogenic country in California, and she photographs it with a local's eye.",
      "If you're planning a Guerneville, Russian River or Sonoma coast wedding, Courtney would love to hear your plans.",
    ],
    portfolioCategory: "wedding",
  },
];

export function getServiceArea(slug: string): ServiceArea | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug);
}
