import { HomeIcon, UserIcon, SparklesIcon, TagIcon, EnvelopeIcon } from "@/sanity/icons";
import { defineField, defineType } from "sanity";

const seoField = defineField({
  name: "seo",
  title: "Search & sharing",
  type: "seo",
  group: "seo",
});

const seoGroup = { name: "seo", title: "Search & sharing" };

/** Homepage content, organized by section in the order it appears on the page. */
export const homePageType = defineType({
  name: "homePage",
  title: "Homepage",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "hero", title: "Opening", default: true },
    { name: "intro", title: "Introduction" },
    { name: "philosophy", title: "Philosophy" },
    { name: "portfolio", title: "Portfolio" },
    seoGroup,
  ],
  fields: [
    defineField({
      name: "heroHeadline",
      title: "Opening headline",
      description: "The first line visitors read, e.g. “Sonoma County Wedding & Family Photographer”.",
      type: "string",
      group: "hero",
    }),
    defineField({
      name: "heroSubline",
      title: "Opening line beneath the headline",
      type: "text",
      rows: 2,
      group: "hero",
    }),
    defineField({
      name: "heroImage",
      title: "Opening photograph",
      description: "The large photograph at the top of the homepage. Choose a favorite — this is the first thing every visitor sees.",
      type: "photograph",
      group: "hero",
    }),
    defineField({
      name: "heroImageSecondary",
      title: "Second opening photograph (optional)",
      description: "Shown beside or beneath the main opening photograph on larger screens.",
      type: "photograph",
      group: "hero",
    }),
    defineField({
      name: "introHeading",
      title: "Introduction heading",
      type: "string",
      group: "intro",
    }),
    defineField({
      name: "introText",
      title: "Introduction",
      description: "A short, warm introduction to you and your work — two to four sentences.",
      type: "text",
      rows: 5,
      group: "intro",
    }),
    defineField({
      name: "introImage",
      title: "Introduction photograph",
      description: "Usually a portrait of you.",
      type: "photograph",
      group: "intro",
    }),
    defineField({
      name: "philosophyHeading",
      title: "Philosophy heading",
      type: "string",
      group: "philosophy",
    }),
    defineField({
      name: "philosophyText",
      title: "Philosophy",
      description: "How you photograph — the feeling of your work.",
      type: "text",
      rows: 5,
      group: "philosophy",
    }),
    defineField({
      name: "philosophyImages",
      title: "Philosophy photographs",
      description: "Two or three photographs that show what the words describe.",
      type: "array",
      of: [{ type: "photograph" }],
      options: { layout: "grid" },
      group: "philosophy",
    }),
    defineField({
      name: "featuredGalleries",
      title: "Featured galleries",
      description:
        "Hand-pick the galleries shown on the homepage. If left empty, the newest featured gallery from each portfolio section is used automatically.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "gallery" }] }],
      group: "portfolio",
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: "Homepage" }) },
});

export const aboutPageType = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  icon: UserIcon,
  groups: [{ name: "content", title: "Content", default: true }, seoGroup],
  fields: [
    defineField({
      name: "heading",
      title: "Page heading",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "subheading",
      title: "Line beneath the heading",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "portrait",
      title: "Portrait photograph",
      type: "photograph",
      group: "content",
    }),
    defineField({
      name: "story",
      title: "Your story",
      type: "blockContent",
      group: "content",
    }),
    defineField({
      name: "photographs",
      title: "Additional photographs",
      description: "Personal photographs woven through the page.",
      type: "array",
      of: [{ type: "photograph" }],
      options: { layout: "grid" },
      group: "content",
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: "About page" }) },
});

export const experiencePageType = defineType({
  name: "experiencePage",
  title: "Experience page",
  type: "document",
  icon: SparklesIcon,
  groups: [{ name: "content", title: "Content", default: true }, seoGroup],
  fields: [
    defineField({ name: "heading", title: "Page heading", type: "string", group: "content" }),
    defineField({
      name: "introText",
      title: "Introduction",
      type: "text",
      rows: 4,
      group: "content",
    }),
    defineField({
      name: "heroImage",
      title: "Opening photograph",
      type: "photograph",
      group: "content",
    }),
    defineField({
      name: "steps",
      title: "The experience, step by step",
      description: "Each step describes one part of working together, from first hello to final gallery.",
      type: "array",
      group: "content",
      of: [
        {
          name: "step",
          title: "Step",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Step title", type: "string" }),
            defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
            defineField({ name: "image", title: "Photograph (optional)", type: "photograph" }),
          ],
          preview: { select: { title: "title", media: "image" } },
        },
      ],
    }),
    defineField({
      name: "closingText",
      title: "Closing paragraph",
      type: "text",
      rows: 3,
      group: "content",
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: "Experience page" }) },
});

export const investmentPageType = defineType({
  name: "investmentPage",
  title: "Investment page",
  type: "document",
  icon: TagIcon,
  groups: [{ name: "content", title: "Content", default: true }, seoGroup],
  fields: [
    defineField({ name: "heading", title: "Page heading", type: "string", group: "content" }),
    defineField({
      name: "introText",
      title: "Introduction",
      type: "text",
      rows: 4,
      group: "content",
    }),
    defineField({
      name: "heroImage",
      title: "Opening photograph",
      type: "photograph",
      group: "content",
    }),
    defineField({
      name: "offerings",
      title: "Offerings",
      description: "One entry per service — weddings, elopements, engagements, families…",
      type: "array",
      group: "content",
      of: [
        {
          name: "offering",
          title: "Offering",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Name", type: "string" }),
            defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
            defineField({
              name: "startingPrice",
              title: "Starting investment (optional)",
              description: "Shown exactly as written, e.g. “Collections begin at $6,500”. Leave empty to show no price.",
              type: "string",
            }),
            defineField({ name: "image", title: "Photograph", type: "photograph" }),
          ],
          preview: { select: { title: "title", subtitle: "startingPrice", media: "image" } },
        },
      ],
    }),
    defineField({
      name: "detailsText",
      title: "The details",
      description: "Anything couples should know — travel, albums, timelines, what's included.",
      type: "blockContent",
      group: "content",
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: "Investment page" }) },
});

export const contactPageType = defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  icon: EnvelopeIcon,
  groups: [{ name: "content", title: "Content", default: true }, seoGroup],
  fields: [
    defineField({ name: "heading", title: "Page heading", type: "string", group: "content" }),
    defineField({
      name: "introText",
      title: "Welcome note",
      description: "A warm note above the inquiry form.",
      type: "text",
      rows: 4,
      group: "content",
    }),
    defineField({
      name: "image",
      title: "Photograph",
      type: "photograph",
      group: "content",
    }),
    defineField({
      name: "successMessage",
      title: "Thank-you message",
      description: "Shown after someone sends an inquiry.",
      type: "text",
      rows: 3,
      group: "content",
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: "Contact page" }) },
});
