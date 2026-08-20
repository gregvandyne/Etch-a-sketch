import Link from "next/link";

import { Photo } from "@/components/Photo";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getVenues } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Wedding Venues",
  description:
    "Sonoma and Napa wedding venues photographed by Courtney Stockton: vineyard estates, wineries and wine country gathering places, with real weddings from each.",
  path: "/venues",
});

export default async function VenuesPage() {
  const venues = await getVenues();

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Label className="mb-5">Wine country</Label>
          <Heading as="h1">Venues</Heading>
          <p className="mt-6 leading-relaxed text-umber">
            Vineyard estates, wineries and gathering places Courtney has photographed,
            each with real weddings to explore. Planning at one of these? She already
            knows the light.
          </p>
        </div>

        {venues.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue, i) => (
              <Link key={venue._id} href={`/venues/${venue.slug}`} className="group reveal block">
                <div className="overflow-hidden bg-linen">
                  {venue.heroImage ? (
                    <Photo
                      photo={venue.heroImage}
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                      aspect="4/3"
                      priority={i < 3}
                      className="hover-zoom"
                    />
                  ) : (
                    // Keeps the card's shape for a venue with no imagery yet.
                    <div className="aspect-[4/3]" />
                  )}
                </div>
                <div className="mt-4">
                  <h2 className="font-display text-2xl text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current">
                    {venue.name}
                  </h2>
                  <p className="label mt-1.5 text-taupe">
                    {[
                      venue.location,
                      venue.galleryCount
                        ? `${venue.galleryCount} ${venue.galleryCount === 1 ? "wedding" : "weddings"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center italic text-taupe">Venue pages are being added.</p>
        )}
      </div>
      <InquireBand location="venues" />
    </>
  );
}
