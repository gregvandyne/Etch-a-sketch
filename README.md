# Courtney Stockton Photography

Production website and content management system for
[courtneystockton.com](https://courtneystockton.com) — timeless, editorial
wedding and family photography in Sonoma, Napa and Northern California.

- **Site:** Next.js 16 · TypeScript · Tailwind CSS 4 · static generation with
  on-demand revalidation
- **CMS:** Sanity v6, embedded at `/studio` — Courtney manages galleries,
  photographs, blog posts, venues, testimonials, page content and SEO herself,
  with no code or deploys
- **Conversion:** inquiry form with conditional fields, spam protection and
  email delivery; privacy-conscious analytics with content attribution

## Quick start

```bash
npm install
cp .env.example .env.local   # empty values = labeled sample-content mode
npm run dev                   # http://localhost:3000 (Studio at /studio)
```

Without Sanity credentials the site runs in a clearly-labeled preview mode
with sample content and placeholder art — no real business claims are
fabricated.

## Documentation

| Document | Audience |
|---|---|
| [`docs/FOR-COURTNEY.md`](docs/FOR-COURTNEY.md) | Courtney — how to run the site day-to-day |
| [`docs/TECHNICAL.md`](docs/TECHNICAL.md) | Developers — architecture, deployment, env vars |
| [`docs/CONTENT-AUDIT.md`](docs/CONTENT-AUDIT.md) | Content/URL inventory of the previous site + migration map |
| [`docs/seed/`](docs/seed/README.md) | Initial CMS content seed |

> Repository note: this repo predates the rebuild and is still named
> `Etch-a-sketch` on GitHub. The project itself is
> `courtney-stockton-photography`; renaming the repo is a one-click owner
> action in GitHub Settings (old links auto-redirect).
