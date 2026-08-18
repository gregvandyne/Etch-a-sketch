import { notFound, permanentRedirect } from "next/navigation";

import { JournalIndex, POSTS_PER_PAGE } from "@/components/JournalIndex";
import { getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ n: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    n: String(i + 2),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { n } = await params;
  return buildMetadata({
    title: `Blog | Page ${n}`,
    description: `Older stories from the journal of Courtney Stockton Photography, page ${n}.`,
    path: `/blog/page/${n}`,
  });
}

export default async function BlogArchivePage({ params }: Props) {
  const { n } = await params;
  const page = Number(n);
  if (!Number.isInteger(page) || page < 1) notFound();
  if (page === 1) permanentRedirect("/blog");
  return <JournalIndex page={page} />;
}
