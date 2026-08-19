/**
 * Content types shared between the Sanity queries and the frontend.
 * `PhotoSource` is either a Sanity image (production) or a local
 * placeholder file (used only until real photographs are supplied).
 */

export interface SanityImageRef {
  asset?: { _ref: string; _type: "reference" };
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
  alt?: string;
  caption?: string;
  /** Local development placeholder path — never present on real CMS content. */
  placeholder?: string;
  /** Intrinsic aspect ratio (width/height), resolved by queries via asset metadata. */
  aspectRatio?: number;
  /** Tiny blurred preview for loading, from Sanity asset metadata. */
  lqip?: string;
}

export type PhotoSource = SanityImageRef;

export type GalleryCategory = "wedding" | "engagement" | "family";

export interface GalleryTeaser {
  _id: string;
  title: string;
  slug: string;
  category: GalleryCategory;
  location?: string;
  venueName?: string;
  date?: string;
  coverImage?: PhotoSource;
}

export interface Gallery extends GalleryTeaser {
  introduction?: string;
  story?: PortableBlock[];
  photographs?: PhotoSource[];
  venue?: { name: string; slug: string; location?: string };
  relatedPosts?: PostTeaser[];
  seo?: Seo;
}

export interface Venue {
  _id: string;
  name: string;
  slug: string;
  location?: string;
  heroImage?: PhotoSource;
  description?: PortableBlock[];
  photographs?: PhotoSource[];
  website?: string;
  galleries?: GalleryTeaser[];
  posts?: PostTeaser[];
  seo?: Seo;
}

export interface VenueTeaser {
  _id: string;
  name: string;
  slug: string;
  location?: string;
  heroImage?: PhotoSource;
  galleryCount?: number;
}

export interface PostTeaser {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  featuredImage?: PhotoSource;
  categories?: { title: string; slug: string }[];
}

export interface Post extends PostTeaser {
  body?: PortableBlock[];
  relatedGallery?: GalleryTeaser | null;
  relatedVenue?: { name: string; slug: string } | null;
  seo?: Seo;
}

export interface PostCategory {
  title: string;
  slug: string;
  description?: string;
}

export interface Testimonial {
  _id: string;
  clientNames: string;
  quote: string;
  serviceType?: string;
  relatedGallery?: { title: string; slug: string; category: GalleryCategory } | null;
}

export interface Seo {
  title?: string;
  description?: string;
  image?: PhotoSource;
  noIndex?: boolean;
}

// Portable Text block — kept loose; rendered by the PortableText component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PortableBlock = any;

export interface HomePage {
  heroHeadline?: string;
  heroSubline?: string;
  heroImage?: PhotoSource;
  heroImageSecondary?: PhotoSource;
  introHeading?: string;
  introText?: string;
  introImage?: PhotoSource;
  philosophyHeading?: string;
  philosophyText?: string;
  philosophyImages?: PhotoSource[];
  featuredGalleries?: GalleryTeaser[];
  seo?: Seo;
}

export interface AboutPage {
  heading?: string;
  subheading?: string;
  portrait?: PhotoSource;
  story?: PortableBlock[];
  photographs?: PhotoSource[];
  seo?: Seo;
}

export interface ExperienceStep {
  title?: string;
  description?: string;
  image?: PhotoSource;
}

export interface ExperiencePage {
  heading?: string;
  introText?: string;
  heroImage?: PhotoSource;
  steps?: ExperienceStep[];
  closingText?: string;
  seo?: Seo;
}

export interface Offering {
  title?: string;
  description?: string;
  startingPrice?: string;
  image?: PhotoSource;
}

export interface InvestmentPage {
  heading?: string;
  introText?: string;
  heroImage?: PhotoSource;
  offerings?: Offering[];
  detailsText?: PortableBlock[];
  seo?: Seo;
}

export interface ContactPage {
  heading?: string;
  introText?: string;
  image?: PhotoSource;
  successMessage?: string;
  seo?: Seo;
}

export interface SiteSettings {
  businessName?: string;
  tagline?: string;
  email?: string;
  serviceAreas?: string[];
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  defaultSeoDescription?: string;
}

export interface Redirect {
  from: string;
  to: string;
}
