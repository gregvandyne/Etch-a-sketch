"use client";

import { useState, type ReactNode } from "react";

import type { PhotoSource } from "@/lib/types";
import { Lightbox } from "./GalleryViewer";
import { Photo } from "./Photo";

/**
 * The scrolling collage from Courtney's site: photographs flow in two
 * staggered columns (the second starts lower, so the page drifts like a
 * pinboard), while the text block beside them stays pinned in view as the
 * photos scroll past. Every photograph opens the fullscreen lightbox.
 */
export function CollageGallery({
  photographs,
  aside,
  asideFirst = false,
}: {
  photographs: PhotoSource[];
  /** Pinned text block (title, quote, links) that photos scroll past. */
  aside?: ReactNode;
  /** Pin the text on the left instead of the right. */
  asideFirst?: boolean;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!photographs || photographs.length === 0) return null;

  const columns: { photo: PhotoSource; index: number }[][] = [[], []];
  photographs.forEach((photo, index) => columns[index % 2].push({ photo, index }));

  const photoButton = ({ photo, index }: { photo: PhotoSource; index: number }) => (
    <button
      key={index}
      type="button"
      onClick={() => setLightbox(index)}
      className="reveal-image block w-full cursor-zoom-in overflow-hidden bg-linen"
      aria-label={`View photograph ${index + 1} of ${photographs.length} fullscreen${photo.alt ? `: ${photo.alt}` : ""}`}
    >
      <Photo
        photo={photo}
        sizes={aside ? "(min-width: 1024px) 30vw, 50vw" : "(min-width: 1024px) 42vw, 50vw"}
        className="hover-zoom"
      />
    </button>
  );

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
      {/* The aside comes first in the DOM so titles read first on mobile;
          on desktop the order classes place it beside the columns. */}
      {aside ? (
        <div className={`lg:col-span-4 ${asideFirst ? "lg:order-1" : "lg:order-2"}`}>
          <div className="lg:sticky lg:top-32">{aside}</div>
        </div>
      ) : null}

      <div
        className={`grid grid-cols-2 items-start gap-4 sm:gap-6 lg:gap-8 ${
          aside
            ? `lg:col-span-8 ${asideFirst ? "lg:order-2" : "lg:order-1"}`
            : "lg:col-span-12"
        }`}
      >
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {columns[0].map(photoButton)}
        </div>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 pt-12 sm:pt-20 lg:pt-28">
          {columns[1].map(photoButton)}
        </div>
      </div>


      {lightbox !== null ? (
        <Lightbox
          photographs={photographs}
          index={lightbox}
          onNavigate={setLightbox}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </div>
  );
}
