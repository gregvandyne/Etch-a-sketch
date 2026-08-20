import type { StructureResolver } from "sanity/structure";
import {
  ImagesIcon,
  PinIcon,
  EditIcon,
  HeartIcon,
  DocumentTextIcon,
  CogIcon,
  HomeIcon,
  UserIcon,
  SparklesIcon,
  TagIcon,
  EnvelopeIcon,
  LinkIcon,
} from "@/sanity/icons";

/**
 * Courtney's dashboard structure. Organized around her workflow —
 * portfolio first, then blog, venues, kind words, page content, settings —
 * with human names instead of developer terminology.
 */
export const structure: StructureResolver = (S) => {
  const singleton = (title: string, type: string, icon: React.ComponentType) =>
    S.listItem()
      .title(title)
      .icon(icon)
      .child(S.document().schemaType(type).documentId(type).title(title));

  return S.list()
    .title("Courtney Stockton Photography")
    .items([
      S.listItem()
        .title("Portfolio")
        .icon(ImagesIcon)
        .child(
          S.list()
            .title("Portfolio")
            .items([
              S.listItem()
                .title("All galleries")
                .icon(ImagesIcon)
                .child(
                  S.documentTypeList("gallery")
                    .title("All galleries")
                    .defaultOrdering([{ field: "date", direction: "desc" }])
                ),
              S.divider(),
              ...(
                [
                  ["Weddings", "wedding"],
                  ["Engagements", "engagement"],
                  ["Families", "family"],
                ] as const
              ).map(([title, value]) =>
                S.listItem()
                  .title(title)
                  .icon(ImagesIcon)
                  .child(
                    S.documentTypeList("gallery")
                      .title(title)
                      .filter('_type == "gallery" && category == $category')
                      .params({ category: value })
                      .defaultOrdering([{ field: "date", direction: "desc" }])
                      .initialValueTemplates([
                        S.initialValueTemplateItem(`gallery-${value}`),
                      ])
                  )
              ),
            ])
        ),
      S.listItem()
        .title("Blog")
        .icon(EditIcon)
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .title("Posts")
                .icon(EditIcon)
                .child(
                  S.documentTypeList("post")
                    .title("Posts")
                    .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
                ),
              S.listItem()
                .title("Categories")
                .icon(TagIcon)
                .child(S.documentTypeList("postCategory").title("Categories")),
            ])
        ),
      S.listItem()
        .title("Venues")
        .icon(PinIcon)
        .child(S.documentTypeList("venue").title("Venues")),
      S.listItem()
        .title("Kind words")
        .icon(HeartIcon)
        .child(
          S.documentTypeList("testimonial")
            .title("Kind words")
            .defaultOrdering([{ field: "order", direction: "asc" }])
        ),
      S.divider(),
      S.listItem()
        .title("Website pages")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Website pages")
            .items([
              singleton("Homepage", "homePage", HomeIcon),
              singleton("About", "aboutPage", UserIcon),
              singleton("Experience", "experiencePage", SparklesIcon),
              singleton("Investment", "investmentPage", TagIcon),
              singleton("Contact", "contactPage", EnvelopeIcon),
            ])
        ),
      S.divider(),
      singleton("Site settings", "siteSettings", CogIcon),
      S.listItem()
        .title("Redirects")
        .icon(LinkIcon)
        .child(S.documentTypeList("redirect").title("Redirects")),
    ]);
};

/** Document types managed as one-of-a-kind pages — hidden from the generic "create new" menus. */
export const SINGLETON_TYPES = new Set([
  "homePage",
  "aboutPage",
  "experiencePage",
  "investmentPage",
  "contactPage",
  "siteSettings",
]);
