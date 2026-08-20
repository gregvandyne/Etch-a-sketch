import { defineField, defineType } from "sanity";

/**
 * Shared SEO fields. Every field is optional — the site generates sensible
 * defaults from the document itself, so these are overrides only.
 */
export const seoType = defineType({
  name: "seo",
  title: "Search & sharing (SEO)",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "title",
      title: "Search result title",
      description:
        "Shown as the headline in Google. Leave empty to use the page title automatically.",
      type: "string",
      validation: (rule) =>
        rule
          .max(65)
          .warning("Titles longer than about 65 characters get cut off in Google."),
    }),
    defineField({
      name: "description",
      title: "Search result description",
      description:
        "The short paragraph shown under the title in Google. One or two inviting sentences work best.",
      type: "text",
      rows: 3,
      validation: (rule) =>
        rule
          .max(165)
          .warning("Descriptions longer than about 160 characters get cut off."),
    }),
    defineField({
      name: "image",
      title: "Sharing image",
      description:
        "Shown when the page is shared on Instagram, Facebook, Pinterest or in texts. Leave empty to use the page's main photograph.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      description:
        "Turn on only if this page should not appear in Google at all.",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
