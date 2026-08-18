import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentViewTracker } from "@/components/ContentViewTracker";
import { GalleryGrid } from "@/components/GalleryCard";
import { Photo } from "@/components/Photo";
import { Prose } from "@/components/Prose";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getVenue, getVenueSlugs } from "@/lib/content";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getVenueSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) return {};
  return buildMetadata({
    title: `${venue.name} Wedding Photographer`,
    description: `Weddings photographed at ${venue.name}${venue.location ? ` in ${venue.location}` : ""} by Courtney Stockton, with real galleries, stories and inquiry details.`,
    path: `/venues/${slug}`,
    image: venue.heroImage,
    seo: venue.seo,
  });
}

export default async function VenuePage({ params }: Props) {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) notFound();

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Venues", path: "/venues" },
    { name: venue.name, path: `/venues/${slug}` },
  ]);

  return (
    <>
      <ContentViewTracker
        event="Gallery Viewed"
        path={`/venues/${slug}`}
        props={{ venue: venue.name }}
      />
      <article className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <nav aria-label="Breadcrumb" className="label mb-8 text-taupe">
          <Link href="/venues" className="hover:text-charcoal">
            Venues
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span aria-current="page" className="text-umber">
            {venue.name}
          </span>
        </nav>

        <div className="mx-auto max-w-3xl text-center">
          <Heading as="h1">{venue.name}</Heading>
          {venue.location ? <p className="label mt-4 text-taupe">{venue.location}</p> : null}
        </div>

        {venue.heroImage ? (
          <div className="mx-auto mt-12 max-w-5xl">
            <Photo
              photo={venue.heroImage}
              sizes="(min-width: 1024px) 1024px, 100vw"
              aspect="16/9"
              priority
            />
          </div>
        ) : null}

        {venue.description ? (
          <div className="mx-auto mt-14 max-w-2xl">
            <Prose value={venue.description} />
          </div>
        ) : null}

        {venue.website ? (
          <p className="mt-8 text-center">
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="label border-b border-taupe/60 pb-1 text-charcoal hover:border-charcoal"
            >
              Visit the venue&apos;s website ↗
            </a>
          </p>
        ) : null}

        {venue.galleries && venue.galleries.length > 0 ? (
          <section className="mt-20">
            <Label className="reveal mb-10 text-center">
              Weddings photographed at {venue.name}
            </Label>
            <GalleryGrid galleries={venue.galleries} />
          </section>
        ) : null}

        {venue.posts && venue.posts.length > 0 ? (
          <section className="mt-20 border-t border-linen pt-14 text-center">
            <Label className="mb-6">From the journal</Label>
            <ul className="space-y-3">
              {venue.posts.map((post) => (
                <li key={post._id}>
                  <Link
                    href={`/${post.slug}`}
                    className="font-display text-2xl text-charcoal hover:text-wine"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
      <InquireBand
        location="venue"
        heading={`Getting married at ${venue.name}?`}
        text="Courtney knows this venue's light and rhythm. Share your date; she'd love to hear your plans."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
    </>
  );
}
