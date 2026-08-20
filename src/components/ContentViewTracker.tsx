"use client";

import { useEffect } from "react";

import { rememberContentView, track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Records a content view event and remembers this page for inquiry
 * attribution. Rendered (invisibly) by portfolio, journal, venue and
 * investment pages.
 */
export function ContentViewTracker({
  event,
  path,
  props,
}: {
  event: AnalyticsEvent;
  path: string;
  props?: Record<string, string | number | boolean | undefined>;
}) {
  useEffect(() => {
    rememberContentView(path);
    track(event, props);
    // Track once per mount for this path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return null;
}
