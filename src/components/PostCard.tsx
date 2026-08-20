import Link from "next/link";

import type { PostTeaser } from "@/lib/types";
import { Photo } from "./Photo";

export function formatDate(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** A journal entry teaser. Posts live at the site root — /<slug>. */
export function PostCard({ post, priority = false }: { post: PostTeaser; priority?: boolean }) {
  const date = formatDate(post.publishedAt);
  return (
    <article>
      <Link href={`/${post.slug}`} className="group block">
        <div className="overflow-hidden bg-linen">
          <Photo
            photo={post.featuredImage}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            aspect="4/3"
            priority={priority}
            className="transition-transform duration-[var(--dur-mid)] ease-out group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-5">
          {(date || (post.categories && post.categories.length > 0)) && (
            <p className="label mb-2 text-taupe">
              {[date, post.categories?.[0]?.title].filter(Boolean).join("  ·  ")}
            </p>
          )}
          <h2 className="font-display text-2xl leading-snug text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-umber">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
