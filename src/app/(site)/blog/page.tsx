import { JournalIndex } from "@/components/JournalIndex";
import { buildMetadata } from "@/lib/seo";

// Preserves the existing /blog URL from the previous website.
export const metadata = buildMetadata({
  title: "Blog",
  description:
    "The journal of Courtney Stockton Photography: real weddings, engagement sessions, family stories and life in Sonoma and Napa wine country.",
  path: "/blog",
});

export default function BlogPage() {
  return <JournalIndex page={1} />;
}
