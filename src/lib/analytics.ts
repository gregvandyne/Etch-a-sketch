/**
 * Privacy-conscious conversion analytics.
 *
 * Events are sent to Plausible (cookieless, GDPR/CCPA-friendly) when
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN is configured; otherwise they no-op.
 * No personal data is ever attached to an event.
 *
 * Content attribution: the last portfolio/journal/venue page a visitor
 * viewed is remembered in sessionStorage (first-party, per-tab, no cookie)
 * and attached to inquiry events — so Courtney can see which content
 * actually leads to inquiries.
 */

export type AnalyticsEvent =
  | "Inquiry CTA Clicked"
  | "Inquiry Form Started"
  | "Inquiry Form Submitted"
  | "Portfolio Viewed"
  | "Gallery Viewed"
  | "Investment Page Viewed"
  | "Email Link Clicked"
  | "Social Link Clicked";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

const ATTRIBUTION_KEY = "csp-last-content";

export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, { props });
  } catch {
    // Analytics must never break the site.
  }
}

/** Remember the content page currently being viewed (called from content pages). */
export function rememberContentView(path: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, path);
  } catch {
    // Storage may be unavailable (private mode) — attribution is best-effort.
  }
}

/** The content page most recently viewed in this tab, if any. */
export function lastContentViewed(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return sessionStorage.getItem(ATTRIBUTION_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
