/**
 * SAMPLE CONTENT — used only while no Sanity project is connected
 * (NEXT_PUBLIC_SANITY_PROJECT_ID unset). It lets the site be designed,
 * reviewed and tested before credentials and photographs exist.
 *
 * Copy marked VERIFIED comes from Courtney's existing website and public
 * profiles. Images are explicitly-labeled placeholders — real photographs
 * are uploaded through the CMS. Testimonials are intentionally ABSENT here:
 * only real ones may ever appear, entered by Courtney in the CMS.
 */
import type {
  AboutPage,
  ContactPage,
  ExperiencePage,
  Gallery,
  GalleryCategory,
  GalleryTeaser,
  HomePage,
  InvestmentPage,
  PhotoSource,
  Post,
  PostCategory,
  PostTeaser,
  SiteSettings,
  Testimonial,
  Venue,
  VenueTeaser,
} from "./types";

const ph = (file: string, aspectRatio: number, alt: string): PhotoSource => ({
  placeholder: `/placeholders/${file}.svg`,
  aspectRatio,
  alt,
});

const P = {
  portrait: (n: number, alt: string) => ph(`portrait-${n}`, 0.75, alt),
  landscape: (n: number, alt: string) => ph(`landscape-${n}`, 1.5, alt),
  wide: (n: number, alt: string) => ph(`wide-${n}`, 16 / 9, alt),
  square: (n: number, alt: string) => ph(`square-${n}`, 1, alt),
};

export const sampleSettings: SiteSettings = {
  businessName: "Courtney Stockton Photography",
  // VERIFIED positioning: timeless, editorial wedding & family photography in Sonoma, Napa & Wine Country.
  tagline: "Timeless, editorial wedding & family photography in Sonoma, Napa & Northern California",
  email: "courtney@courtneystockton.com", // VERIFIED business email
  serviceAreas: ["Sonoma", "Napa", "Northern California", "Seattle", "Available worldwide"],
  instagram: "https://www.instagram.com/courtney_stockton/",
  facebook: "https://www.facebook.com/courtneystocktonphotography/",
  pinterest: "https://www.pinterest.com/courtney_stockton/",
  defaultSeoDescription:
    "Timeless, editorial wedding and family photography in Sonoma, Napa and Northern California wine country by Courtney Stockton.",
};

export const sampleHomePage: HomePage = {
  heroHeadline: "Sonoma County Wedding & Family Photographer",
  heroSubline:
    "Timeless, editorial photography for weddings, engagements and families across Sonoma, Napa and the rest of Northern California wine country.",
  heroImage: P.wide(1, "Wedding couple among the vines at golden hour"),
  heroImageSecondary: P.portrait(1, "Bride laughing during portraits"),
  introHeading: "Hello, I'm Courtney",
  // VERIFIED biography facts: Sonoma-based, married to a Sonoma winemaker, film + digital.
  introText:
    "I'm a wedding and portrait photographer based in Sonoma, California, and wife to a Sonoma winemaker, so wine country is quite literally home. I photograph in both digital and film, drawn to real moments: the in-between glances, the laughter, the quiet ones. My work is playful yet sophisticated, modern yet timeless.",
  introImage: P.portrait(2, "Portrait of Courtney Stockton with her camera"),
  philosophyHeading: "Photographs that feel like memory",
  philosophyText:
    "Some photographs are made: carefully composed portraits in beautiful light. The best ones simply happen, and my job is to notice. I'll guide you when you need it and disappear when you don't, so your gallery holds both: refined portraiture and the honest, unrepeatable moments in between.",
  philosophyImages: [
    P.portrait(3, "Quiet moment between couple before ceremony"),
    P.landscape(1, "Family walking through a vineyard row"),
    P.portrait(4, "Detail of bouquet and vows"),
  ],
};

const teaser = (
  id: string,
  title: string,
  slug: string,
  category: GalleryCategory,
  location: string,
  cover: PhotoSource,
  venueName?: string
): GalleryTeaser => ({ _id: id, title, slug, category, location, coverImage: cover, venueName });

export const sampleGalleryTeasers: GalleryTeaser[] = [
  teaser("g1", "A Wine Country Wedding", "sample-wine-country-wedding", "wedding", "Sonoma, California", P.portrait(1, "Couple's first dance under string lights"), "Sample Vineyard Estate"),
  teaser("g2", "Golden Hour in the Vines", "sample-golden-hour-vineyard-wedding", "wedding", "Napa Valley, California", P.landscape(2, "Newlyweds walking through vineyard rows at sunset")),
  teaser("g3", "A Coastal Elopement", "sample-coastal-elopement", "wedding", "Sonoma Coast, California", P.portrait(5, "Elopement couple on the bluffs above the Pacific")),
  teaser("g4", "An Evening Engagement", "sample-evening-engagement", "engagement", "Sonoma Plaza, California", P.portrait(3, "Engaged couple laughing at dusk")),
  teaser("g5", "Vineyard Engagement Session", "sample-vineyard-engagement", "engagement", "Kenwood, California", P.landscape(3, "Couple among autumn vines")),
  teaser("g6", "The B Family at Home", "sample-family-session-at-home", "family", "Santa Rosa, California", P.landscape(4, "Family gathered on the porch at golden hour")),
  teaser("g7", "Little Ones in the Meadow", "sample-meadow-family-session", "family", "Glen Ellen, California", P.portrait(6, "Children running through tall grass")),
];

export function sampleGalleriesByCategory(category: GalleryCategory): GalleryTeaser[] {
  return sampleGalleryTeasers.filter((g) => g.category === category);
}

export function sampleGallery(category: GalleryCategory, slug: string): Gallery | null {
  const t = sampleGalleryTeasers.find((g) => g.slug === slug && g.category === category);
  if (!t) return null;
  return {
    ...t,
    introduction:
      "This is a sample gallery shown while the website's content management system is being connected. Once Courtney uploads a real wedding or session, it will appear here, photographs and story alike, exactly as she arranges it.",
    photographs: [
      P.wide(1, "Sample photograph"),
      P.portrait(1, "Sample photograph"),
      P.portrait(2, "Sample photograph"),
      P.landscape(1, "Sample photograph"),
      P.portrait(3, "Sample photograph"),
      P.portrait(4, "Sample photograph"),
      P.landscape(2, "Sample photograph"),
      P.square(1, "Sample photograph"),
      P.portrait(5, "Sample photograph"),
      P.landscape(3, "Sample photograph"),
      P.portrait(6, "Sample photograph"),
      P.wide(2, "Sample photograph"),
    ],
    venue: t.venueName
      ? { name: t.venueName, slug: "sample-vineyard-estate", location: t.location }
      : undefined,
  };
}

export const sampleVenueTeasers: VenueTeaser[] = [
  {
    _id: "v1",
    name: "Sample Vineyard Estate",
    slug: "sample-vineyard-estate",
    location: "Sonoma, California",
    heroImage: P.wide(2, "Vineyard estate at dusk"),
    galleryCount: 1,
  },
];

export function sampleVenue(slug: string): Venue | null {
  const t = sampleVenueTeasers.find((v) => v.slug === slug);
  if (!t) return null;
  return {
    ...t,
    description: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "This is a sample venue page. When Courtney adds real venues in the CMS and links weddings to them, each venue page automatically gathers every wedding photographed there, a natural home for couples researching their venue.",
          },
        ],
      },
    ],
    galleries: sampleGalleryTeasers.filter((g) => g.venueName === t.name),
    posts: [],
  };
}

// VERIFIED: the category names and addresses that exist on courtneystockton.com today.
export const samplePostCategories: PostCategory[] = [
  { title: "I Do's: Weddings", slug: "weddings-2" },
  { title: "In Love: Couples", slug: "couples" },
  { title: "little ones", slug: "little-ones-kids-family-and-maternity", description: "Kids, family and maternity" },
  { title: "life at 18: Seniors!", slug: "seniors" },
  { title: "Personal", slug: "lifestyle-photography" },
  { title: "Lifestyle", slug: "lifestyle-blog" },
];

export const samplePostTeasers: PostTeaser[] = [
  {
    _id: "p1",
    title: "A Sample Journal Entry",
    slug: "sample-journal-entry",
    publishedAt: "2026-06-01T00:00:00Z",
    excerpt:
      "A sample post shown while the blog is being connected to the CMS. Courtney's existing journal entries will be migrated here with their original addresses preserved.",
    featuredImage: P.landscape(1, "Sample journal photograph"),
    categories: [{ title: "I Do's: Weddings", slug: "weddings-2" }],
  },
];

export function samplePost(slug: string): Post | null {
  const t = samplePostTeasers.find((p) => p.slug === slug);
  if (!t) return null;
  return {
    ...t,
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "This sample entry exists so the journal's design can be reviewed before the CMS is connected. Real stories, with photographs, linked galleries and venues, replace it the moment content is published in the Studio.",
          },
        ],
      },
    ],
    relatedGallery: sampleGalleryTeasers[0],
    relatedVenue: null,
  };
}

/**
 * Real testimonials only. These three are VERIFIED verbatim client reviews:
 * #1 appears on the current courtneystockton.com information page (longer
 * variant on Yelp); #2 and #3 are from her public Yelp/WeddingWire/The Knot
 * reviews. Courtney manages the full list in the CMS.
 */
export const sampleTestimonials: Testimonial[] = [
  {
    _id: "t1",
    clientNames: "A wedding client",
    quote:
      "If there was a photographer fairy, Courtney Stockton would be it… She floats through the venue capturing each detail. She makes you feel beautiful and hides all those not-so-attractive angles. I still obsess over every photo.",
    serviceType: "wedding",
  },
  {
    _id: "t2",
    clientNames: "A wedding client",
    quote:
      "Working with Courtney (and her husband, who was our second photographer) was one of the easiest parts of our wedding.",
    serviceType: "wedding",
  },
  {
    _id: "t3",
    clientNames: "A wedding client",
    quote:
      "We are obsessed with all the photos and the way that Courtney and Joey captured so many special moments on our day.",
    serviceType: "wedding",
  },
];

export const sampleAboutPage: AboutPage = {
  heading: "Meet Courtney",
  subheading: "Photographer of all things love in Sonoma, Napa & beyond",
  portrait: P.portrait(2, "Portrait of Courtney Stockton"),
  story: [
    // VERIFIED facts woven into placeholder-length copy; Courtney refines in the CMS.
    {
      _type: "block",
      _key: "a1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s1",
          text: "After being inspired by my own love story and wedding photography, I studied photography at the Academy of Art and began shooting weddings in 2012. More than a decade later, it still doesn't feel like work.",
        },
      ],
    },
    {
      _type: "block",
      _key: "a2",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s2",
          text: "Home is Sonoma County wine country, where my husband Joey makes chardonnay and second shoots weddings with me when the cellar lets him go. I photograph in both digital and film, because film has a way of slowing everything down and turning real moments into something that feels like memory.",
        },
      ],
    },
    {
      _type: "block",
      _key: "a3",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s3",
          text: "I'm based in wine country and available worldwide, and Seattle holds a special place in my heart, so my travel fee never applies there.",
        },
      ],
    },
  ],
  photographs: [
    P.landscape(2, "Sonoma vineyard in morning fog"),
    P.portrait(4, "Courtney photographing a wedding"),
  ],
};

export const sampleExperiencePage: ExperiencePage = {
  heading: "The Experience",
  introText:
    "Beautiful galleries begin long before the first photograph. Here is what working together looks like, from your first note to the day your gallery arrives.",
  heroImage: P.wide(1, "Courtney photographing a couple in the vineyard"),
  steps: [
    {
      title: "Say hello",
      description:
        "Share your date, your venue if you have one, and what you're dreaming up. I'll reply personally with availability and everything you need to decide if we're a fit.",
    },
    {
      title: "We plan together",
      description:
        "From timelines to light, I'll help you shape a day that leaves room for the moments that matter. You'll never be left guessing what happens next.",
    },
    {
      title: "Your day, gently guided",
      description:
        "I'll direct when you need it and disappear when you don't, keeping portraits relaxed, details remembered, and the real moments untouched.",
    },
    {
      title: "Your gallery arrives",
      description:
        "A curated online gallery of finished photographs, ready to share, print and keep. Heirloom albums and prints are available for the images you love most.",
    },
  ],
  closingText:
    "Every wedding and session is different, and that's the point. If this sounds like the kind of photography you want, I'd love to hear your plans.",
};

export const sampleInvestmentPage: InvestmentPage = {
  heading: "Investment",
  introText:
    "Wedding collections, elopements, engagement sessions and family sessions, each tailored to the day at hand. The details below are placeholders until Courtney publishes her current offerings in the CMS; no pricing is shown that she hasn't provided.",
  heroImage: P.landscape(3, "Table setting details at a wine country reception"),
  offerings: [
    {
      title: "Weddings",
      description:
        "Full wedding-day coverage in Sonoma, Napa and beyond: timeless, editorial photography of the whole story, from getting ready to the last dance. Inquire for current collections and availability.",
      image: P.portrait(1, "Bride and groom in the vineyard"),
    },
    {
      title: "Elopements & intimate weddings",
      description:
        "For small celebrations and vow exchanges in beautiful places: wine country, the Sonoma coast, or wherever you're headed. Inquire for details.",
      image: P.portrait(5, "Eloping couple on the coast"),
    },
    {
      title: "Engagements",
      description:
        "A relaxed session in a place that means something to you, and a lovely way to get comfortable in front of the camera before the wedding.",
      image: P.portrait(3, "Engagement session at dusk"),
    },
    {
      title: "Families & little ones",
      description:
        "Honest, warm photographs of your people, at home, in the meadow, or among the vines. Kids welcome exactly as they are.",
      image: P.landscape(4, "Family session at golden hour"),
    },
  ],
};

export const sampleContactPage: ContactPage = {
  heading: "Let's tell your story",
  introText:
    "I'd love to hear what you're planning. Tell me a little about your day, or your family, and I'll reply personally, usually within two business days.",
  image: P.portrait(6, "Detail photograph of wedding stationery"),
  successMessage:
    "Thank you. Your note is on its way. I'll be in touch soon, usually within two business days. I can't wait to hear more.",
};
