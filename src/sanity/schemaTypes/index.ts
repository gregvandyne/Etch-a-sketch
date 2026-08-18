import type { SchemaTypeDefinition } from "sanity";

import { seoType } from "./objects/seo";
import { photographType } from "./objects/photograph";
import { blockContentType } from "./objects/blockContent";
import { galleryType } from "./documents/gallery";
import { venueType } from "./documents/venue";
import { postType, postCategoryType } from "./documents/post";
import { testimonialType } from "./documents/testimonial";
import {
  homePageType,
  aboutPageType,
  experiencePageType,
  investmentPageType,
  contactPageType,
} from "./documents/pages";
import { siteSettingsType, redirectType } from "./documents/siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Objects
    seoType,
    photographType,
    blockContentType,
    // Documents
    galleryType,
    venueType,
    postType,
    postCategoryType,
    testimonialType,
    // Page singletons
    homePageType,
    aboutPageType,
    experiencePageType,
    investmentPageType,
    contactPageType,
    // Settings
    siteSettingsType,
    redirectType,
  ],
};
