import Link from "next/link";

/** Root-level 404 for paths outside the main site segment. */
export default function RootNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="label mb-5">Page not found</p>
      <h1 className="font-display text-4xl text-ink sm:text-5xl">
        This page has wandered off
      </h1>
      <p className="mt-5 max-w-md leading-relaxed text-umber">
        The address may have changed as the website grew.
      </p>
      <Link
        href="/"
        className="label mt-9 inline-block bg-charcoal px-8 py-4 text-ivory transition-colors hover:bg-ink"
      >
        Back home
      </Link>
    </div>
  );
}
