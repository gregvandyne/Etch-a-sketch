import type { Metadata, Viewport } from "next";
import { NextStudio } from "next-sanity/studio";

import config from "../../../../sanity.config";

/**
 * Courtney's website dashboard — Sanity Studio, served at /studio.
 * Access is protected by Sanity authentication (only members of the
 * Sanity project can log in).
 */

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Website Dashboard | Courtney Stockton Photography",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function StudioPage() {
  return <NextStudio config={config} />;
}
