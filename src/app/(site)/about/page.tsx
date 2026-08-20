import { Photo } from "@/components/Photo";
import { Prose } from "@/components/Prose";
import { Button, Heading, Label, TextLink } from "@/components/ui";
import { getAboutPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const about = await getAboutPage();
  return buildMetadata({
    title: "About Courtney",
    description:
      "Meet Courtney Stockton: wedding and portrait photographer, wife to a Sonoma winemaker, photographing love in Sonoma, Napa and wine country since 2012.",
    path: "/about",
    image: about.portrait,
    seo: about.seo,
  });
}

export default async function AboutPage() {
  const about = await getAboutPage();

  return (
    <>
      <article className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Portrait column */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Photo
                photo={about.portrait}
                sizes="(min-width: 1024px) 480px, 100vw"
                aspect="3/4"
                priority
              />
              {about.photographs?.[0] ? (
                <div className="mt-6 hidden lg:block">
                  <Photo
                    photo={about.photographs[0]}
                    sizes="(min-width: 1024px) 480px, 0px"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Story column */}
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-10">
            <Label className="mb-5">About</Label>
            <Heading as="h1">{about.heading ?? "Meet Courtney"}</Heading>
            {about.subheading ? (
              <p className="font-display mt-4 text-xl italic text-umber">{about.subheading}</p>
            ) : null}
            <div className="mt-8">
              <Prose value={about.story} />
            </div>
            {about.photographs?.[1] ? (
              <div className="reveal mt-10">
                <Photo
                  photo={about.photographs[1]}
                  sizes="(min-width: 1024px) 560px, 100vw"
                />
              </div>
            ) : null}
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Button href="/galleries">View the Portfolio</Button>
              <TextLink href="/contact">Start your inquiry</TextLink>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
