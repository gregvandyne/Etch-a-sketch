import { CogIcon, LinkIcon } from "@/sanity/icons";
import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "business", title: "Business", default: true },
    { name: "social", title: "Social links" },
    { name: "seo", title: "Search defaults" },
  ],
  fields: [
    defineField({
      name: "businessName",
      title: "Business name",
      type: "string",
      initialValue: "Courtney Stockton Photography",
      group: "business",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      description: "A short line used in the footer and as a search-result fallback.",
      type: "string",
      group: "business",
    }),
    defineField({
      name: "email",
      title: "Business email",
      type: "string",
      group: "business",
    }),
    defineField({
      name: "serviceAreas",
      title: "Service areas",
      description: "e.g. Sonoma, Napa, Northern California — shown in the footer.",
      type: "array",
      of: [{ type: "string" }],
      group: "business",
    }),
    defineField({
      name: "instagram",
      title: "Instagram address",
      type: "url",
      group: "social",
    }),
    defineField({
      name: "facebook",
      title: "Facebook address",
      type: "url",
      group: "social",
    }),
    defineField({
      name: "pinterest",
      title: "Pinterest address",
      type: "url",
      group: "social",
    }),
    defineField({
      name: "defaultSeoDescription",
      title: "Default search description",
      description: "Used for pages without their own search description.",
      type: "text",
      rows: 3,
      group: "seo",
    }),
    defineField({
      name: "defaultShareImage",
      title: "Default sharing image",
      description: "Used when a page has no photograph of its own.",
      type: "image",
      options: { hotspot: true },
      group: "seo",
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});

/**
 * A permanent redirect from an old address to a new one. Used to keep
 * links and search rankings intact when an address changes.
 */
export const redirectType = defineType({
  name: "redirect",
  title: "Redirect",
  type: "document",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "from",
      title: "Old address",
      description: "The path on this site, starting with a slash, e.g. /old-blog-post",
      type: "string",
      validation: (rule) =>
        rule.required().custom((value) =>
          value?.startsWith("/") ? true : "Must start with a slash, e.g. /old-address"
        ),
    }),
    defineField({
      name: "to",
      title: "New address",
      description: "Where visitors should land instead, e.g. /weddings or a full https:// address.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { from: "from", to: "to" },
    prepare: ({ from, to }) => ({ title: `${from} → ${to}` }),
  },
});
