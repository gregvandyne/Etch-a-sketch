/**
 * Browser QA sweep: loads every route at mobile + desktop widths and checks
 * status codes, horizontal overflow, broken images, missing alt text,
 * internal links, sitemap/robots/redirects, metadata, JSON-LD, the inquiry
 * form's success and validation states, and keyboard focus.
 *
 * Usage:
 *   npm run build && npm start        (in one terminal)
 *   npm run qa                        (in another; needs `npm i -D playwright`)
 *   QA_BASE_URL=https://preview.example.com npm run qa
 */
import { mkdirSync } from "node:fs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright is not installed. Run: npm install -D playwright");
  process.exit(1);
}

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const OUT = new URL("../qa-shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const routes = [
  ["home", "/"],
  ["galleries", "/galleries"],
  ["weddings", "/weddings"],
  ["wedding-detail", "/weddings/sample-wine-country-wedding"],
  ["engagements", "/engagements"],
  ["families", "/families"],
  ["about", "/about"],
  ["experience", "/experience"],
  ["information", "/information"],
  ["contact", "/contact"],
  ["venues", "/venues"],
  ["venue-detail", "/venues/sample-vineyard-estate"],
  ["blog", "/blog"],
  ["post", "/sample-journal-entry"],
  ["category", "/category/weddings-2"],
  ["service-area", "/sonoma-wedding-photography"],
  ["not-found", "/this-page-does-not-exist-xyz"],
];

const viewports = [
  ["mobile", { width: 390, height: 844 }],
  ["desktop", { width: 1440, height: 900 }],
];

const browser = process.env.QA_CHROMIUM
  ? await chromium.launch({ executablePath: process.env.QA_CHROMIUM })
  : await chromium.launch();

const problems = [];

for (const [vpName, viewport] of viewports) {
  const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${page.url()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`${page.url()}: PAGEERROR ${err.message}`));

  const scrollThrough = async () => {
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      // Let IntersectionObserver callbacks and fades settle before returning.
      await new Promise((r) => setTimeout(r, 900));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
    });
    await page.waitForLoadState("networkidle");
  };

  for (const [name, path] of routes) {
    const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
    await scrollThrough();
    const status = res?.status();
    const expected = name === "not-found" ? 404 : 200;
    if (status !== expected) problems.push(`STATUS ${status} (expected ${expected}) at ${path} [${vpName}]`);

    // Horizontal overflow check
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 1) problems.push(`H-OVERFLOW ${overflow}px at ${path} [${vpName}]`);

    // Broken images
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute("loading") !== "lazy")
        .map((img) => img.src)
    );
    for (const src of broken) problems.push(`BROKEN IMG ${src} at ${path} [${vpName}]`);

    // Missing alt attributes
    const noAlt = await page.evaluate(
      () => [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length
    );
    if (noAlt > 0) problems.push(`${noAlt} imgs missing alt at ${path} [${vpName}]`);

    await page.screenshot({ path: `${OUT}${vpName}-${name}.png`, fullPage: name === "home" || name === "wedding-detail" });
  }

  // Internal link crawl for 404s (desktop only)
  if (vpName === "desktop") {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const links = await page.evaluate(() =>
      [...new Set([...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")))]
    );
    for (const href of links) {
      if (href.startsWith("/api") || href.startsWith("/studio")) continue;
      const r = await page.request.get(BASE + href);
      if (r.status() >= 400) problems.push(`LINK ${r.status()} ${href}`);
    }
  }

  if (consoleErrors.length) problems.push(...consoleErrors.map((e) => `CONSOLE: ${e}`));
  await context.close();
}

// Infrastructure checks
const ctx = await browser.newContext();
const req = ctx.request;
for (const [path, mustContain] of [
  ["/sitemap.xml", "<urlset"],
  ["/robots.txt", "Sitemap:"],
]) {
  const r = await req.get(BASE + path);
  const body = await r.text();
  if (r.status() !== 200 || !body.includes(mustContain)) problems.push(`INFRA ${path} failed (${r.status()})`);
}
// Redirect check
const redir = await req.get(BASE + "/tag/sonoma-county-wedding-photographer", { maxRedirects: 0 }).catch(() => null);
if (!redir || ![301, 308].includes(redir.status())) problems.push(`REDIRECT /tag/... not permanent (${redir?.status()})`);

// Metadata + JSON-LD check on home
const page2 = await ctx.newPage();
await page2.goto(BASE + "/", { waitUntil: "domcontentloaded" });
const meta = await page2.evaluate(() => ({
  title: document.title,
  desc: document.querySelector("meta[name=description]")?.content,
  canonical: document.querySelector("link[rel=canonical]")?.href,
  og: document.querySelector("meta[property='og:title']")?.content,
  jsonLd: [...document.querySelectorAll("script[type='application/ld+json']")].length,
  h1: document.querySelectorAll("h1").length,
}));
console.log("HOME METADATA:", JSON.stringify(meta, null, 1));
if (!meta.title.includes("Sonoma")) problems.push("Home title missing keywords");
if (meta.jsonLd < 1) problems.push("No JSON-LD on home");
if (meta.h1 !== 1) problems.push(`Home has ${meta.h1} h1 elements`);

// Inquiry form smoke test (preview mode: expect success)
await page2.goto(BASE + "/contact", { waitUntil: "networkidle" });
await page2.fill("#inquiry-name", "QA Test");
await page2.fill("#inquiry-email", "qa@example.com");
await page2.fill("#inquiry-message", "This is a QA test message for the inquiry form.");
await new Promise((r) => setTimeout(r, 2600)); // pass the min-fill-time bot check
await page2.click("button[type=submit]");
await page2.waitForTimeout(1500);
const success = await page2.locator("text=Thank you").count();
if (!success) problems.push("Inquiry form did not reach success state");

// Validation errors show when empty
await page2.goto(BASE + "/contact", { waitUntil: "networkidle" });
await page2.click("button[type=submit]");
const errCount = await page2.locator("[role=alert]").count();
if (errCount === 0) problems.push("Inquiry form shows no validation errors when empty");

// Keyboard nav: tab reveals skip link
await page2.goto(BASE + "/", { waitUntil: "networkidle" });
await page2.keyboard.press("Tab");
const focused = await page2.evaluate(() => document.activeElement?.textContent?.trim());
if (focused !== "Skip to content") problems.push(`First tab focus is "${focused}", not skip link`);

await browser.close();

console.log("\n=== QA RESULT ===");
if (problems.length === 0) console.log("ALL CHECKS PASSED");
else {
  console.log(`${problems.length} problems:`);
  for (const p of problems) console.log(" -", p);
}
