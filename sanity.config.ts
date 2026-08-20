"use client";

/**
 * Sanity Studio configuration — Courtney's website dashboard,
 * served at /studio by the Next.js app.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { media } from "sanity-plugin-media";

import { apiVersion, dataset, projectId } from "@/sanity/env";
import { schema } from "@/sanity/schemaTypes";
import { structure, SINGLETON_TYPES } from "@/sanity/structure";

export default defineConfig({
  basePath: "/studio",
  title: "Courtney Stockton Photography",
  projectId: projectId || "placeholder",
  dataset,
  schema: {
    ...schema,
    // Singleton pages are edited from "Website pages", never created from the new-document menu.
    templates: (templates) =>
      [
        ...templates.filter((t) => !SINGLETON_TYPES.has(t.schemaType)),
        // One-click "new wedding/engagement/family" with the section preselected.
        ...(
          [
            ["wedding", "Wedding gallery"],
            ["engagement", "Engagement gallery"],
            ["family", "Family gallery"],
          ] as const
        ).map(([value, title]) => ({
          id: `gallery-${value}`,
          title,
          schemaType: "gallery",
          value: { category: value },
        })),
      ],
  },
  document: {
    actions: (actions, context) =>
      SINGLETON_TYPES.has(context.schemaType)
        ? actions.filter(
            ({ action }) =>
              action && ["publish", "discardChanges", "restore"].includes(action)
          )
        : actions,
  },
  plugins: [
    structureTool({ structure }),
    // "Preview" tab: browse the site with unpublished drafts visible.
    presentationTool({
      title: "Preview",
      previewUrl: {
        previewMode: { enable: "/api/draft-mode/enable" },
      },
    }),
    // "Media" tab: browse, search and tag every uploaded photograph.
    media(),
    // GROQ playground — useful for developers, harmless for editors.
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
