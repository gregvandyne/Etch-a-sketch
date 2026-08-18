import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Rich editorial content for blog posts and long-form page sections.
 * The frontend controls all visual styling, so nothing Courtney writes
 * can break the design system.
 */
export const blockContentType = defineType({
  name: "blockContent",
  title: "Story content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bulleted list", value: "bullet" },
        { title: "Numbered list", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              defineField({
                name: "href",
                title: "Web address",
                type: "url",
                validation: (rule) =>
                  rule.uri({ scheme: ["http", "https", "mailto", "tel"], allowRelative: true }),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: "photograph",
      title: "Photograph",
    }),
    defineArrayMember({
      name: "imagePair",
      title: "Two photographs side by side",
      type: "object",
      fields: [
        defineField({ name: "left", title: "Left photograph", type: "photograph" }),
        defineField({ name: "right", title: "Right photograph", type: "photograph" }),
      ],
      preview: {
        select: { media: "left" },
        prepare: ({ media }) => ({ title: "Two photographs side by side", media }),
      },
    }),
    defineArrayMember({
      name: "imageGallery",
      title: "Photo gallery",
      type: "object",
      fields: [
        defineField({
          name: "photographs",
          title: "Photographs",
          type: "array",
          of: [{ type: "photograph" }],
          options: { layout: "grid" },
        }),
      ],
      preview: {
        select: { media: "photographs.0" },
        prepare: ({ media }) => ({ title: "Photo gallery", media }),
      },
    }),
    defineArrayMember({
      name: "callToAction",
      title: "Button",
      type: "object",
      fields: [
        defineField({
          name: "label",
          title: "Button text",
          type: "string",
          initialValue: "Inquire",
        }),
        defineField({
          name: "href",
          title: "Where it goes",
          description: "e.g. /contact or /weddings",
          type: "string",
          initialValue: "/contact",
        }),
      ],
      preview: {
        select: { title: "label" },
        prepare: ({ title }) => ({ title: `Button: ${title ?? ""}` }),
      },
    }),
  ],
});
