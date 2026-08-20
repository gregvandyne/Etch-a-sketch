import { ContentViewTracker } from "@/components/ContentViewTracker";
import { Photo } from "@/components/Photo";
import { Prose } from "@/components/Prose";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getCategoryPhotographs, getInvestmentPage } from "@/lib/content";
import { createPhotoPicker, hasImage } from "@/lib/photo-fallback";
import { buildMetadata } from "@/lib/seo";
import type { GalleryCategory } from "@/lib/types";

// Preserves the existing /information URL from the previous website.
export async function generateMetadata() {
  const page = await getInvestmentPage();
  return buildMetadata({
    title: "Information & Investment",
    description:
      "Wedding, elopement, engagement and family photography with Courtney Stockton: what's offered, how booking works, and how to begin.",
    path: "/information",
    image: page.heroImage,
    seo: page.seo,
  });
}

export default async function InformationPage() {
  const [page, weddingPhotos, engagementPhotos, familyPhotos] = await Promise.all([
    getInvestmentPage(),
    getCategoryPhotographs("wedding"),
    getCategoryPhotographs("engagement"),
    getCategoryPhotographs("family"),
  ]);

  // Offerings without a CMS image borrow a portfolio photograph that matches
  // what the offering is about, never repeating one on the page. An image
  // set in the Studio always wins.
  const pick = createPhotoPicker(
    { wedding: weddingPhotos, engagement: engagementPhotos, family: familyPhotos },
    [page.heroImage, ...(page.offerings ?? []).map((o) => o.image)]
  );
  const fallbackFor = (title = "") => {
    const t = title.toLowerCase();
    const category: GalleryCategory = /family|little|kid|maternity|senior/.test(t)
      ? "family"
      : /engage|proposal|couple/.test(t)
        ? "engagement"
        : "wedding";
    return pick(category);
  };
  const offerings = (page.offerings ?? []).map((o) => ({
    ...o,
    image: hasImage(o.image) ? o.image : fallbackFor(o.title),
  }));

  return (
    <>
      <ContentViewTracker event="Investment Page Viewed" path="/information" />
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Label className="mb-5">Information</Label>
          <Heading as="h1">{page.heading ?? "Investment"}</Heading>
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

        {/* Offerings — photograph beside every entry, alternating sides */}
        {offerings.length > 0 ? (
          <div className="mx-auto mt-20 max-w-5xl space-y-20">
            {offerings.map((offering, i) => (
              <section key={i} className="reveal grid items-center gap-8 lg:grid-cols-12">
                {hasImage(offering.image) ? (
                  <div
                    className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-2 lg:col-start-8" : ""}`}
                  >
                    <Photo
                      photo={offering.image}
                      sizes="(min-width: 1024px) 430px, 100vw"
                      aspect="4/5"
                    />
                  </div>
                ) : null}
                <div
                  className={
                    hasImage(offering.image)
                      ? `lg:col-span-6 ${i % 2 === 1 ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"}`
                      : "lg:col-span-8 lg:col-start-3"
                  }
                >
                  <h2 className="font-display text-3xl text-ink sm:text-4xl">
                    {offering.title}
                  </h2>
                  <p className="mt-5 leading-relaxed text-charcoal/85">
                    {offering.description}
                  </p>
                  {offering.startingPrice ? (
                    <p className="label mt-6 text-umber">{offering.startingPrice}</p>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {/* Details */}
        {page.detailsText ? (
          <div className="mx-auto mt-20 max-w-2xl border-t border-linen pt-14">
            <Label className="mb-6 text-center">The details</Label>
            <Prose value={page.detailsText} />
          </div>
        ) : null}
      </div>
      <InquireBand
        location="investment"
        heading="Begin the conversation"
        text="Every wedding and session is quoted personally. Share your plans and Courtney will send everything you need: availability, collections and next steps."
      />
    </>
  );
}
