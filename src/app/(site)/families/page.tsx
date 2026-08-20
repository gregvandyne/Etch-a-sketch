import { CategoryPage, categoryMetadata } from "@/components/portfolio-pages";

export const metadata = categoryMetadata("family");

export default function FamiliesPage() {
  return <CategoryPage category="family" />;
}
