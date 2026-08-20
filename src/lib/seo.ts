import type { Metadata } from "next";

import { photoUrl } from "@/components/Photo";
import type { PhotoSource, Seo } from "./types";
import { absoluteUrl } from "./site";

/**
 * Build page metadata from CMS SEO overrides + sensible defaults.
 * Every page gets a unique title, description, canonical and share image
 * without Courtney having to think about technical SEO.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  seo,
  type = "website",
}: {
  title: string;
  description?: string;
  path: string;
  image?: PhotoSource | null;
  seo?: Seo;
  type?: "website" | "article";
}): Metadata {
  const finalTitle = seo?.title ?? title;
  const finalDescription = seo?.description ?? description;
  // Pages without a photograph fall back to the branded sharing card (/og).
  const shareImage = photoUrl(seo?.image ?? image) ?? absoluteUrl("/og");
  const canonical = absoluteUrl(path);

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: { canonical },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonical,
      type,
      images: [{ url: shareImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [shareImage],
    },
    ...(seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** BreadcrumbList JSON-LD. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
