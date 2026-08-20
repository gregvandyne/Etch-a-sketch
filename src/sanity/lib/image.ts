import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

import { dataset, projectId } from "@/sanity/env";

const builder = createImageUrlBuilder({ projectId: projectId || "placeholder", dataset });

/**
 * Build a Sanity CDN URL for an image. Always request auto-format so the
 * CDN serves WebP/AVIF to browsers that support them.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format");
}
