import { EditIcon } from "@/sanity/icons";
import { defineField, defineType } from "sanity";

/**
 * A blog post. Posts live at the site root (e.g. /a-viansa-sonoma-wedding)
 * to match the original website's addresses and preserve search rankings.
 */
export const postType = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  icon: EditIcon,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "connections", title: "Connections" },
    { name: "seo", title: "Search & sharing" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      description:
        "The post's address, e.g. “emily-james-viansa-sonoma-wedding”. For older posts moved from the previous website, keep the original address so links keep working.",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 120 },
      validation: (rule) => rule.required().error("Click Generate to create the web address."),
    }),
    defineField({
      name: "publishedAt",
      title: "Publish date",
      type: "datetime",
      group: "content",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featuredImage",
      title: "Featured photograph",
      description: "Shown at the top of the post and in the blog overview.",
      type: "photograph",
      group: "content",
      validation: (rule) => rule.required().error("Choose a featured photograph."),
    }),
    defineField({
      name: "excerpt",
      title: "Short summary",
      description:
        "One or two sentences shown in the blog overview and used as the search description if no SEO description is set.",
      type: "text",
      rows: 3,
      group: "content",
    }),
    defineField({
      name: "body",
      title: "Story",
      type: "blockContent",
      group: "content",
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "postCategory" }] }],
      group: "connections",
    }),
    defineField({
      name: "relatedGallery",
      title: "Related portfolio gallery",
      description:
        "If this post is about a wedding or session already in your portfolio, link it here and the post will show a “View the full gallery” invitation automatically.",
      type: "reference",
      to: [{ type: "gallery" }],
      group: "connections",
    }),
    defineField({
      name: "relatedVenue",
      title: "Related venue",
      description: "Linking a venue lists this post on the venue's page automatically.",
      type: "reference",
      to: [{ type: "venue" }],
      group: "connections",
    }),
    defineField({
      name: "seo",
      title: "Search & sharing",
      type: "seo",
      group: "seo",
    }),
  ],
  orderings: [
    {
      title: "Publish date, newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", date: "publishedAt", media: "featuredImage" },
    prepare({ title, date, media }) {
      return {
        title: title ?? "Untitled post",
        subtitle: date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "No date",
        media,
      };
    },
  },
});

export const postCategoryType = defineType({
  name: "postCategory",
  title: "Blog category",
  type: "document",
  icon: EditIcon,
  fields: [
    defineField({
      name: "title",
      title: "Category name",
      description: "e.g. “Weddings”, “Little Ones”, “Personal”",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      description:
        "Keep the same address as the previous website where one exists, e.g. “little-ones-kids-family-and-maternity”.",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      rows: 2,
    }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
