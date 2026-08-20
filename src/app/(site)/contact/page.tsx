import { InquiryForm } from "@/components/InquiryForm";
import { Photo } from "@/components/Photo";
import { Heading, Label } from "@/components/ui";
import { getContactPage, getSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

// Preserves the existing /contact URL from the previous website.
export async function generateMetadata() {
  const page = await getContactPage();
  return buildMetadata({
    title: "Inquire",
    description:
      "Inquire about wedding, engagement or family photography with Courtney Stockton in Sonoma, Napa, Northern California and beyond.",
    path: "/contact",
    image: page.image,
    seo: page.seo,
  });
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getContactPage(), getSettings()]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Label className="mb-5">Inquire</Label>
          <Heading as="h1">{page.heading ?? "Let's tell your story"}</Heading>
          {page.introText ? (
            <p className="mt-6 leading-relaxed text-umber">{page.introText}</p>
          ) : null}
          {settings.email ? (
            <p className="mt-6 text-sm text-umber">
              Prefer email?{" "}
              <a
                href={`mailto:${settings.email}`}
                className="border-b border-taupe text-charcoal hover:border-charcoal"
              >
                {settings.email}
              </a>
            </p>
          ) : null}
          <div className="mt-10 hidden lg:block">
            {/* Native aspect ratio on purpose: this photograph may carry
                lettering, and a forced crop cuts it off. */}
            <Photo photo={page.image} sizes="(min-width: 1024px) 360px, 0px" />
          </div>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <InquiryForm successMessage={page.successMessage} />
        </div>
      </div>
    </div>
  );
}
