import type { Metadata } from "next";
import Link from "next/link";

import { Photo } from "@/components/Photo";
import { GalleryCard } from "@/components/GalleryCard";
import { Testimonials } from "@/components/Testimonials";
import { Button, Heading, InquireBand, Label, TextLink } from "@/components/ui";
import { getFeaturedTestimonials, getHomePage } from "@/lib/content";
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
  const [home, testimonials] = await Promise.all([
    getHomePage(),
    getFeaturedTestimonials(),
  ]);

  const featured = home.featuredGalleries ?? [];
  const categories = Object.entries(CATEGORY_META) as [
    keyof typeof CATEGORY_META,
    (typeof CATEGORY_META)[keyof typeof CATEGORY_META],
  ][];

  return (
    <>
      {/* ——— Hero ——— */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 sm:pt-14 lg:pb-24 lg:pt-20">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Label className="mb-6">Sonoma · Napa · Northern California</Label>
              <h1 className="font-display text-[2.6rem] leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
                {home.heroHeadline ?? "Sonoma County Wedding & Family Photographer"}
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-umber">
                {home.heroSubline ??
                  "Timeless, editorial photography for weddings, engagements and families in wine country and beyond."}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <Button href="/galleries">View the Portfolio</Button>
                <Button href="/contact" variant="outline" trackInquiry="hero">
                  Inquire
                </Button>
              </div>
            </div>
            <div className="hidden lg:col-span-5 lg:block">
              <Photo
                photo={home.heroImageSecondary ?? home.heroImage}
                sizes="(min-width: 1024px) 420px, 0px"
                aspect="4/5"
                priority
              />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1600px] lg:px-8">
          <Photo
            photo={home.heroImage}
            sizes="(min-width: 1600px) 1536px, 100vw"
            aspect="16/9"
            priority
          />
        </div>
      </section>

      {/* ——— Introduction ——— */}
      <section className="bg-parchment">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="reveal mx-auto w-full max-w-sm lg:col-span-4 lg:max-w-none">
              <Photo
                photo={home.introImage}
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 384px, 100vw"
                aspect="3/4"
              />
            </div>
            <div className="reveal lg:col-span-7 lg:col-start-6">
              <Label className="mb-5">The photographer</Label>
              <Heading>{home.introHeading ?? "Hello — I'm Courtney"}</Heading>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal/85">
                {home.introText}
              </p>
              <div className="mt-8">
                <TextLink href="/about">Meet Courtney</TextLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Philosophy ——— */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="reveal mx-auto max-w-2xl text-center">
            <Label className="mb-5">The approach</Label>
            <Heading>{home.philosophyHeading ?? "Photographs that feel like memory"}</Heading>
            <p className="mt-6 text-lg leading-relaxed text-umber">{home.philosophyText}</p>
          </div>
          {home.philosophyImages && home.philosophyImages.length > 0 ? (
            <div className="mt-14 grid grid-cols-2 items-start gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {home.philosophyImages.slice(0, 3).map((photo, i) => (
                <div
                  key={i}
                  className={`reveal ${i === 1 ? "lg:mt-16" : ""} ${
                    i === 2 ? "hidden lg:block" : ""
                  }`}
                >
                  <Photo
                    photo={photo}
                    sizes="(min-width: 1024px) 400px, 50vw"
                    aspect={i === 1 ? "3/4" : "4/5"}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ——— Portfolio sections ——— */}
      <section className="border-y border-linen bg-ivory">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="reveal mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Label className="mb-5">The portfolio</Label>
              <Heading>Real days, told honestly</Heading>
            </div>
            <TextLink href="/galleries">Explore the galleries</TextLink>
          </div>

          {/* Category entry points */}
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-8">
            {categories.map(([key, meta], i) => {
              const cover = featured.find((g) => g.category === key)?.coverImage;
              return (
                <Link key={key} href={meta.path} className="group reveal block">
                  <div className="overflow-hidden bg-linen">
                    <Photo
                      photo={cover}
                      sizes="(min-width: 640px) 33vw, 100vw"
                      aspect={i === 1 ? "3/4" : "3/4"}
                      className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between">
                    <h3 className="font-display text-2xl text-ink group-hover:text-wine sm:text-3xl">
                      {meta.plural}
                    </h3>
                    <span className="label text-taupe transition-transform duration-300 group-hover:translate-x-1">
                      View →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Featured stories */}
          {featured.length > 3 ? (
            <div className="mt-20">
              <Label className="reveal mb-10">Featured stories</Label>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {featured.slice(0, 3).map((g) => (
                  <div key={g._id} className="reveal">
                    <GalleryCard gallery={g} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ——— The experience ——— */}
      <section className="bg-charcoal text-ivory">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <Label className="reveal mb-5 text-sand">Working together</Label>
          <h2 className="reveal font-display text-3xl text-ivory sm:text-4xl lg:text-5xl">
            Gently guided, honestly told
          </h2>
          <p className="reveal mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ivory/80">
            Courtney blends gentle direction with documentary storytelling — guiding you when
            it helps and stepping back when it doesn&apos;t, so your day can unfold naturally
            while still feeling visually intentional.
          </p>
          <div className="reveal mt-9">
            <Button href="/experience" variant="light">
              Discover the Experience
            </Button>
          </div>
        </div>
      </section>

      {/* ——— Kind words ——— */}
      <Testimonials testimonials={testimonials} />

      {/* ——— Service area / local SEO ——— */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 lg:py-24">
          <Label className="reveal mb-5">Where</Label>
          <h2 className="reveal font-display text-3xl text-ink sm:text-4xl">
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
            — from Healdsburg and Glen Ellen to St.&nbsp;Helena and Calistoga — as well as{" "}
            <Link href="/sonoma-elopement-photography" className="border-b border-taupe hover:border-charcoal">
              elopements
            </Link>{" "}
            across Northern California. She also travels worldwide, and{" "}
            <Link href="/seattle-wedding-photography" className="border-b border-taupe hover:border-charcoal">
              Seattle
            </Link>{" "}
            — her favorite place — never carries a travel fee.
          </p>
        </div>
      </section>

      <InquireBand location="homepage" />
    </>
  );
}
