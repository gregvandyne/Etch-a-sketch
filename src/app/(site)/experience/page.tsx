import { Photo } from "@/components/Photo";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getExperiencePage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getExperiencePage();
  return buildMetadata({
    title: "The Experience",
    description:
      "What working with Courtney Stockton feels like — calm guidance, thoughtful preparation, and photography that lets your day unfold naturally.",
    path: "/experience",
    image: page.heroImage,
    seo: page.seo,
  });
}

export default async function ExperiencePage() {
  const page = await getExperiencePage();

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

        {page.heroImage ? (
          <div className="mx-auto mt-14 max-w-5xl">
            <Photo
              photo={page.heroImage}
              sizes="(min-width: 1024px) 1024px, 100vw"
              aspect="16/9"
              priority
            />
          </div>
        ) : null}

        {/* Steps */}
        {page.steps && page.steps.length > 0 ? (
          <ol className="mx-auto mt-20 max-w-3xl space-y-16">
            {page.steps.map((step, i) => (
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
      <InquireBand
        location="experience"
        heading="Ready when you are"
        text="Share your date and your plans — Courtney will reply personally with everything you need to know."
      />
    </>
  );
}
