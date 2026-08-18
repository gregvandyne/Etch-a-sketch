import Link from "next/link";

import { Photo } from "@/components/Photo";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getGalleries } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { CATEGORY_META, type CategoryKey } from "@/lib/site";

// Preserves the existing /galleries URL from the previous website.
export const metadata = buildMetadata({
  title: "Galleries",
  description:
    "Portfolio galleries of weddings, engagements and families photographed by Courtney Stockton in Sonoma, Napa and Northern California wine country.",
  path: "/galleries",
});

export default async function GalleriesPage() {
  const categories = Object.keys(CATEGORY_META) as CategoryKey[];
  const covers = await Promise.all(
    categories.map(async (c) => (await getGalleries(c))[0]?.coverImage)
  );

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center lg:mb-20">
          <Label className="mb-5">The portfolio</Label>
          <Heading as="h1">Galleries</Heading>
          <p className="mt-6 leading-relaxed text-umber">
            Weddings, engagements and families — photographed honestly, in beautiful light,
            throughout Sonoma, Napa and beyond.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
          {categories.map((key, i) => {
            const meta = CATEGORY_META[key];
            return (
              <Link key={key} href={meta.path} className="group reveal block">
                <div className="overflow-hidden bg-linen">
                  <Photo
                    photo={covers[i]}
                    sizes="(min-width: 1024px) 400px, 100vw"
                    aspect="3/4"
                    priority={i === 0}
                    className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-5 text-center">
                  <h2 className="font-display text-3xl text-ink group-hover:text-wine">
                    {meta.plural}
                  </h2>
                  <p className="label mt-2 text-taupe">View the gallery →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <InquireBand location="galleries" />
    </>
  );
}
