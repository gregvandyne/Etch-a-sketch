import { defineQuery } from "next-sanity";

/** Image projection: pulls hotspot/crop plus aspect ratio and blur preview from asset metadata. */
const IMG = /* groq */ `{
  asset, hotspot, crop, alt, caption,
  "aspectRatio": asset->metadata.dimensions.aspectRatio,
  "lqip": asset->metadata.lqip
}`;

const GALLERY_TEASER = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
  category,
  location,
  "venueName": venue->name,
  date,
  coverImage ${IMG}
}`;

const POST_TEASER = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  featuredImage ${IMG},
  "categories": categories[]->{ title, "slug": slug.current }
}`;

const SEO = /* groq */ `seo { title, description, image ${IMG}, noIndex }`;

export const settingsQuery = defineQuery(`*[_type == "siteSettings"][0]{
  businessName, tagline, email, serviceAreas, instagram, facebook, pinterest,
  defaultSeoDescription
}`);

export const homePageQuery = defineQuery(`*[_type == "homePage"][0]{
  heroHeadline, heroSubline,
  heroImage ${IMG},
  heroImageSecondary ${IMG},
  introHeading, introText, introImage ${IMG},
  philosophyHeading, philosophyText,
  philosophyImages[] ${IMG},
  "featuredGalleries": select(
    count(featuredGalleries) > 0 => featuredGalleries[]-> ${GALLERY_TEASER},
    *[_type == "gallery" && featured == true && defined(slug.current)] | order(date desc) [0...6] ${GALLERY_TEASER}
  ),
  ${SEO}
}`);

export const aboutPageQuery = defineQuery(`*[_type == "aboutPage"][0]{
  heading, subheading, portrait ${IMG}, story, photographs[] ${IMG}, ${SEO}
}`);

export const experiencePageQuery = defineQuery(`*[_type == "experiencePage"][0]{
  heading, introText, heroImage ${IMG},
  steps[]{ title, description, image ${IMG} },
  closingText, ${SEO}
}`);

export const investmentPageQuery = defineQuery(`*[_type == "investmentPage"][0]{
  heading, introText, heroImage ${IMG},
  offerings[]{ title, description, startingPrice, image ${IMG} },
  detailsText, ${SEO}
}`);

export const contactPageQuery = defineQuery(`*[_type == "contactPage"][0]{
  heading, introText, image ${IMG}, successMessage, ${SEO}
}`);

export const galleriesByCategoryQuery = defineQuery(
  `*[_type == "gallery" && category == $category && defined(slug.current)] | order(date desc) ${GALLERY_TEASER}`
);

export const gallerySlugsQuery = defineQuery(
  `*[_type == "gallery" && defined(slug.current)]{ "slug": slug.current, category }`
);

export const galleryBySlugQuery = defineQuery(`*[_type == "gallery" && slug.current == $slug && category == $category][0]{
  _id, title, "slug": slug.current, category, location, date,
  coverImage ${IMG},
  photographs[] ${IMG},
  introduction, story,
  venue->{ name, "slug": slug.current, location },
  "relatedPosts": *[_type == "post" && references(^._id)] | order(publishedAt desc) [0...3] ${POST_TEASER},
  ${SEO}
}`);

export const venuesQuery = defineQuery(`*[_type == "venue" && defined(slug.current)] | order(name asc) {
  _id, name, "slug": slug.current, location, heroImage ${IMG},
  "galleryCount": count(*[_type == "gallery" && venue._ref == ^._id])
}`);

export const venueBySlugQuery = defineQuery(`*[_type == "venue" && slug.current == $slug][0]{
  _id, name, "slug": slug.current, location, heroImage ${IMG},
  description, photographs[] ${IMG}, website,
  "galleries": *[_type == "gallery" && venue._ref == ^._id] | order(date desc) ${GALLERY_TEASER},
  "posts": *[_type == "post" && relatedVenue._ref == ^._id] | order(publishedAt desc) ${POST_TEASER},
  ${SEO}
}`);

export const venueSlugsQuery = defineQuery(
  `*[_type == "venue" && defined(slug.current)]{ "slug": slug.current }`
);

export const postsQuery = defineQuery(
  `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) ${POST_TEASER}`
);

export const postsByCategoryQuery = defineQuery(
  `*[_type == "post" && defined(slug.current) && $slug in categories[]->slug.current] | order(publishedAt desc) ${POST_TEASER}`
);

export const postCategoryQuery = defineQuery(
  `*[_type == "postCategory" && slug.current == $slug][0]{ title, "slug": slug.current, description }`
);

export const postCategoriesQuery = defineQuery(
  `*[_type == "postCategory" && defined(slug.current)]{ title, "slug": slug.current, description }`
);

export const postBySlugQuery = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, publishedAt, excerpt,
  featuredImage ${IMG}, body,
  "categories": categories[]->{ title, "slug": slug.current },
  relatedGallery-> ${GALLERY_TEASER},
  relatedVenue->{ name, "slug": slug.current },
  ${SEO}
}`);

export const postSlugsQuery = defineQuery(
  `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`
);

export const testimonialsQuery = defineQuery(
  `*[_type == "testimonial"] | order(order asc) {
    _id, clientNames, quote, serviceType,
    relatedGallery->{ title, "slug": slug.current, category }
  }`
);

export const featuredTestimonialsQuery = defineQuery(
  `*[_type == "testimonial" && featured == true] | order(order asc) [0...4] {
    _id, clientNames, quote, serviceType,
    relatedGallery->{ title, "slug": slug.current, category }
  }`
);

export const redirectsQuery = defineQuery(
  `*[_type == "redirect"]{ from, to }`
);

export const redirectByPathQuery = defineQuery(
  `*[_type == "redirect" && from == $path][0]{ from, to }`
);

/** Everything the sitemap needs in one round trip. Pages hidden from search stay out. */
export const sitemapQuery = defineQuery(`{
  "galleries": *[_type == "gallery" && defined(slug.current) && seo.noIndex != true]{ "slug": slug.current, category, _updatedAt },
  "venues": *[_type == "venue" && defined(slug.current) && seo.noIndex != true]{ "slug": slug.current, _updatedAt },
  "posts": *[_type == "post" && defined(slug.current) && seo.noIndex != true]{ "slug": slug.current, _updatedAt },
  "categories": *[_type == "postCategory" && defined(slug.current)]{ "slug": slug.current, _updatedAt }
}`);
