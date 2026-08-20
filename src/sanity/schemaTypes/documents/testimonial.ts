import { HeartIcon } from "@/sanity/icons";
import { defineField, defineType } from "sanity";

export const testimonialType = defineType({
  name: "testimonial",
  title: "Kind words",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({
      name: "clientNames",
      title: "Client name(s)",
      description: "e.g. “Emily & James”",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "quote",
      title: "Their words",
      description: "The testimonial, exactly as the client wrote it.",
      type: "text",
      rows: 6,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "serviceType",
      title: "Type of session",
      type: "string",
      options: {
        list: [
          { title: "Wedding", value: "wedding" },
          { title: "Engagement", value: "engagement" },
          { title: "Family", value: "family" },
          { title: "Other", value: "other" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "wedding",
    }),
    defineField({
      name: "relatedGallery",
      title: "Related gallery (optional)",
      type: "reference",
      to: [{ type: "gallery" }],
    }),
    defineField({
      name: "featured",
      title: "Show on the homepage",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display order",
      description: "Lower numbers appear first.",
      type: "number",
      initialValue: 100,
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "clientNames", subtitle: "quote" },
  },
});
