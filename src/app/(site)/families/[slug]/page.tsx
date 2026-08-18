import {
  GalleryPage,
  galleryMetadata,
  galleryStaticParams,
} from "@/components/portfolio-pages";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return galleryStaticParams("family");
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return galleryMetadata("family", slug);
}

export default async function FamilyGalleryPage({ params }: Props) {
  const { slug } = await params;
  return <GalleryPage category="family" slug={slug} />;
}
