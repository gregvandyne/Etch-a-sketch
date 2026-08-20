import { urlFor } from "@/sanity/lib/image";
import type { PhotoSource } from "@/lib/types";

const SRCSET_WIDTHS = [480, 720, 960, 1200, 1600, 2000, 2560];

interface PhotoProps {
  photo?: PhotoSource | null;
  /** The `sizes` attribute — how wide the image renders at each breakpoint. */
  sizes?: string;
  /** Eager-load and prioritize (above-the-fold heroes only). */
  priority?: boolean;
  className?: string;
  /**
   * Force an aspect ratio (e.g. "3/4"). Defaults to the photograph's own
   * ratio so nothing is cropped; when forced, Sanity crops around the
   * focal point Courtney set in the Studio.
   */
  aspect?: string;
  /** Sanity CDN quality (default 80 — high quality without huge payloads). */
  quality?: number;
}

function parseAspect(aspect?: string, fallback?: number): number | undefined {
  if (!aspect) return fallback;
  const [w, h] = aspect.split("/").map(Number);
  return w && h ? w / h : fallback;
}

/**
 * The site's single image component. Renders a plain <img> with a full
 * responsive srcset served by Sanity's image CDN (auto WebP/AVIF, focal-point
 * aware crops) — no client-side JavaScript, no layout shift. Local placeholder
 * files (pre-CMS development only) render directly.
 */
export function Photo({
  photo,
  sizes = "100vw",
  priority = false,
  className = "",
  aspect,
  quality = 80,
}: PhotoProps) {
  if (!photo) return null;

  const ratio = parseAspect(aspect, photo.aspectRatio) ?? 3 / 2;
  const alt = photo.alt ?? "";
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : "auto";

  // Explicit dimensions (from ratio) prevent layout shift before load.
  const width = 2000;
  const height = Math.round(width / ratio);

  if (photo.placeholder) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local labeled placeholder, no optimizer needed
      <img
        src={photo.placeholder}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={`block h-auto w-full object-cover ${className}`}
        style={aspect ? { aspectRatio: aspect } : undefined}
      />
    );
  }

  if (!photo.asset) return null;

  const buildUrl = (w: number) => {
    let b = urlFor(photo).width(w).quality(quality).fit("crop");
    if (aspect) b = b.height(Math.round(w / ratio));
    return b.url();
  };

  const srcSet = SRCSET_WIDTHS.map((w) => `${buildUrl(w)} ${w}w`).join(", ");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- responsive srcset served by Sanity's image CDN; the Next optimizer would add cost without benefit
    <img
      src={buildUrl(1200)}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={`block h-auto w-full object-cover ${className}`}
      style={{
        aspectRatio: aspect ?? undefined,
        backgroundColor: "var(--color-linen)",
        backgroundImage: photo.lqip ? `url(${photo.lqip})` : undefined,
        backgroundSize: "cover",
      }}
    />
  );
}

/** Direct URL for social-sharing images (OpenGraph requires absolute URLs). */
export function photoUrl(photo: PhotoSource | undefined | null, width = 1200, height = 630): string | null {
  if (!photo) return null;
  if (photo.placeholder) return null;
  if (!photo.asset) return null;
  return urlFor(photo).width(width).height(height).quality(80).fit("crop").url();
}
