import Link from "next/link";

import { PostCard } from "@/components/PostCard";
import { Heading, InquireBand, Label } from "@/components/ui";
import { getPostCategories, getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

// Preserves the existing /blog URL from the previous website.
export const metadata = buildMetadata({
  title: "Blog",
  description:
    "The journal of Courtney Stockton Photography — real weddings, engagement sessions, family stories and life in Sonoma and Napa wine country.",
  path: "/blog",
});

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPosts(), getPostCategories()]);

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Label className="mb-5">The journal</Label>
          <Heading as="h1">Recent stories</Heading>
          <p className="mt-6 leading-relaxed text-umber">
            Real weddings, sessions and life in wine country — for all things love in
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

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <div key={post._id} className="reveal">
                <PostCard post={post} priority={i < 3} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center italic text-taupe">
            Journal entries are being added — check back soon.
          </p>
        )}
      </div>
      <InquireBand location="blog" />
    </>
  );
}
