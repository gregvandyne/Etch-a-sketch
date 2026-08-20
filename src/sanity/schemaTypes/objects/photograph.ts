import { defineField, defineType } from "sanity";

/**
 * A single photograph with the editorial metadata the site needs.
 * Hotspot lets Courtney choose the focal point so crops always keep
 * the important part of the frame.
 */
export const photographType = defineType({
  name: "photograph",
  title: "Photograph",
  type: "image",
  options: { hotspot: true },
  preview: {
    select: { alt: "alt", caption: "caption", media: "asset" },
    prepare: ({ alt, caption, media }) => ({
      title: alt || caption || "Photograph",
      media,
    }),
  },
  fields: [
    defineField({
      name: "alt",
      title: "Photo description (alt text)",
      description:
        "A short sentence describing the photo, e.g. “Bride and groom laughing during golden hour at Viansa”. Helps Google find your work and helps visitors using screen readers.",
      type: "string",
    }),
    defineField({
      name: "caption",
      title: "Caption (optional)",
      description: "Shown under the photo where the layout supports it.",
      type: "string",
    }),
  ],
});
