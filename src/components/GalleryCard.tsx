import Link from "next/link";

import type { GalleryTeaser } from "@/lib/types";
import { CATEGORY_META } from "@/lib/site";
import { Photo } from "./Photo";

interface GalleryCardProps {
  gallery: GalleryTeaser;
  sizes?: string;
  /** Taller editorial crop for featured placements. */
  aspect?: string;
  priority?: boolean;
}

/** A portfolio entry — large photograph first, quiet caption beneath. */
export function GalleryCard({
  gallery,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  aspect = "4/5",
  priority = false,
}: GalleryCardProps) {
  // The "-highlights" galleries hold the photos shown directly on the
  // portfolio pages, so their cards go straight there — one click, not two.
  const isHighlights = gallery.slug.endsWith("-highlights");
  const href = isHighlights
    ? CATEGORY_META[gallery.category].path
    : `${CATEGORY_META[gallery.category].path}/${gallery.slug}`;
  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden bg-linen">
        <Photo
          photo={gallery.coverImage}
          sizes={sizes}
          aspect={aspect}
          priority={priority}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4">
        <h3 className="font-display text-xl text-ink transition-colors group-hover:text-wine sm:text-2xl">
          {gallery.title}
        </h3>
        <p className="label mt-1.5 text-taupe">
          {[gallery.venueName, gallery.location].filter(Boolean).join(" · ") ||
            (isHighlights
              ? "View the collection"
              : CATEGORY_META[gallery.category].plural)}
        </p>
      </div>
    </Link>
  );
}

/** Responsive editorial grid of gallery cards. */
export function GalleryGrid({ galleries }: { galleries: GalleryTeaser[] }) {
  if (galleries.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
      {galleries.map((g, i) => (
        <div key={g._id} className={`reveal ${i % 3 === 1 ? "lg:mt-12" : ""}`}>
          <GalleryCard gallery={g} priority={i < 3} />
        </div>
      ))}
    </div>
  );
}
