import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/PostCard";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getPostCategories, getPosts } from "@/lib/content";

export const POSTS_PER_PAGE = 12;

/**
 * The journal index, paginated WordPress-style: /blog, /blog/page/2, …
 * so the archive stays fast and skimmable at any post count.
 */
export async function JournalIndex({ page }: { page: number }) {
  const [posts, categories] = await Promise.all([getPosts(), getPostCategories()]);

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  if (page > totalPages) notFound();
  const visible = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Label className="mb-5">The journal</Label>
          <Heading as="h1">{page === 1 ? "Recent stories" : `Stories, page ${page}`}</Heading>
          <p className="mt-6 leading-relaxed text-umber">
            Real weddings, sessions and life in wine country, for all things love in
            Napa, Sonoma and beyond.
          </p>
        </div>

        {categories.length > 0 ? (
          <nav aria-label="Journal categories" className="mb-14">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="label border-b border-transparent pb-1 hover:border-taupe hover:text-charcoal"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((post, i) => (
              <div key={post._id} className="reveal">
                <PostCard post={post} priority={i < 3} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center italic text-taupe">
            Journal entries are being added. Check back soon.
          </p>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Journal pages"
            className="mt-16 flex items-center justify-center gap-8 border-t border-linen pt-10"
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? "/blog" : `/blog/page/${page - 1}`}
                className="label border-b border-taupe/60 pb-1 hover:border-charcoal"
              >
                ← Newer stories
              </Link>
            ) : null}
            <span className="label text-taupe">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/blog/page/${page + 1}`}
                className="label border-b border-taupe/60 pb-1 hover:border-charcoal"
              >
                Older stories →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
      <InquireBand location="blog" />
    </>
  );
}
