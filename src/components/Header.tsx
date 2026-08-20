"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";

// Same top-level items, same order, as the original site's menu.
const mainNav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/galleries", label: "Galleries" },
  { href: "/information", label: "Info" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/venues", label: "Venues" },
  { href: "/experience", label: "Experience" },
];

const mobileNav = [
  ...mainNav.slice(0, 3),
  { href: "/weddings", label: "Weddings" },
  { href: "/engagements", label: "Engagements" },
  { href: "/families", label: "Families" },
  ...mainNav.slice(3),
];

function NavLink({
  href,
  label,
  current,
  onClick,
  className = "",
}: {
  href: string;
  label: string;
  current: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={current ? "page" : undefined}
      className={`label relative transition-colors hover:text-charcoal after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:bg-charcoal after:transition-transform after:duration-[var(--dur-micro)] hover:after:scale-x-100 ${
        current ? "text-charcoal after:scale-x-100" : "after:scale-x-0"
      } ${className}`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Lock page scroll while the mobile menu is open, and let Escape close
  // it with focus returned to the toggle. (Menu links close it on click,
  // so no navigation effect is needed.)
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    /* No backdrop-filter on the header — it would create a containing block
       and trap the fixed-position mobile menu inside it. */
    <header className="sticky top-0 z-50 border-b border-linen bg-ivory/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-24">
        {/* Wordmark — stacked, bold-tracked caps like the original site */}
        <Link href="/" className="font-heading text-sm font-semibold leading-snug text-ink">
          <span className="block">Courtney</span>
          <span className="block">Stockton</span>
        </Link>

        {/* Desktop: single nav row, same items and order as the original menu */}
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {mainNav.map((item) => (
            <NavLink key={item.href} {...item} current={isCurrent(item.href)} />
          ))}
        </nav>

        {/* Mobile: menu button */}
        <button
          type="button"
          ref={toggleRef}
          className="label -ml-1 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="relative block h-3 w-5">
            <span
              className={`absolute left-0 top-0 h-px w-full bg-charcoal transition-transform ${open ? "top-1/2 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 bottom-0 h-px w-full bg-charcoal transition-transform ${open ? "bottom-1/2 -rotate-45" : ""}`}
            />
          </span>
        </button>

        {/* Mobile: inquire shortcut keeps the primary conversion visible */}
        <Link
          href="/contact"
          onClick={() => track("Inquiry CTA Clicked", { location: "header-mobile" })}
          className="label -mr-1 flex h-11 items-center px-1 lg:hidden"
        >
          Inquire
        </Link>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-ivory transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="flex flex-col px-8 py-10">
          {mobileNav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setOpen(false);
                if (item.href === "/contact")
                  track("Inquiry CTA Clicked", { location: "mobile-menu" });
              }}
              aria-current={isCurrent(item.href) && item.href !== "/" ? "page" : undefined}
              className={`font-heading border-b border-linen py-4 text-lg text-charcoal transition-opacity ${
                open ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: open ? `${i * 35}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
