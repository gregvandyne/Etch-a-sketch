import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentViewTracker } from "@/components/ContentViewTracker";
import { GalleryGrid } from "@/components/GalleryCard";
import { GalleryViewer } from "@/components/GalleryViewer";
import { Photo } from "@/components/Photo";
import { Prose } from "@/components/Prose";
import { Heading, InquireBand, Label, TextLink } from "@/components/ui";
import { getGalleries, getGallery, getGallerySlugs } from "@/lib/content";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { CATEGORY_META, type CategoryKey } from "@/lib/site";

/* ——— Category listing page (Weddings / Engagements / Families) ——— */

export function categoryMetadata(category: CategoryKey): Metadata {
  const meta = CATEGORY_META[category];
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: meta.path,
  });
}

export async function CategoryPage({ category }: { category: CategoryKey }) {
  const meta = CATEGORY_META[category];
  const galleries = await getGalleries(category);

  const intro: Record<CategoryKey, string> = {
    wedding:
      "Wedding days told honestly — refined portraits, remembered details, and the unrepeatable moments in between, from vineyard estates to intimate backyard celebrations.",
    engagement:
      "Relaxed, romantic sessions in the places that mean something to you — golden vineyard rows, foggy coastlines, and the towns where your story began.",
    family:
      "Warm, unhurried photographs of your people — at home, in the meadow, or among the vines. Little ones welcome exactly as they are.",
  };

  return (
    <>
      <ContentViewTracker
        event="Portfolio Viewed"
        path={meta.path}
        props={{ category }}
      />
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center lg:mb-20">
          <Label className="mb-5">The portfolio</Label>
          <Heading as="h1">{meta.plural}</Heading>
          <p className="mt-6 leading-relaxed text-umber">{intro[category]}</p>
        </div>

        {galleries.length > 0 ? (
          <GalleryGrid galleries={galleries} />
        ) : (
          <div className="border border-linen bg-parchment px-8 py-20 text-center">
            <p className="font-display text-2xl text-ink">New stories are on their way</p>
            <p className="mx-auto mt-3 max-w-md text-umber">
              Galleries are being added. In the meantime, Courtney would love to hear
              about your plans.
            </p>
            <div className="mt-8">
              <TextLink href="/contact">Start an inquiry</TextLink>
            </div>
          </div>
        )}
      </div>
      <InquireBand
        location={`portfolio-${category}`}
        heading={
          category === "family"
            ? "Let's photograph your people"
            : "Let's tell your story"
        }
      />
    </>
  );
}

/* ——— Gallery detail page ——— */

export async function galleryStaticParams(category: CategoryKey) {
  const slugs = await getGallerySlugs();
  return slugs.filter((s) => s.category === category).map((s) => ({ slug: s.slug }));
}

export async function galleryMetadata(
  category: CategoryKey,
  slug: string
): Promise<Metadata> {
  const gallery = await getGallery(category, slug);
  if (!gallery) return {};
  const meta = CATEGORY_META[category];
  const parts = [gallery.venueName ?? gallery.venue?.name, gallery.location].filter(Boolean);
  return buildMetadata({
    title: `${gallery.title}${parts.length ? ` | ${parts[0]}` : ""}`,
    description:
      gallery.introduction ??
      `${gallery.title} — ${meta.plural.toLowerCase()} photography by Courtney Stockton${parts.length ? ` at ${parts.join(", ")}` : ""}.`,
    path: `${meta.path}/${slug}`,
    image: gallery.coverImage,
    seo: gallery.seo,
  });
}

export async function GalleryPage({
  category,
  slug,
}: {
  category: CategoryKey;
  slug: string;
}) {
  const gallery = await getGallery(category, slug);
  if (!gallery) notFound();
  const meta = CATEGORY_META[category];

  const season = gallery.date
    ? new Date(gallery.date).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : null;

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: meta.plural, path: meta.path },
    { name: gallery.title, path: `${meta.path}/${slug}` },
  ]);

  return (
    <>
      <ContentViewTracker
        event="Gallery Viewed"
        path={`${meta.path}/${slug}`}
        props={{ category, gallery: gallery.title }}
      />
      <article>
        {/* Opening */}
        <header className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 lg:pt-16">
          <nav aria-label="Breadcrumb" className="label mb-8 text-taupe">
            <Link href={meta.path} className="hover:text-charcoal">
              {meta.plural}
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-umber">
              {gallery.title}
            </span>
          </nav>
          <div className="mx-auto max-w-3xl text-center">
            <Heading as="h1">{gallery.title}</Heading>
            <p className="label mt-5 text-taupe">
              {[gallery.venue?.name ?? gallery.venueName, gallery.location, season]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
            {gallery.introduction ? (
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-umber">
                {gallery.introduction}
              </p>
            ) : null}
          </div>
        </header>

        {/* Cover */}
        <div className="mx-auto mt-12 max-w-[1500px] lg:px-8">
          <Photo
            photo={gallery.coverImage}
            sizes="(min-width: 1500px) 1436px, 100vw"
            aspect="16/9"
            priority
          />
        </div>

        {/* Story + photographs */}
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:py-20">
          {gallery.story ? <Prose value={gallery.story} className="mb-14" /> : null}
          {gallery.photographs && gallery.photographs.length > 0 ? (
            <GalleryViewer photographs={gallery.photographs} />
          ) : (
            <p className="text-center italic text-taupe">
              Photographs for this story are being added.
            </p>
          )}
        </div>

        {/* Venue + related journal */}
        {(gallery.venue || (gallery.relatedPosts && gallery.relatedPosts.length > 0)) && (
          <aside className="border-t border-linen bg-parchment">
            <div className="mx-auto flex max-w-4xl flex-col gap-10 px-5 py-14 text-center sm:px-8">
              {gallery.venue ? (
                <div>
                  <Label className="mb-3">The venue</Label>
                  <p className="font-display text-2xl text-ink">{gallery.venue.name}</p>
                  <div className="mt-4">
                    <TextLink href={`/venues/${gallery.venue.slug}`}>
                      More from {gallery.venue.name}
                    </TextLink>
                  </div>
                </div>
              ) : null}
              {gallery.relatedPosts && gallery.relatedPosts.length > 0 ? (
                <div>
                  <Label className="mb-3">From the journal</Label>
                  <ul className="space-y-2">
                    {gallery.relatedPosts.map((post) => (
                      <li key={post._id}>
                        <Link
                          href={`/${post.slug}`}
                          className="font-display text-xl text-charcoal hover:text-wine"
                        >
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        )}
      </article>
      <InquireBand
        location={`gallery-${category}`}
        heading="Love what you see?"
        text="Courtney books a limited number of weddings and sessions each year. Share your date — she'd love to hear your plans."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
    </>
  );
}
