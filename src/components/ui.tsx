import Link from "next/link";
import type { ReactNode } from "react";

import { TrackedLink } from "./TrackedLink";

/** Small uppercase section label, e.g. "THE PORTFOLIO". */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`label ${className}`}>{children}</p>;
}

/** Section heading in the site's airy spaced-caps voice. */
export function Heading({
  as: Tag = "h2",
  children,
  className = "",
}: {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
}) {
  const size =
    Tag === "h1"
      ? "text-2xl sm:text-3xl lg:text-[2.6rem]"
      : Tag === "h2"
        ? "text-xl sm:text-2xl lg:text-3xl"
        : "text-lg sm:text-xl";
  return <Tag className={`font-heading text-ink ${size} ${className}`}>{children}</Tag>;
}

/** Understated text link with a hairline underline. */
export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`label inline-flex items-center gap-2 border-b border-taupe/60 pb-1 text-charcoal transition-colors hover:border-charcoal ${className}`}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/** Primary call-to-action button. */
export function Button({
  href,
  children,
  variant = "solid",
  className = "",
  trackInquiry,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline" | "light";
  className?: string;
  /** Where this CTA sits — recorded as an Inquiry CTA click when set. */
  trackInquiry?: string;
}) {
  const styles =
    variant === "solid"
      ? "bg-charcoal text-ivory hover:bg-ink"
      : variant === "light"
        ? "border border-ivory text-ivory hover:bg-ivory hover:text-charcoal"
        : "border border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory";
  const cls = `label inline-block px-8 py-4 transition-colors ${styles} ${className}`;

  if (trackInquiry) {
    return (
      <TrackedLink
        href={href}
        event="Inquiry CTA Clicked"
        eventProps={{ location: trackInquiry }}
        className={cls}
      >
        {children}
      </TrackedLink>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** The closing conversion band used across content pages. */
export function InquireBand({
  heading = "Let's tell your story",
  text = "Inquiries are always welcome. Share your date and your plans, and Courtney will reply personally.",
  location,
}: {
  heading?: string;
  text?: string;
  location: string;
}) {
  return (
    <section className="border-t border-linen bg-ivory">
      <div className="reveal mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 lg:py-32">
        <Label className="mb-5">Begin here</Label>
        <h2 className="font-display text-3xl text-ink sm:text-4xl lg:text-5xl">{heading}</h2>
        <p className="mx-auto mt-5 max-w-xl text-umber">{text}</p>
        <div className="mt-9">
          <Button href="/contact" trackInquiry={location}>
            Inquire
          </Button>
        </div>
      </div>
    </section>
  );
}
