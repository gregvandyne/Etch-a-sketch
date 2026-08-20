import {
  GalleryPage,
  galleryMetadata,
  galleryStaticParams,
} from "@/components/portfolio-pages";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return galleryStaticParams("wedding");
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return galleryMetadata("wedding", slug);
}

export default async function WeddingGalleryPage({ params }: Props) {
  const { slug } = await params;
  return <GalleryPage category="wedding" slug={slug} />;
}
