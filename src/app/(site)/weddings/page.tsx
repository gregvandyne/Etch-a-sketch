import { CategoryPage, categoryMetadata } from "@/components/portfolio-pages";

export const metadata = categoryMetadata("wedding");

export default function WeddingsPage() {
  return <CategoryPage category="wedding" />;
}
