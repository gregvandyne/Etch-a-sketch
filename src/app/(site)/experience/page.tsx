import Link from "next/link";

import { Photo } from "@/components/Photo";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { Testimonials } from "@/components/Testimonials";
import { InquireBand } from "@/components/ui";
import { getCategoryPhotographs, getExperiencePage, getTestimonials } from "@/lib/content";
import { createPhotoPicker, hasImage } from "@/lib/photo-fallback";
import { buildMetadata } from "@/lib/seo";
import type { GalleryCategory, PhotoSource } from "@/lib/types";

export async function generateMetadata() {
  const page = await getExperiencePage();
  return buildMetadata({
    title: "The Experience",
    description:
      "What working with Courtney Stockton feels like: calm guidance, thoughtful preparation, and photography that lets your day unfold naturally.",
    path: "/experience",
    image: page.heroImage,
    seo: page.seo,
  });
}

const paragraphs = (text?: string) =>
  (text ?? "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

/** Default handwritten captions when a step doesn't set its own. */
const PHASE_LABELS = [
  "before the wedding",
  "the engagement session",
  "on the wedding day",
  "after the celebration",
];

/** The blush "Find out more" diamond from the original page. */
function DiamondLink({
  href,
  down = false,
  className = "",
}: {
  href: string;
  down?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group z-20 flex h-28 w-28 items-center justify-center ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-2 rotate-45 bg-blush/60 transition-colors group-hover:bg-blush"
      />
      <span className="relative text-center">
        <span className="font-display block text-[13px] italic leading-tight text-ink/80">
          Find out
          <br />
          more
        </span>
        <span
          aria-hidden="true"
          className={`mt-1 block text-sm leading-none text-charcoal ${down ? "rotate-90" : ""}`}
        >
          »
        </span>
      </span>
    </Link>
  );
}

export default async function ExperiencePage() {
  const [page, testimonials, wedding, engagement, family] = await Promise.all([
    getExperiencePage(),
    getTestimonials(),
    getCategoryPhotographs("wedding"),
    getCategoryPhotographs("engagement"),
    getCategoryPhotographs("family"),
  ]);

  // Every photo slot is filled: CMS images first, then portfolio photographs
  // (never repeating one on the page). The slot photos share one 3:4 frame so
  // the page reads as a matched set, and the slideshows cycle through them.
  const steps = page.steps ?? [];
  const pick = createPhotoPicker(
    { wedding, engagement, family },
    [page.heroImage, page.closingImage, ...steps.map((s) => s.image)]
  );
  const rotation: GalleryCategory[] = ["wedding", "engagement", "family"];
  const frames = (own: PhotoSource | undefined, category: GalleryCategory) =>
    [hasImage(own) ? own : undefined, pick(category), pick(category)].filter(hasImage);

  const introSide = pick("engagement");
  const introFrames = frames(page.heroImage, "wedding");
  const stepSections = steps.map((step, i) => ({
    ...step,
    phase: step.phase ?? PHASE_LABELS[i],
    frames: frames(step.image, rotation[i % rotation.length]),
  }));
  const closingImage = hasImage(page.closingImage) ? page.closingImage : pick("wedding");

  return (
    <>
      {/* ——— Intro: staggered photographs, handwritten title, the promise ——— */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 lg:pb-32 lg:pt-16">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="reveal-image hidden lg:col-span-3 lg:mt-32 lg:block">
              {introSide ? (
                <Photo
                  photo={introSide}
                  sizes="(min-width: 1024px) 22vw, 0px"
                  aspect="3/4"
                />
              ) : null}
            </div>
            <div className="relative order-2 lg:order-none lg:col-span-5">
              <PhotoSlideshow
                photos={introFrames}
                aspect="3/4"
                sizes="(min-width: 1024px) 38vw, 100vw"
                priority
              />
              <DiamondLink href="#step-1" down className="absolute -right-10 bottom-20 hidden lg:flex" />
            </div>
            <div className="order-1 lg:order-none lg:col-span-4 lg:pl-4 lg:pt-12">
              <h1 className="font-script text-right text-5xl leading-[1.15] text-charcoal sm:text-6xl">
                {page.heading ?? "the experience"}
              </h1>
              <div className="mt-10">
                {paragraphs(page.introText).map((p, i) => (
                  <p key={i} className="mt-5 text-justify leading-loose text-charcoal/85 first:mt-0">
                    {p}
                  </p>
                ))}
              </div>
              {page.introAccent ? (
                <p className="font-display mt-10 text-right text-xl italic leading-snug text-umber">
                  {page.introAccent}
                </p>
              ) : null}
              <div className="mt-8 text-right lg:hidden">
                <DiamondLink href="#step-1" down className="relative ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— The phases: cream statement beside a slideshow of the work ——— */}
      {stepSections.map((step, i) => (
        <section key={i} id={`step-${i + 1}`} className="grid lg:grid-cols-2">
          <div className="bg-cream px-6 py-16 sm:px-10 lg:px-16 lg:py-28">
            <div className="mx-auto max-w-lg">
              <h2 className="reveal font-heading text-center text-2xl leading-[1.6] text-white sm:text-3xl">
                {step.title}
              </h2>
              <div className="reveal mt-10">
                {paragraphs(step.description).map((p, j) => (
                  <p key={j} className="mt-5 text-justify leading-loose text-charcoal/85 first:mt-0">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-ivory px-6 py-16 sm:px-10 lg:py-28">
            <div className="relative mx-auto w-full max-w-sm">
              {step.phase ? (
                <p
                  aria-hidden="true"
                  className="font-script relative z-10 -mb-6 text-3xl leading-snug text-ink sm:text-4xl"
                >
                  {step.phase}
                </p>
              ) : null}
              <PhotoSlideshow
                photos={step.frames}
                aspect="3/4"
                sizes="(min-width: 640px) 384px, 90vw"
              />
              <DiamondLink
                href="/information"
                className="absolute -bottom-14 left-1/2 -translate-x-1/2"
              />
            </div>
          </div>
        </section>
      ))}

      {/* ——— Closing: full-bleed black & white with the promise ——— */}
      <section className="relative overflow-hidden bg-charcoal">
        {closingImage ? (
          <div className="absolute inset-0" aria-hidden="true">
            <Photo
              photo={closingImage}
              sizes="100vw"
              desaturate
              className="!h-full !w-full"
            />
          </div>
        ) : null}
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-40">
          {page.closingText ? (
            <div className="reveal max-w-md bg-ink/35 p-7 sm:p-9">
              {paragraphs(page.closingText).map((p, i) => (
                <p key={i} className="mt-4 text-sm leading-relaxed text-white first:mt-0 sm:text-[0.95rem]">
                  {p}
                </p>
              ))}
            </div>
          ) : null}
          {page.closingStatement ? (
            <h2 className="reveal font-heading text-right text-3xl leading-[1.6] text-white sm:text-4xl">
              {page.closingStatement}
            </h2>
          ) : null}
        </div>
        <p className="font-script relative pb-10 text-center text-3xl text-white/90 sm:text-4xl">
          courtney stockton photography
        </p>
      </section>

      {/* Every kind word, not just the homepage favorites */}
      <Testimonials testimonials={testimonials} heading="Kind words from clients" more={4} />

      <InquireBand
        location="experience"
        heading="Ready when you are"
        text="Share your date and your plans, and Courtney will reply personally with everything you need to know."
      />
    </>
  );
}
