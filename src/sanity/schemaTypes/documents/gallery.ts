import { ImagesIcon } from "@/sanity/icons";
import { defineField, defineType } from "sanity";

export const GALLERY_CATEGORIES = [
  { title: "Wedding", value: "wedding" },
  { title: "Engagement", value: "engagement" },
  { title: "Family", value: "family" },
] as const;

/**
 * A portfolio story — one wedding, engagement session or family session.
 * Publishing a gallery automatically places it in the right portfolio
 * section and on its venue's page.
 */
export const galleryType = defineType({
  name: "gallery",
  title: "Portfolio gallery",
  type: "document",
  icon: ImagesIcon,
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "photographs", title: "Photographs" },
    { name: "story", title: "Story" },
    { name: "seo", title: "Search & sharing" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      description: "e.g. “Emily & James — Viansa Sonoma Wedding”",
      type: "string",
      group: "details",
      validation: (rule) => rule.required().error("Every gallery needs a title."),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      description:
        "The last part of the page's address, e.g. “emily-james-viansa-sonoma-wedding”. Click Generate to create it from the title.",
      type: "slug",
      group: "details",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Click Generate to create the web address."),
    }),
    defineField({
      name: "category",
      title: "Portfolio section",
      type: "string",
      group: "details",
      options: {
        list: [...GALLERY_CATEGORIES],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "wedding",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      description: "e.g. “Sonoma, California”",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "venue",
      title: "Venue",
      description:
        "Link this gallery to its venue and it will automatically appear on the venue's page.",
      type: "reference",
      to: [{ type: "venue" }],
      group: "details",
    }),
    defineField({
      name: "date",
      title: "Session / wedding date",
      description: "Used for ordering. Only the season and year are ever shown publicly.",
      type: "date",
      group: "details",
    }),
    defineField({
      name: "featured",
      title: "Feature on the homepage",
      description: "Featured galleries can appear in the homepage portfolio section.",
      type: "boolean",
      group: "details",
      initialValue: false,
    }),
    defineField({
      name: "coverImage",
      title: "Cover photograph",
      description:
        "The photograph that represents this gallery in portfolio grids and when the page is shared. Drag the circle to set the focal point.",
      type: "photograph",
      group: "photographs",
      validation: (rule) => rule.required().error("Choose a cover photograph."),
    }),
    defineField({
      name: "photographs",
      title: "Photographs",
      description:
        "Drag and drop to upload in bulk, then drag to reorder — the order here is exactly the order on the website.",
      type: "array",
      group: "photographs",
      of: [{ type: "photograph" }],
      options: { layout: "grid" },
      validation: (rule) => rule.min(1).warning("A gallery without photographs won't show a gallery."),
    }),
    defineField({
      name: "introduction",
      title: "Introduction",
      description:
        "A short opening paragraph shown above the photographs. One to three sentences is plenty.",
      type: "text",
      rows: 4,
      group: "story",
    }),
    defineField({
      name: "story",
      title: "The story (optional)",
      description: "A longer telling of the day, shown after the introduction.",
      type: "blockContent",
      group: "story",
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
      title: "Date, newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      location: "location",
      media: "coverImage",
    },
    prepare({ title, category, location, media }) {
      const cat = GALLERY_CATEGORIES.find((c) => c.value === category)?.title ?? "";
      return {
        title: title ?? "Untitled gallery",
        subtitle: [cat, location].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
