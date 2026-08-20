import type { MetadataRoute } from "next";

import { getSitemapContent } from "@/lib/content";
import { SERVICE_AREAS } from "@/lib/service-areas";
import { CATEGORY_META, absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getSitemapContent();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, priority: 1 },
    { url: absoluteUrl("/galleries"), lastModified: now, priority: 0.9 },
    { url: absoluteUrl("/weddings"), lastModified: now, priority: 0.9 },
    { url: absoluteUrl("/engagements"), lastModified: now, priority: 0.8 },
    { url: absoluteUrl("/families"), lastModified: now, priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, priority: 0.7 },
    { url: absoluteUrl("/experience"), lastModified: now, priority: 0.7 },
    { url: absoluteUrl("/information"), lastModified: now, priority: 0.8 },
    { url: absoluteUrl("/contact"), lastModified: now, priority: 0.9 },
    { url: absoluteUrl("/venues"), lastModified: now, priority: 0.7 },
    { url: absoluteUrl("/blog"), lastModified: now, priority: 0.7 },
    ...SERVICE_AREAS.map((a) => ({
      url: absoluteUrl(`/${a.slug}`),
      lastModified: now,
      priority: 0.8,
    })),
  ];

  return [
    ...staticPages,
    ...content.galleries.map((g) => ({
      url: absoluteUrl(`${CATEGORY_META[g.category].path}/${g.slug}`),
      lastModified: new Date(g._updatedAt),
      priority: 0.8,
    })),
    ...content.venues.map((v) => ({
      url: absoluteUrl(`/venues/${v.slug}`),
      lastModified: new Date(v._updatedAt),
      priority: 0.6,
    })),
    ...content.posts.map((p) => ({
      url: absoluteUrl(`/${p.slug}`),
      lastModified: new Date(p._updatedAt),
      priority: 0.6,
    })),
    ...content.categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: new Date(c._updatedAt),
      priority: 0.4,
    })),
  ];
}
