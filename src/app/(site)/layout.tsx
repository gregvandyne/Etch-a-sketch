import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/Reveal";
import { getSettings } from "@/lib/content";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/** Public site layout: header, footer and sitewide structured data. */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  // LocalBusiness + Person structured data from verified business facts only.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#business`,
        name: settings.businessName ?? SITE_NAME,
        url: SITE_URL,
        description: settings.defaultSeoDescription,
        email: settings.email,
        areaServed: settings.serviceAreas?.filter((a) => !a.toLowerCase().includes("worldwide")),
        founder: { "@id": `${SITE_URL}/#courtney` },
        sameAs: [settings.instagram, settings.facebook, settings.pinterest].filter(Boolean),
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#courtney`,
        name: "Courtney Stockton",
        jobTitle: "Wedding & Portrait Photographer",
        url: absoluteUrl("/about"),
        worksFor: { "@id": `${SITE_URL}/#business` },
      },
    ],
  };

  return (
    <>
      <a
        href="#main"
        className="label sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:bg-charcoal focus:px-4 focus:py-3 focus:text-ivory"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <RevealProvider />
      {(await draftMode()).isEnabled ? (
        <>
          {/* Plain anchor on purpose: the route must run server-side to clear the draft cookie. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/draft-mode/disable"
            className="label fixed bottom-4 right-4 z-[90] bg-wine px-4 py-3 text-ivory shadow-lg"
          >
            Previewing drafts · Exit
          </a>
          <VisualEditing />
        </>
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
