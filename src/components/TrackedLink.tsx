"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { track, type AnalyticsEvent } from "@/lib/analytics";

interface TrackedLinkProps {
  href: string;
  event: AnalyticsEvent;
  eventProps?: Record<string, string | number | boolean | undefined>;
  className?: string;
  external?: boolean;
  children: ReactNode;
}

/** A link that records a conversion event on click. */
export function TrackedLink({
  href,
  event,
  eventProps,
  className,
  external = false,
  children,
}: TrackedLinkProps) {
  const onClick = () => track(event, eventProps);
  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
