"use client";

import { useEffect, useState } from "react";

import type { PhotoSource } from "@/lib/types";
import { Photo } from "./Photo";

/**
 * Ambient crossfading slideshow, as on the original Experience page: the
 * photographs in a slot fade into one another slowly. Static (first frame
 * only) under reduced motion, with a single photo, or without JavaScript.
 */
export function PhotoSlideshow({
  photos,
  sizes = "100vw",
  aspect = "3/4",
  interval = 4500,
  className = "",
  priority = false,
}: {
  photos: PhotoSource[];
  sizes?: string;
  aspect?: string;
  interval?: number;
  className?: string;
  priority?: boolean;
}) {
  const frames = photos.slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (frames.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % frames.length), interval);
    return () => clearInterval(id);
  }, [frames.length, interval]);

  if (frames.length === 0) return null;

  return (
    <div
      className={`relative overflow-hidden bg-linen ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {frames.map((photo, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[var(--dur-mid)] ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Photo
            photo={photo}
            sizes={sizes}
            aspect={aspect}
            priority={priority && i === 0}
            className="!h-full !w-full"
          />
        </div>
      ))}
    </div>
  );
}
