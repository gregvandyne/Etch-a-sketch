"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Polished recovery screen for unexpected errors. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-28 text-center sm:px-8">
      <p className="label mb-5">Something went wrong</p>
      <h1 className="font-display text-4xl text-ink sm:text-5xl">A brief hiccup</h1>
      <p className="mx-auto mt-6 max-w-md leading-relaxed text-umber">
        This page couldn&apos;t load just now. It&apos;s usually momentary. Try again,
        or head back to the portfolio.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <button
          type="button"
          onClick={reset}
          className="label bg-charcoal px-8 py-4 text-ivory transition-colors hover:bg-ink"
        >
          Try again
        </button>
        <Link href="/" className="label border-b border-taupe/60 pb-1 hover:border-charcoal">
          Back home →
        </Link>
      </div>
    </div>
  );
}
