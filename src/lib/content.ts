/**
 * Content access layer. Every page reads through these functions.
 *
 * - With Sanity configured: content comes from the CMS (drafts in preview).
 * - Without Sanity configured (pre-credential development): pages fall back
 *   to the clearly-labeled sample content so design and QA stay possible.
 *   The fallback NEVER mixes with real CMS data — once a project ID exists,
 *   missing content renders as empty states, not samples.
 */
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  settingsQuery,
  homePageQuery,
  aboutPageQuery,
  experiencePageQuery,
  investmentPageQuery,
  contactPageQuery,
  galleriesByCategoryQuery,
  galleryBySlugQuery,
  gallerySlugsQuery,
  venuesQuery,
  venueBySlugQuery,
  venueSlugsQuery,
  postsQuery,
  postsByCategoryQuery,
  postCategoryQuery,
  postCategoriesQuery,
  postBySlugQuery,
  postSlugsQuery,
  testimonialsQuery,
  featuredTestimonialsQuery,
  redirectByPathQuery,
  sitemapQuery,
} from "@/sanity/lib/queries";
import * as sample from "./sample-content";
import type {
  AboutPage,
  ContactPage,
  ExperiencePage,
  Gallery,
  GalleryCategory,
  GalleryTeaser,
  HomePage,
  InvestmentPage,
  Post,
  PostCategory,
  PostTeaser,
  Redirect,
  SiteSettings,
  Testimonial,
  Venue,
  VenueTeaser,
} from "./types";

export const usingSampleContent = !isSanityConfigured;

export async function getSettings(): Promise<SiteSettings> {
  if (usingSampleContent) return sample.sampleSettings;
  return (
    (await sanityFetch<SiteSettings>({ query: settingsQuery, tags: ["settings"] })) ?? {}
  );
}

export async function getHomePage(): Promise<HomePage> {
  if (usingSampleContent) {
    return { ...sample.sampleHomePage, featuredGalleries: sample.sampleGalleryTeasers.slice(0, 6) };
  }
  return (
    (await sanityFetch<HomePage>({ query: homePageQuery, tags: ["homePage", "gallery"] })) ?? {}
  );
}

export async function getAboutPage(): Promise<AboutPage> {
  if (usingSampleContent) return sample.sampleAboutPage;
  return (await sanityFetch<AboutPage>({ query: aboutPageQuery, tags: ["aboutPage"] })) ?? {};
}

export async function getExperiencePage(): Promise<ExperiencePage> {
  if (usingSampleContent) return sample.sampleExperiencePage;
  return (
    (await sanityFetch<ExperiencePage>({ query: experiencePageQuery, tags: ["experiencePage"] })) ??
    {}
  );
}

export async function getInvestmentPage(): Promise<InvestmentPage> {
  if (usingSampleContent) return sample.sampleInvestmentPage;
  return (
    (await sanityFetch<InvestmentPage>({ query: investmentPageQuery, tags: ["investmentPage"] })) ??
    {}
  );
}

export async function getContactPage(): Promise<ContactPage> {
  if (usingSampleContent) return sample.sampleContactPage;
  return (
    (await sanityFetch<ContactPage>({ query: contactPageQuery, tags: ["contactPage"] })) ?? {}
  );
}

export async function getGalleries(category: GalleryCategory): Promise<GalleryTeaser[]> {
  if (usingSampleContent) return sample.sampleGalleriesByCategory(category);
  return (
    (await sanityFetch<GalleryTeaser[]>({
      query: galleriesByCategoryQuery,
      params: { category },
      tags: ["gallery"],
    })) ?? []
  );
}

export async function getGallery(
  category: GalleryCategory,
  slug: string
): Promise<Gallery | null> {
  if (usingSampleContent) return sample.sampleGallery(category, slug);
  return sanityFetch<Gallery>({
    query: galleryBySlugQuery,
    params: { category, slug },
    tags: ["gallery", `gallery:${slug}`],
  });
}

export async function getGallerySlugs(): Promise<{ slug: string; category: GalleryCategory }[]> {
  if (usingSampleContent) {
    return sample.sampleGalleryTeasers.map((g) => ({ slug: g.slug, category: g.category }));
  }
  return (
    (await sanityFetch<{ slug: string; category: GalleryCategory }[]>({
      query: gallerySlugsQuery,
      tags: ["gallery"],
    })) ?? []
  );
}

export async function getVenues(): Promise<VenueTeaser[]> {
  if (usingSampleContent) return sample.sampleVenueTeasers;
  return (await sanityFetch<VenueTeaser[]>({ query: venuesQuery, tags: ["venue"] })) ?? [];
}

export async function getVenue(slug: string): Promise<Venue | null> {
  if (usingSampleContent) return sample.sampleVenue(slug);
  return sanityFetch<Venue>({
    query: venueBySlugQuery,
    params: { slug },
    tags: ["venue", `venue:${slug}`, "gallery", "post"],
  });
}

export async function getVenueSlugs(): Promise<{ slug: string }[]> {
  if (usingSampleContent) return sample.sampleVenueTeasers.map((v) => ({ slug: v.slug }));
  return (
    (await sanityFetch<{ slug: string }[]>({ query: venueSlugsQuery, tags: ["venue"] })) ?? []
  );
}

export async function getPosts(): Promise<PostTeaser[]> {
  if (usingSampleContent) return sample.samplePostTeasers;
  return (await sanityFetch<PostTeaser[]>({ query: postsQuery, tags: ["post"] })) ?? [];
}

export async function getPostsByCategory(slug: string): Promise<PostTeaser[]> {
  if (usingSampleContent) {
    return sample.samplePostTeasers.filter((p) =>
      p.categories?.some((c) => c.slug === slug)
    );
  }
  return (
    (await sanityFetch<PostTeaser[]>({
      query: postsByCategoryQuery,
      params: { slug },
      tags: ["post"],
    })) ?? []
  );
}

export async function getPostCategory(slug: string): Promise<PostCategory | null> {
  if (usingSampleContent) {
    return sample.samplePostCategories.find((c) => c.slug === slug) ?? null;
  }
  return sanityFetch<PostCategory>({
    query: postCategoryQuery,
    params: { slug },
    tags: ["postCategory"],
  });
}

export async function getPostCategories(): Promise<PostCategory[]> {
  if (usingSampleContent) return sample.samplePostCategories;
  return (
    (await sanityFetch<PostCategory[]>({ query: postCategoriesQuery, tags: ["postCategory"] })) ??
    []
  );
}

export async function getPost(slug: string): Promise<Post | null> {
  if (usingSampleContent) return sample.samplePost(slug);
  return sanityFetch<Post>({
    query: postBySlugQuery,
    params: { slug },
    tags: ["post", `post:${slug}`],
  });
}

export async function getPostSlugs(): Promise<{ slug: string }[]> {
  if (usingSampleContent) return sample.samplePostTeasers.map((p) => ({ slug: p.slug }));
  return (await sanityFetch<{ slug: string }[]>({ query: postSlugsQuery, tags: ["post"] })) ?? [];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (usingSampleContent) return sample.sampleTestimonials;
  return (
    (await sanityFetch<Testimonial[]>({ query: testimonialsQuery, tags: ["testimonial"] })) ?? []
  );
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  if (usingSampleContent) return sample.sampleTestimonials.slice(0, 3);
  return (
    (await sanityFetch<Testimonial[]>({
      query: featuredTestimonialsQuery,
      tags: ["testimonial"],
    })) ?? []
  );
}

export async function getRedirectForPath(path: string): Promise<Redirect | null> {
  if (usingSampleContent) return null;
  return sanityFetch<Redirect>({
    query: redirectByPathQuery,
    params: { path },
    tags: ["redirect"],
  });
}

export interface SitemapContent {
  galleries: { slug: string; category: GalleryCategory; _updatedAt: string }[];
  venues: { slug: string; _updatedAt: string }[];
  posts: { slug: string; _updatedAt: string }[];
  categories: { slug: string; _updatedAt: string }[];
}

export async function getSitemapContent(): Promise<SitemapContent> {
  const empty: SitemapContent = { galleries: [], venues: [], posts: [], categories: [] };
  if (usingSampleContent) return empty;
  return (
    (await sanityFetch<SitemapContent>({
      query: sitemapQuery,
      tags: ["gallery", "venue", "post", "postCategory"],
    })) ?? empty
  );
}
