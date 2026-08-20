# Content audit — courtneystockton.com (August 2026)

Reconstructed from search-engine indexes (the build environment could not reach the
live site directly). Items marked VERIFIED appeared verbatim or near-verbatim in
indexed titles/snippets; nothing here is fabricated. This document drives the
redirect map, sample content, and the blog-migration checklist.

## Existing pages (VERIFIED URLs)

| URL | Indexed title | New-site handling |
|---|---|---|
| `/` | Sonoma County Wedding Family Photographer Courtney Stockton | Rebuilt homepage |
| `/blog/` | Blog \| Courtney Stockton Photography | Rebuilt at same URL |
| `/information` | Information \| Courtney Stockton Photography | Rebuilt at same URL (Investment page) |
| `/galleries` | Galleries \| Courtney Stockton Photography | Rebuilt at same URL (portfolio index) |
| `/contact` | Contact \| Courtney Stockton Photography | Rebuilt at same URL |
| `/sonoma-wedding-photography` | Sonoma Wedding Photography \| Sonoma County Weddings | Rebuilt at same URL |
| `/napa-wedding-photography` | Napa Wedding Photography \| Napa County Weddings | Rebuilt at same URL |
| `/seattle-wedding-photography` | Seattle Wedding Photography \| Seattle Weddings | Rebuilt at same URL |
| `/sonoma-elopement-photography` | Elopement Photography \| Napa & Sonoma County | Rebuilt at same URL |
| `/guerneville-wedding-photographer/` | Guerneville Wedding Photographer | Rebuilt at same URL |

## Category archives (VERIFIED — preserved at `/category/<slug>`)

| Slug | Display name |
|---|---|
| `weddings-2` | I Do's: Weddings |
| `couples` | In Love: Couples |
| `little-ones-kids-family-and-maternity` | little ones (kids, family and maternity) |
| `seniors` | life at 18: Seniors! |
| `lifestyle-photography` | Personal |
| `lifestyle-blog` | Lifestyle |

Tag archive `/tag/sonoma-county-wedding-photographer/` → redirects to `/weddings`.

## Blog posts to migrate (VERIFIED URLs — root-level slugs preserved)

Weddings: `/trentadue-winery-wedding-sonoma-wedding-photographer/`,
`/m-b-fall-wedding-at-barndiva-in-healdsburg/`,
`/mara-alex-an-intimate-new-tree-ranch-wedding-in-healdsburg-california/`,
`/mike-laura-trione-winery-healdsburg-ca/`,
`/lajour-estate-winery-wedding-courtney-stockton-photography/`,
`/chad-jessica-imagery-estate-winery-wedding/`,
`/john-lloyd-annadel-estate-winery-wedding-santa-rosa-ca/`,
`/hans-fahden-winery-wedding-courtney-stockton-photography/`,
`/lisa-zach-viansa-winery-wedding-sonoma-ca/`,
`/jon-sarah-kenwood-ranch-wedding/`,
`/kaitlyn-nicholas-meritage-resort-napa-wedding/`,
`/mike-emily-meritage-resort-wedding-napa-valley/`,
`/meritage-resort-spa-wedding/`,
`/cia-greystone-wedding-st-helena/`,
`/kelley-steven-fairmont-sonoma-mission-inn-sonoma-golf-club-wedding-sonoma-wedding-photographer/`,
`/sam-ali-ramekins-culinary-institute-wedding/`,
`/rachel-brendan-ramekins-sonoma-wedding/`,
`/danny-jocelyn-ramekins-culinary-school-wedding-sonoma-ca/`,
`/triple-s-ranch-wedding-wedding-inspiration/`,
`/devin-neda-kiana-lodge-seattle-wedding-photographer-2/`,
`/brett-and-cassi-seattle-wedding-kerry-park/`,
`/jared-rachel-maplehurst-farm-wedding-seattle-wedding-photographer/`,
`/wildwood-acres-resort-wedding/`,
`/vanessa-aidan-ralston-white-retreat-wedding-mill-valley/`,
`/kane-melissa-the-saratoga-springs-mount-pleasant-nc-wedding/`,
`/santa-clara-mission-san-jose-country-club-wedding/`,
`/courtney-stockton-photography-los-altos-wedding-photographer/`

Proposals: `/proposal-at-castello-di-amorosa-napa-valley-proposal-photographer/`,
`/karly-charbel-castello-di-amorosa-proposal/`

Engagements/couples: `/holly-joe-seattle-engagement-session/`,
`/natalie-andrew-san-francisco-engagement-session/`,
`/san-francisco-engagement-photographer-sunil-latika/`,
`/emily-michael-yountville-engagement-session/`,
`/hilary-kevin-bodega-bay-engagement-session/`,
`/samantha-austin-sonoma-engagement-session/`,
`/juliet-eli-st-helena-engagement-session/`,
`/aaron-and-mckenna-sonoma-engagement-session/`,
`/amy-ross-napa-engagement-photos/`,
`/tyler-kristina-sonoma-engagement-photographer/`,
`/jordan-scott-napa-engagement/`,
`/eldon-gina-sonoma-engagement-photos/`,
`/cory-natalie-engagement-olympias-valley-estate/`

Portraits/family/seniors/lifestyle: `/jordan-and-scott/`, `/eileen/`,
`/hickman-family-sonoma-county-family-photographer/`,
`/napa-family-photographer-briella-and-mia-castello-di-amorosa/`,
`/amanda-santa-rosa-senior-portrait-photographer/`,
`/shelby-santa-rosa-high-school-senior-portrait-photographer/`,
`/hannah-santa-rosa-senior-portrait-kendall-jackson-wine-center/`,
`/julia-napa-lifestyle-portraiture/`,
`/sara-lake-berryessa-napa-portrait-photographer-2/`

Because the build environment could not crawl the live site, **post bodies,
photographs, and publish dates could not be migrated automatically**. Two
safety nets cover the gap:

1. Every slug above lives in `src/lib/legacy-posts.json`; until a post with
   that slug is published, its URL issues a temporary (307) redirect to the
   most relevant section instead of a 404, so links and rankings hold.
2. `docs/seed/legacy-posts.ndjson` pre-creates each post as a CMS draft with
   its original slug, title and category; publishing one restores the URL
   in place. See `docs/FOR-COURTNEY.md` for the workflow.

## Verified business facts

- Wedding & portrait photographer; shooting weddings since 2012; studied at Academy of Art
- Based in Sonoma County wine country (Windsor, CA in newest copy); available worldwide;
  Seattle is her favorite place — no travel fee for Seattle bookings
- Husband Joey — winemaker (chardonnay) who second-shoots weddings
- Shoots digital and film — "film has a way of slowing everything down and turning
  real moments into something that feels like memory"
- Positioning: "Timeless, editorial wedding and family photography in Sonoma, Napa & Wine Country"
- Style copy: "playful yet sophisticated, modern yet timeless"; "drawn to real moments,
  real light, and real connection"; "blends gentle direction with documentary storytelling"
- Email: courtney@courtneystockton.com
- Instagram @courtney_stockton · Facebook @courtneystocktonphotography · Pinterest courtney_stockton
- No public pricing exists anywhere — the site must not show pricing until Courtney adds it

## Verified testimonials (with sources)

1. "If there was a photographer fairy, Courtney Stockton would be it… She floats through
   the venue capturing each detail. She makes you feel beautiful and hides all those
   not-so-attractive angles. I still obsess over every photo." — wedding client (appears
   on the current site's information page; longer variant on Yelp)
2. "Working with Courtney (and her husband, who was our second photographer) was one of
   the easiest parts of our wedding." — wedding client (Yelp / The Knot)
3. "We are obsessed with all the photos and the way that Courtney and Joey captured so
   many special moments on our day." — wedding client (Yelp / WeddingWire)

Ratings: WeddingWire 5.0 (18 reviews), Yelp 5.0 (17 reviews).

## Venues photographed (VERIFIED via post titles)

Sonoma County: Trentadue Winery, Barndiva, New Tree Ranch, Trione Winery, Imagery
Estate Winery, Annadel Estate Winery, Paradise Ridge Winery, Viansa Winery, Kenwood
Ranch of Sonoma, Ramekins (×3), Fairmont Sonoma Mission Inn & Sonoma Golf Club,
Kendall-Jackson Wine Center. Napa County: Meritage Resort & Spa (×3), CIA Greystone,
Hans Fahden Winery, Triple S Ranch, Castello di Amorosa, Tra Vigne. Also: Lajour
Estate Winery (Lake County), Ralston White Retreat, Wildwood Acres, Olympia's Valley
Estate, Kiana Lodge, Kerry Park, Maplehurst Farm, and more — full list in the post URLs.
