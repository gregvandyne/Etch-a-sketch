import { PinIcon } from "@/sanity/icons";
import { defineField, defineType } from "sanity";

/**
 * A wedding venue. Galleries reference venues, so each venue page can
 * automatically show every wedding photographed there.
 */
export const venueType = defineType({
  name: "venue",
  title: "Venue",
  type: "document",
  icon: PinIcon,
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "seo", title: "Search & sharing" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Venue name",
      description: "e.g. “Viansa Sonoma”",
      type: "string",
      group: "details",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      group: "details",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required().error("Click Generate to create the web address."),
    }),
    defineField({
      name: "location",
      title: "Location",
      description: "e.g. “Sonoma, California”",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "heroImage",
      title: "Main photograph",
      type: "photograph",
      group: "details",
    }),
    defineField({
      name: "description",
      title: "About this venue",
      description:
        "What it's like to photograph here — light, views, favorite corners. Written in your voice for couples considering the venue.",
      type: "blockContent",
      group: "details",
    }),
    defineField({
      name: "photographs",
      title: "Additional photographs",
      description: "Optional extra photographs of the venue itself.",
      type: "array",
      of: [{ type: "photograph" }],
      options: { layout: "grid" },
      group: "details",
    }),
    defineField({
      name: "website",
      title: "Venue website",
      type: "url",
      group: "details",
    }),
    defineField({
      name: "seo",
      title: "Search & sharing",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "location", media: "heroImage" },
  },
});
