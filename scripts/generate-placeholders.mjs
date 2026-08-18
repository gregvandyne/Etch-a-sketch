/**
 * Generates the labeled placeholder images used while the Sanity project
 * has no real photographs yet. Each is a quiet, editorial tone-on-tone
 * composition explicitly labeled as a placeholder — never mistaken for
 * (or substituted with) real client photography.
 *
 * Run: node scripts/generate-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "placeholders");
mkdirSync(outDir, { recursive: true });

// Warm wine-country tones — ivory, parchment, taupe, sage, dusty clay.
const palettes = [
  ["#EDE6DA", "#D8CCBA", "#B7A896"],
  ["#E8E2D6", "#CDC3B1", "#A99C86"],
  ["#E5DFD6", "#C9C4B6", "#96917F"],
  ["#EAE2D8", "#D3C2B4", "#AD9686"],
  ["#E7E1D8", "#C4BCAD", "#8F8878"],
  ["#EFE8DC", "#DACDB8", "#C0A88E"],
  ["#E4DCD2", "#C6B8AC", "#9C8A7E"],
  ["#EAE4DA", "#CFC8BB", "#A79F8E"],
];

// name: [width, height]
const sizes = {
  "portrait-1": [1200, 1600],
  "portrait-2": [1200, 1600],
  "portrait-3": [1200, 1600],
  "portrait-4": [1200, 1600],
  "portrait-5": [1200, 1600],
  "portrait-6": [1200, 1600],
  "landscape-1": [1600, 1067],
  "landscape-2": [1600, 1067],
  "landscape-3": [1600, 1067],
  "landscape-4": [1600, 1067],
  "wide-1": [2000, 1125],
  "wide-2": [2000, 1125],
  "square-1": [1400, 1400],
  "square-2": [1400, 1400],
};

function svg(name, w, h, palette, i) {
  const [a, b, c] = palette;
  const cx = 0.3 + ((i * 37) % 40) / 100;
  const cy = 0.25 + ((i * 53) % 45) / 100;
  const r = Math.min(w, h) * (0.32 + ((i * 29) % 20) / 100);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <radialGradient id="s" cx="${cx}" cy="${cy}" r="0.9">
      <stop offset="0" stop-color="${c}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#s)"/>
  <circle cx="${cx * w}" cy="${cy * h}" r="${r}" fill="${c}" opacity="0.18"/>
  <rect x="${w * 0.06}" y="${h * 0.06}" width="${w * 0.88}" height="${h * 0.88}" fill="none" stroke="${c}" stroke-opacity="0.4" stroke-width="2"/>
  <text x="50%" y="50%" text-anchor="middle" fill="#6E6659" font-family="Georgia, serif" font-size="${Math.round(w * 0.026)}" letter-spacing="${Math.round(w * 0.004)}" opacity="0.75">PLACEHOLDER</text>
  <text x="50%" y="${h * 0.5 + w * 0.04}" text-anchor="middle" fill="#6E6659" font-family="Georgia, serif" font-style="italic" font-size="${Math.round(w * 0.018)}" opacity="0.6">Final photograph to be supplied</text>
</svg>`;
}

let i = 0;
for (const [name, [w, h]] of Object.entries(sizes)) {
  const palette = palettes[i % palettes.length];
  writeFileSync(join(outDir, `${name}.svg`), svg(name, w, h, palette, i));
  i += 1;
}
console.log(`Wrote ${i} placeholder images to public/placeholders/`);
