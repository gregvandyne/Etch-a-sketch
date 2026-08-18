"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";

const leftNav = [
  { href: "/weddings", label: "Weddings" },
  { href: "/engagements", label: "Engagements" },
  { href: "/families", label: "Families" },
];

const rightNav = [
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/information", label: "Investment" },
  { href: "/blog", label: "Journal" },
];

const mobileNav = [
  { href: "/", label: "Home" },
  ...leftNav,
  ...rightNav,
  { href: "/venues", label: "Venues" },
  { href: "/contact", label: "Inquire" },
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
      className={`label transition-colors duration-200 hover:text-charcoal ${
        current ? "text-charcoal" : ""
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-20">
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
              className={`absolute left-0 top-0 h-px w-full bg-charcoal transition-transform duration-300 ${open ? "top-1/2 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 bottom-0 h-px w-full bg-charcoal transition-transform duration-300 ${open ? "bottom-1/2 -rotate-45" : ""}`}
            />
          </span>
        </button>

        {/* Desktop: left nav */}
        <nav aria-label="Portfolio" className="hidden flex-1 items-center gap-7 lg:flex">
          {leftNav.map((item) => (
            <NavLink key={item.href} {...item} current={isCurrent(item.href)} />
          ))}
        </nav>

        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-center text-lg tracking-[0.14em] text-ink sm:text-xl"
        >
          <span className="block leading-none">COURTNEY STOCKTON</span>
          <span className="label mt-1 block text-[0.55rem] tracking-[0.42em] text-taupe">
            PHOTOGRAPHY
          </span>
        </Link>

        {/* Desktop: right nav */}
        <nav
          aria-label="Main"
          className="hidden flex-1 items-center justify-end gap-7 lg:flex"
        >
          {rightNav.map((item) => (
            <NavLink key={item.href} {...item} current={isCurrent(item.href)} />
          ))}
          <Link
            href="/contact"
            onClick={() => track("Inquiry CTA Clicked", { location: "header" })}
            className="label border border-charcoal px-5 py-2.5 text-charcoal transition-colors duration-200 hover:bg-charcoal hover:text-ivory"
          >
            Inquire
          </Link>
        </nav>

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
        className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-ivory transition-opacity duration-300 lg:hidden ${
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
              className={`font-display border-b border-linen py-4 text-3xl text-charcoal transition-opacity ${
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
