"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PhotoSource } from "@/lib/types";
import { Photo } from "./Photo";

/**
 * The photograph sequence on a gallery page: an editorial single-column /
 * paired flow (portrait pairs, full-bleed landscapes) with an accessible
 * fullscreen lightbox — keyboard, swipe and reduced-motion friendly.
 */
export function GalleryViewer({ photographs }: { photographs: PhotoSource[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Build editorial rows: consecutive portraits pair up, landscapes run full width.
  const rows: { photos: { photo: PhotoSource; index: number }[] }[] = [];
  let i = 0;
  while (i < photographs.length) {
    const current = photographs[i];
    const next = photographs[i + 1];
    const isPortrait = (p?: PhotoSource) => (p?.aspectRatio ?? 1.5) < 1.05;
    if (isPortrait(current) && next && isPortrait(next)) {
      rows.push({
        photos: [
          { photo: current, index: i },
          { photo: next, index: i + 1 },
        ],
      });
      i += 2;
    } else {
      rows.push({ photos: [{ photo: current, index: i }] });
      i += 1;
    }
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {rows.map((row, r) => (
          <div
            key={r}
            className={`reveal grid gap-4 sm:gap-6 ${
              row.photos.length === 2 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {row.photos.map(({ photo, index }) => (
              <button
                key={index}
                type="button"
                className="block w-full cursor-zoom-in"
                onClick={() => setLightbox(index)}
                aria-label={`View photograph ${index + 1} of ${photographs.length} fullscreen${photo.alt ? `: ${photo.alt}` : ""}`}
              >
                <Photo
                  photo={photo}
                  sizes={
                    row.photos.length === 2
                      ? "(min-width: 1024px) 480px, 50vw"
                      : "(min-width: 1024px) 980px, 100vw"
                  }
                />
              </button>
            ))}
          </div>
        ))}
      </div>

      {lightbox !== null ? (
        <Lightbox
          photographs={photographs}
          index={lightbox}
          onNavigate={setLightbox}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  photographs,
  index,
  onNavigate,
  onClose,
}: {
  photographs: PhotoSource[];
  index: number;
  onNavigate: (i: number) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  const prev = useCallback(
    () => onNavigate(index === 0 ? photographs.length - 1 : index - 1),
    [index, photographs.length, onNavigate]
  );
  const next = useCallback(
    () => onNavigate(index === photographs.length - 1 ? 0 : index + 1),
    [index, photographs.length, onNavigate]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    containerRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [prev, next, onClose]);

  const photo = photographs[index];

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${photographs.length}`}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 48) (dx > 0 ? prev : next)();
        touchStart.current = null;
      }}
    >
      <div
        className="flex max-h-[92svh] max-w-[94vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Photo
          photo={photo}
          sizes="94vw"
          quality={85}
          className="!h-auto !w-auto max-h-[92svh] max-w-[94vw] object-contain"
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="label absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-2xl font-light text-ivory/90 hover:text-ivory"
        aria-label="Close fullscreen view"
      >
        ×
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-1 top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center text-3xl font-light text-ivory/80 hover:text-ivory sm:flex"
        aria-label="Previous photograph"
      >
        ←
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-1 top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center text-3xl font-light text-ivory/80 hover:text-ivory sm:flex"
        aria-label="Next photograph"
      >
        →
      </button>
      <p className="label absolute bottom-4 left-1/2 -translate-x-1/2 text-ivory/70">
        {index + 1} / {photographs.length}
      </p>
    </div>
  );
}
