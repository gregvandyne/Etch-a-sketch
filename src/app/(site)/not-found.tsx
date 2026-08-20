import Link from "next/link";

import { Button, Heading, Label } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-28 text-center sm:px-8">
      <Label className="mb-5">Page not found</Label>
      <Heading as="h1">This page has wandered off</Heading>
      <p className="mx-auto mt-6 max-w-md leading-relaxed text-umber">
        The address may have changed as the website grew. The portfolio, journal and
        everything else are still right here.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <Button href="/">Back home</Button>
        <Link href="/galleries" className="label border-b border-taupe/60 pb-1 hover:border-charcoal">
          View the portfolio →
        </Link>
      </div>
    </div>
  );
}
