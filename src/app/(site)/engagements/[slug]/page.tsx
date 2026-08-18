import {
  GalleryPage,
  galleryMetadata,
  galleryStaticParams,
} from "@/components/portfolio-pages";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return galleryStaticParams("engagement");
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return galleryMetadata("engagement", slug);
}

export default async function EngagementGalleryPage({ params }: Props) {
  const { slug } = await params;
  return <GalleryPage category="engagement" slug={slug} />;
}
