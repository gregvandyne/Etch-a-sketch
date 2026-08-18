import Link from "next/link";

import { getSettings, usingSampleContent } from "@/lib/content";
import { TrackedLink } from "./TrackedLink";

const footerNav = [
  { href: "/weddings", label: "Weddings" },
  { href: "/engagements", label: "Engagements" },
  { href: "/families", label: "Families" },
  { href: "/venues", label: "Venues" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/information", label: "Investment" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Inquire" },
];

export async function Footer() {
  const settings = await getSettings();
  const year = new Date().getFullYear();
  const socials = [
    { href: settings.instagram, label: "Instagram" },
    { href: settings.facebook, label: "Facebook" },
    { href: settings.pinterest, label: "Pinterest" },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href));

  return (
    <footer className="border-t border-linen bg-parchment">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="flex flex-col items-center gap-10 text-center">
          <p className="font-display text-2xl tracking-[0.14em] text-ink">
            COURTNEY STOCKTON
            <span className="label mt-1 block text-[0.55rem] tracking-[0.42em] text-taupe">
              PHOTOGRAPHY
            </span>
          </p>

          {settings.tagline ? (
            <p className="max-w-xl text-sm text-umber">{settings.tagline}</p>
          ) : null}

          <nav aria-label="Footer">
            <ul className="flex flex-wrap justify-center gap-x-7 gap-y-3">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="label hover:text-charcoal">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {(settings.email || socials.length > 0) && (
            <div className="flex flex-col items-center gap-4">
              {settings.email ? (
                <TrackedLink
                  href={`mailto:${settings.email}`}
                  event="Email Link Clicked"
                  className="font-display text-lg italic text-charcoal hover:text-wine"
                >
                  {settings.email}
                </TrackedLink>
              ) : null}
              {socials.length > 0 && (
                <ul className="flex gap-6">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <TrackedLink
                        href={s.href}
                        event="Social Link Clicked"
                        eventProps={{ network: s.label }}
                        className="label hover:text-charcoal"
                        external
                      >
                        {s.label}
                      </TrackedLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {settings.serviceAreas && settings.serviceAreas.length > 0 ? (
            <p className="label text-taupe">{settings.serviceAreas.join("  ·  ")}</p>
          ) : null}

          <p className="text-xs text-taupe">
            © {year} {settings.businessName ?? "Courtney Stockton Photography"}. All
            photographs are the property of the photographer.
          </p>

          {usingSampleContent ? (
            <p className="text-xs italic text-taupe">
              Preview build — sample content and labeled placeholder images are shown
              until the content studio is connected.
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
