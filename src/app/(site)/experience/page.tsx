import { Photo } from "@/components/Photo";
import { Testimonials } from "@/components/Testimonials";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getCategoryPhotographs, getExperiencePage, getTestimonials } from "@/lib/content";
import { createPhotoPicker, hasImage } from "@/lib/photo-fallback";
import { buildMetadata } from "@/lib/seo";
import type { GalleryCategory } from "@/lib/types";

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

export default async function ExperiencePage() {
  const [page, testimonials, wedding, engagement, family] = await Promise.all([
    getExperiencePage(),
    getTestimonials(),
    getCategoryPhotographs("wedding"),
    getCategoryPhotographs("engagement"),
    getCategoryPhotographs("family"),
  ]);

  // Empty image slots borrow portfolio photographs (a Studio-set image
  // always wins): the hero from her weddings, the steps rotating through
  // the categories so the page shows the breadth of her work.
  const pick = createPhotoPicker(
    { wedding, engagement, family },
    [page.heroImage, ...(page.steps ?? []).map((s) => s.image)]
  );
  const heroImage = hasImage(page.heroImage) ? page.heroImage : pick("wedding");
  const rotation: GalleryCategory[] = ["wedding", "engagement", "family"];
  const steps = (page.steps ?? []).map((step, i) => ({
    ...step,
    image: hasImage(step.image) ? step.image : pick(rotation[i % rotation.length]),
  }));

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Label className="mb-5">Working together</Label>
          <Heading as="h1">{page.heading ?? "The Experience"}</Heading>
          {page.introText ? (
            <p className="mt-6 text-lg leading-relaxed text-umber">{page.introText}</p>
          ) : null}
        </div>

        {heroImage ? (
          <div className="mx-auto mt-14 max-w-5xl">
            <Photo
              photo={heroImage}
              sizes="(min-width: 1024px) 1024px, 100vw"
              aspect="16/9"
              priority
            />
          </div>
        ) : null}

        {/* Steps */}
        {steps.length > 0 ? (
          <ol className="mx-auto mt-20 max-w-3xl space-y-16">
            {steps.map((step, i) => (
              <li key={i} className="reveal grid gap-6 sm:grid-cols-12">
                <div className="sm:col-span-2">
                  <span className="font-display text-5xl text-sand" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="sr-only">Step {i + 1}:</span>
                </div>
                <div className="sm:col-span-10">
                  <h2 className="font-display text-2xl text-ink sm:text-3xl">{step.title}</h2>
                  <p className="mt-4 leading-relaxed text-charcoal/85">{step.description}</p>
                  {step.image ? (
                    <div className="mt-6">
                      <Photo photo={step.image} sizes="(min-width: 640px) 560px, 100vw" />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {page.closingText ? (
          <p className="font-display reveal mx-auto mt-20 max-w-2xl text-center text-2xl italic leading-snug text-umber">
            {page.closingText}
          </p>
        ) : null}
      </div>

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
