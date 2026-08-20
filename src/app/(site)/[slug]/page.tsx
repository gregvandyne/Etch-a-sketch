import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { ContentViewTracker } from "@/components/ContentViewTracker";
import { GalleryCard } from "@/components/GalleryCard";
import { Photo, photoUrl } from "@/components/Photo";
import { formatDate } from "@/components/PostCard";
import { Prose } from "@/components/Prose";
import { Button, Heading, InquireBand, Label, TextLink } from "@/components/ui";
import { getPost, getPostSlugs, getRedirectForPath } from "@/lib/content";
import { getLegacyPost } from "@/lib/legacy-posts";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getServiceArea, SERVICE_AREAS } from "@/lib/service-areas";
import { CATEGORY_META, SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * Root-level catch-all, matching the previous WordPress URL structure:
 *  1. Service-area pages (e.g. /sonoma-wedding-photography)
 *  2. Journal posts at their original root slugs (e.g. /lisa-zach-viansa-winery-wedding-sonoma-ca)
 *  3. CMS-managed permanent redirects
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPostSlugs();
  return [
    ...SERVICE_AREAS.map((a) => ({ slug: a.slug })),
    ...posts.map((p) => ({ slug: p.slug })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const area = getServiceArea(slug);
  if (area) {
    return {
      ...buildMetadata({
        title: area.metaTitle,
        description: area.metaDescription,
        path: `/${area.slug}`,
      }),
      title: { absolute: area.metaTitle },
    };
  }

  const post = await getPost(slug);
  if (post) {
    return buildMetadata({
      title: post.title,
      description: post.excerpt,
      path: `/${post.slug}`,
      image: post.featuredImage,
      seo: post.seo,
      type: "article",
    });
  }

  return {};
}

export default async function RootSlugPage({ params }: Props) {
  const { slug } = await params;

  const area = getServiceArea(slug);
  if (area) return <ServiceAreaPage area={area} />;

  const post = await getPost(slug);
  if (post) return <PostPage post={post} />;

  const redirectDoc = await getRedirectForPath(`/${slug}`);
  if (redirectDoc?.to) permanentRedirect(redirectDoc.to);

  // Known post from the previous website that hasn't been recreated yet:
  // temporary redirect (not 404, not permanent) so links and rankings hold
  // until the post is published in the CMS with its original address.
  const legacy = getLegacyPost(slug);
  if (legacy) redirect(legacy.target);

  notFound();
}

/* ——— Service-area page ——— */

function ServiceAreaPage({ area }: { area: NonNullable<ReturnType<typeof getServiceArea>> }) {
  const portfolio = CATEGORY_META[area.portfolioCategory];
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Label className="mb-5">{area.label}</Label>
          <Heading as="h1">{area.title}</Heading>
          <p className="mt-6 text-lg leading-relaxed text-umber">{area.intro}</p>
        </div>
        <div className="mx-auto mt-12 max-w-2xl space-y-5">
          {area.body.map((paragraph, i) => (
            <p key={i} className="leading-relaxed text-charcoal/85">
              {paragraph}
            </p>
          ))}
          {area.venuesNote ? (
            <p className="leading-relaxed text-charcoal/85">
              {area.venuesNote}{" "}
              <Link href="/venues" className="border-b border-taupe hover:border-charcoal">
                Browse the venues →
              </Link>
            </p>
          ) : null}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          <Button href={portfolio.path}>View {portfolio.plural}</Button>
          <TextLink href="/information">Investment & information</TextLink>
        </div>
      </div>
      <InquireBand location={`service-area-${area.slug}`} />
    </>
  );
}

/* ——— Journal post ——— */

function PostPage({ post }: { post: NonNullable<Awaited<ReturnType<typeof getPost>>> }) {
  const date = formatDate(post.publishedAt);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    url: absoluteUrl(`/${post.slug}`),
    author: {
      "@type": "Person",
      name: "Courtney Stockton",
      url: absoluteUrl("/about"),
    },
    publisher: { "@id": `${SITE_URL}/#business` },
    ...(photoUrl(post.featuredImage) ? { image: photoUrl(post.featuredImage) } : {}),
    ...(post.excerpt ? { description: post.excerpt } : {}),
  };

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/${post.slug}` },
  ]);

  return (
    <>
      <ContentViewTracker event="Gallery Viewed" path={`/${post.slug}`} props={{ post: post.title }} />
      <article className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <nav aria-label="Breadcrumb" className="label mb-6 text-taupe">
            <Link href="/blog" className="hover:text-charcoal">
              The journal
            </Link>
            {post.categories?.[0] ? (
              <>
                <span aria-hidden="true" className="mx-2">
                  /
                </span>
                <Link href={`/category/${post.categories[0].slug}`} className="hover:text-charcoal">
                  {post.categories[0].title}
                </Link>
              </>
            ) : null}
          </nav>
          <Heading as="h1">{post.title}</Heading>
          {date ? <p className="label mt-5 text-taupe">{date}</p> : null}
        </header>

        {post.featuredImage ? (
          <div className="mx-auto mt-10 max-w-4xl">
            <Photo
              photo={post.featuredImage}
              sizes="(min-width: 1024px) 896px, 100vw"
              priority
            />
          </div>
        ) : null}

        <div className="mx-auto mt-12 max-w-2xl">
          <Prose value={post.body} />
        </div>

        {(post.relatedGallery || post.relatedVenue) && (
          <aside className="mx-auto mt-16 max-w-4xl border-t border-linen pt-12">
            <div className="grid items-center gap-10 sm:grid-cols-2">
              {post.relatedGallery ? (
                <div>
                  <Label className="mb-5">See the full gallery</Label>
                  <GalleryCard gallery={post.relatedGallery} />
                </div>
              ) : null}
              {post.relatedVenue ? (
                <div className={post.relatedGallery ? "" : "sm:col-span-2 text-center"}>
                  <Label className="mb-3">The venue</Label>
                  <p className="font-display text-2xl text-ink">{post.relatedVenue.name}</p>
                  <div className="mt-4">
                    <TextLink href={`/venues/${post.relatedVenue.slug}`}>
                      Weddings at {post.relatedVenue.name}
                    </TextLink>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        )}
      </article>
      <InquireBand location="journal-post" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
    </>
  );
}
