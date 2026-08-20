import type { Metadata } from "next";
import Link from "next/link";

import { CollageGallery } from "@/components/CollageGallery";
import { GalleryCard } from "@/components/GalleryCard";
import { InstagramStrip } from "@/components/InstagramStrip";
import { Photo } from "@/components/Photo";
import { Testimonials } from "@/components/Testimonials";
import { Heading, InquireBand, Label, TextLink } from "@/components/ui";
import {
  getCategoryPhotographs,
  getFeaturedTestimonials,
  getHomePage,
} from "@/lib/content";
import type { PhotoSource } from "@/lib/types";
import { buildMetadata } from "@/lib/seo";
import { CATEGORY_META, SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomePage();
  return {
    ...buildMetadata({
      title: `Sonoma County Wedding & Family Photographer | ${SITE_NAME}`,
      description:
        "Timeless, editorial wedding and family photography in Sonoma, Napa & Wine Country. Book Courtney Stockton for your Sonoma County wedding or portrait session.",
      path: "/",
      image: home.heroImage,
      seo: home.seo,
    }),
    // The homepage sets the full title itself, outside the template.
    title: {
      absolute:
        home.seo?.title ?? `Sonoma County Wedding & Family Photographer | ${SITE_NAME}`,
    },
  };
}

export default async function HomePage() {
  const [home, testimonials, weddingPhotos, engagementPhotos, familyPhotos] =
    await Promise.all([
      getHomePage(),
      getFeaturedTestimonials(),
      getCategoryPhotographs("wedding"),
      getCategoryPhotographs("engagement"),
      getCategoryPhotographs("family"),
    ]);

  const featured = home.featuredGalleries ?? [];
  const categories = Object.entries(CATEGORY_META) as [
    keyof typeof CATEGORY_META,
    (typeof CATEGORY_META)[keyof typeof CATEGORY_META],
  ][];

  // The portfolio collage: a few photographs from each category, interleaved
  // so weddings, engagements and families mix like the original homepage.
  const collage: PhotoSource[] = [];
  const pools = [weddingPhotos, engagementPhotos, familyPhotos];
  for (let i = 0; i < 3 && collage.length < 8; i++) {
    for (const pool of pools) {
      if (pool[i] && collage.length < 8) collage.push(pool[i]);
    }
  }

  const heroPortrait = home.heroImageSecondary ?? home.heroImage;
  const matted = home.philosophyImages?.[0] ?? home.heroImageSecondary;

  return (
    <>
      {/* ——— Hero: "welcome to" collage, headline overlapping the portrait ——— */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:pb-24 lg:pt-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-0">
            {/* Headline block */}
            <div className="relative z-10 text-center lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:mt-16">
              <p aria-hidden="true" className="font-script text-4xl text-charcoal/85 sm:text-5xl">
                welcome to
              </p>
              <h1 className="font-heading mt-4 text-2xl leading-[1.5] text-charcoal sm:text-3xl lg:whitespace-nowrap lg:text-[2.8rem]">
                Courtney Stockton
                <br />
                Photography
              </h1>
              <p className="font-display mt-6 text-xl italic leading-snug text-umber sm:text-2xl">
                Sonoma County
                <br />
                Wedding &amp; Family Photographer
              </p>
              <div className="mt-8 lg:hidden">
                <TextLink href="/galleries">View the Portfolio</TextLink>
              </div>

              {/* Secondary photograph in black & white, below the headline */}
              <div className="reveal-image mt-14 hidden overflow-hidden lg:mr-56 lg:block">
                <Photo
                  photo={home.heroImage}
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  aspect="3/2"
                  priority
                  className="grayscale"
                />
              </div>
            </div>

            {/* Tall portrait with the diamond portfolio badge */}
            <div className="relative lg:col-span-6 lg:col-start-7 lg:row-start-1">
              <Photo
                photo={heroPortrait}
                sizes="(min-width: 1024px) 48vw, 100vw"
                aspect="2/3"
                priority
              />
              <Link
                href="/galleries"
                className="group absolute bottom-24 -left-16 z-20 hidden h-36 w-36 items-center justify-center lg:flex"
              >
                {/* The diamond is a rotated backdrop; the text stays level. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-3 rotate-45 border border-linen bg-ivory transition-colors group-hover:bg-parchment"
                />
                <span className="relative text-center">
                  <span className="font-display block text-sm italic text-umber">View the</span>
                  <span className="label block text-[0.625rem] text-ink">Portfolio</span>
                  <span aria-hidden="true" className="mt-0.5 block text-xs text-charcoal">
                    »
                  </span>
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile: the black & white photograph after the portrait */}
          <div className="reveal-image mt-5 lg:hidden">
            <Photo
              photo={home.heroImage}
              sizes="100vw"
              aspect="3/2"
              className="grayscale"
            />
          </div>
        </div>
      </section>

      {/* ——— Introduction: ghosted wordmark over Courtney's bio ——— */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="reveal-image mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
              <Photo
                photo={home.introImage}
                sizes="(min-width: 1024px) 38vw, (min-width: 640px) 448px, 100vw"
                aspect="4/5"
              />
            </div>
            <div className="reveal lg:col-span-6 lg:col-start-7">
              <div className="relative mb-12" aria-hidden="true">
                <p className="font-heading text-5xl text-blush sm:text-6xl lg:text-7xl">
                  Courtney
                </p>
                <p className="font-script absolute -bottom-5 right-0 text-4xl text-charcoal sm:text-5xl lg:-bottom-6 lg:right-6">
                  stockton
                </p>
              </div>
              <h2 className="sr-only">{home.introHeading ?? "Hello, I'm Courtney"}</h2>
              <p className="text-lg text-ink">{home.introHeading ?? "Hi, I'm Courtney"}.</p>
              <p className="mt-5 max-w-xl text-justify leading-loose text-charcoal/85">
                {home.introText}
              </p>
              <div className="mt-9">
                <TextLink href="/about">Meet Courtney</TextLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— The manifesto: cream band, matted photograph ——— */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="reveal mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
              <div className="relative bg-white p-4 sm:p-6">
                <Photo
                  photo={matted}
                  sizes="(min-width: 1024px) 34vw, (min-width: 640px) 400px, 90vw"
                  aspect="3/4"
                />
                <p className="absolute inset-x-8 top-12 text-center sm:top-16">
                  <span className="font-display text-lg italic text-ink/80">
                    Capturing your love should be
                  </span>
                  <span className="label mt-2 block text-ink">Effortless</span>
                </p>
              </div>
            </div>
            <div className="reveal lg:col-span-6 lg:col-start-7">
              <h2 className="font-heading text-4xl leading-[1.3] text-ivory sm:text-5xl lg:text-6xl">
                <span aria-hidden="true">
                  CSP
                  <br />
                  Manifesto
                </span>
                <span className="sr-only">The Courtney Stockton Photography manifesto</span>
              </h2>
              <p className="label mt-10">
                {home.philosophyHeading ?? "Honest moments, beautifully preserved"}
              </p>
              <p className="mt-5 max-w-xl text-justify leading-loose text-charcoal/85">
                {home.philosophyText}
              </p>
              <div className="mt-9">
                <TextLink href="/experience">The Experience</TextLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Portfolio: photo columns scroll past the pinned text ——— */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-32">
          <CollageGallery
            photographs={collage}
            aside={
              <div className="lg:pl-6">
                <h2 className="font-heading text-3xl text-charcoal sm:text-4xl lg:-ml-28 lg:text-5xl">
                  Portfolio
                </h2>
                <p className="font-display mt-9 text-xl italic leading-relaxed text-charcoal/80">
                  we were together
                  <br />
                  i forget the rest
                </p>
                <p className="label mt-3 text-taupe">— Walt Whitman</p>
                <ul className="mt-12 space-y-5">
                  {categories.map(([key, meta]) => (
                    <li key={key}>
                      <Link
                        href={meta.path}
                        className="font-heading text-lg text-charcoal underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current sm:text-xl"
                      >
                        {meta.plural}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
        </div>
      </section>

      {/* ——— Featured stories ——— */}
      {featured.length > 0 ? (
        <section className="border-t border-linen">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-32">
            <div className="reveal mb-14 flex flex-wrap items-end justify-between gap-6">
              <div>
                <Label className="mb-5">Featured stories</Label>
                <Heading>Real days, told honestly</Heading>
              </div>
              <TextLink href="/galleries">Explore the galleries</TextLink>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((g) => (
                <div key={g._id} className="reveal">
                  <GalleryCard gallery={g} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ——— The experience ——— */}
      <section className="bg-charcoal text-ivory">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:py-32">
          <Label className="reveal mb-5 text-sand">Working together</Label>
          <h2 className="reveal font-heading text-2xl text-ivory sm:text-3xl">
            Gently guided, honestly told
          </h2>
          <p className="reveal mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ivory/80">
            Courtney blends gentle direction with documentary storytelling, guiding you when
            it helps and stepping back when it doesn&apos;t, so your day can unfold naturally
            while still feeling visually intentional.
          </p>
          <div className="reveal mt-9">
            <Link
              href="/experience"
              className="label inline-block border border-ivory px-8 py-4 text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
            >
              Discover the Experience
            </Link>
          </div>
        </div>
      </section>

      {/* ——— Kind words ——— */}
      <Testimonials testimonials={testimonials} />

      {/* ——— Service area / local SEO ——— */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <Label className="reveal mb-5">Where</Label>
          <h2 className="reveal font-heading text-2xl text-ink sm:text-3xl">
            Rooted in wine country
          </h2>
          <p className="reveal mx-auto mt-6 leading-relaxed text-umber">
            Courtney photographs weddings, engagements and families throughout{" "}
            <Link href="/sonoma-wedding-photography" className="border-b border-taupe hover:border-charcoal">
              Sonoma County
            </Link>{" "}
            and{" "}
            <Link href="/napa-wedding-photography" className="border-b border-taupe hover:border-charcoal">
              Napa Valley
            </Link>
            and the towns between, from Healdsburg and Glen Ellen to St.&nbsp;Helena and Calistoga, as well as{" "}
            <Link href="/sonoma-elopement-photography" className="border-b border-taupe hover:border-charcoal">
              elopements
            </Link>{" "}
            across Northern California. She also travels worldwide, and{" "}
            <Link href="/seattle-wedding-photography" className="border-b border-taupe hover:border-charcoal">
              Seattle
            </Link>{" "}
            , her favorite place, never carries a travel fee.
          </p>
        </div>
      </section>

      <InquireBand location="homepage" />

      {/* Latest from Instagram (renders only when the feed is connected) */}
      <InstagramStrip />
    </>
  );
}
