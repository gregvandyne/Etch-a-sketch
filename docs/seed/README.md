# Initial content seed

`seed.ndjson` pre-loads the Sanity dataset with verified starting content so
Courtney begins from a filled-in dashboard instead of a blank one:

- the six blog categories with their **original WordPress slugs** (so old
  `/category/…` URLs keep working the moment posts are assigned)
- site settings (verified email, socials, service areas, tagline)
- the five website-page singletons with launch copy (Courtney edits freely)
- three verified client testimonials (sourced from her existing site and
  public reviews — see `docs/CONTENT-AUDIT.md`)
- venue records for wine-country venues she has verifiably photographed
  (name + location only; Courtney adds photos and descriptions)

Import once, after creating the project:

```bash
npx sanity dataset import docs/seed/seed.ndjson production
```

Photographs are not seeded — they must be uploaded by Courtney, since only
she holds the originals.
