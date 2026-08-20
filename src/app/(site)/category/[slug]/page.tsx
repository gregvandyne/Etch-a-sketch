import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/PostCard";
import { Heading, Label } from "@/components/ui";
import { getPostCategories, getPostCategory, getPostsByCategory } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

/**
 * Category archives — preserved at the same /category/<slug> addresses the
 * previous WordPress site used (e.g. /category/weddings-2/).
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getPostCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await getPostCategory(slug);
  if (!category) return {};
  return buildMetadata({
    title: `${category.title} | Journal`,
    description:
      category.description ??
      `${category.title}: stories from the journal of Courtney Stockton Photography.`,
    path: `/category/${slug}`,
  });
}

export default async function CategoryArchivePage({ params }: Props) {
  const { slug } = await params;
  const [category, posts] = await Promise.all([
    getPostCategory(slug),
    getPostsByCategory(slug),
  ]);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <Label className="mb-5">
          <Link href="/blog" className="hover:text-charcoal">
            The journal
          </Link>
        </Label>
        <Heading as="h1">{category.title}</Heading>
        {category.description ? (
          <p className="mt-5 leading-relaxed text-umber">{category.description}</p>
        ) : null}
      </div>

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
          No stories in this category yet. <Link href="/blog" className="underline">Browse the full journal</Link>.
        </p>
      )}
    </div>
  );
}
