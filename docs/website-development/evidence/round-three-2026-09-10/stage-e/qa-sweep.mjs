import { chromium } from "playwright";

/**
 * Round three acceptance sweep.
 *
 * Two halves. The first is the structural grid inherited from round two: every
 * public route at five widths, checked for overflow, heading structure, alt
 * text, link names, third-party scripts, forms, blurred text and metadata. The
 * second is new: the six priority journeys the round-three brief names, each
 * walked as a visitor would walk it, plus the round-three specific claims.
 */
const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const WIDTHS = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1280, 800],
  [1440, 900],
];
const ROUTES = [
  "/",
  "/about-us",
  "/medical-supply-solutions",
  "/medical-supply-solutions/lifesupply",
  "/clinic-solutions",
  "/clinic-solutions/ongoing-supplies",
  "/pharmacy-solutions",
  "/metabolic-health",
  "/metabolic-health/care-kits",
  "/metabolic-health/refills",
  "/partners",
  "/partners/pharmacies",
  "/investor-relations",
  "/investor-relations/growth-strategy",
  "/investor-relations/disclosures",
  "/news",
  "/our-team",
  "/contact",
  "/privacy",
  "/accessibility",
];

const problems = [];
const note = (m) => problems.push(m);
const browser = await chromium.launch();

// ---------------------------------------------------------------- structural grid
for (const [w, h] of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    if (!res || !res.ok()) {
      note(`STATUS ${w} ${route} ${res ? res.status() : "none"}`);
      continue;
    }
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const levels = [...document.querySelectorAll("main h1,main h2,main h3,main h4")].map((e) =>
        Number(e.tagName[1]),
      );
      let jump = null;
      for (let i = 1; i < levels.length; i += 1)
        if (levels[i] - levels[i - 1] > 1) {
          jump = `h${levels[i - 1]}->h${levels[i]}`;
          break;
        }
      const blurred = [...document.querySelectorAll("main *")].filter((el) => {
        const f = getComputedStyle(el).filter;
        return f && f.includes("blur") && (el.textContent ?? "").trim().length > 0;
      }).length;
      return {
        overflow: document.documentElement.scrollWidth - vw,
        h1: document.querySelectorAll("main h1").length,
        jump,
        noAlt: [...document.querySelectorAll("main img")].filter(
          (i) => i.getAttribute("alt") === null,
        ).length,
        unnamed: [...document.querySelectorAll("a")].filter(
          (a) => !a.textContent.trim() && !a.getAttribute("aria-label"),
        ).length,
        thirdParty: [...document.scripts]
          .map((s) => s.src)
          .filter((s) => s && !s.startsWith(location.origin)),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "missing",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
        title: document.title,
        desc: !!document.querySelector('meta[name="description"]'),
        og: !!document.querySelector('meta[property="og:title"]'),
        forms: document.querySelectorAll("main form").length,
        blurred,
      };
    });
    if (r.overflow > 1) note(`OVERFLOW ${w} ${route} ${r.overflow}px`);
    if (r.h1 !== 1) note(`H1 ${w} ${route} ${r.h1}`);
    if (r.jump) note(`HEADING ${w} ${route} ${r.jump}`);
    if (r.noAlt) note(`ALT ${w} ${route} ${r.noAlt}`);
    if (r.unnamed) note(`LINKNAME ${w} ${route} ${r.unnamed}`);
    if (r.thirdParty.length) note(`THIRDPARTY ${w} ${route} ${r.thirdParty}`);
    if (r.forms) note(`FORM ${w} ${route} ${r.forms}`);
    if (r.blurred) note(`BLURTEXT ${w} ${route} ${r.blurred}`);
    if (w === 1440) {
      if (!/noindex/.test(r.robots)) note(`ROBOTS ${route} ${r.robots}`);
      if (!r.canonical) note(`CANONICAL ${route}`);
      if (!r.title || r.title.length < 5) note(`TITLE ${route} ${r.title}`);
      if (!r.desc) note(`DESC ${route}`);
      if (!r.og) note(`OG ${route}`);
    }
  }
  await ctx.close();
}

// ---------------------------------------------------------------- priority journeys
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
// `textContent`, not `innerText`: the display face is uppercased in CSS, and
// innerText reports the transformed text, so "Operating" reads as "OPERATING".
const text = async (route) => {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  return (await page.locator("main").evaluate((n) => n.textContent ?? "")).replace(/\s+/g, " ");
};

// 1. Homepage to an operating store.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const storeLinks = await page
  .locator('main a[href^="https://"]')
  .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
for (const store of [
  "https://lifesupply.ca/",
  "https://wellmartmedical.com/",
  "https://balkowitsch.com/",
]) {
  if (!storeLinks.some((h) => h && h.startsWith(store)))
    note(`JOURNEY1 homepage has no direct link to ${store}`);
}

// 2. Existing clinic to a procurement inquiry, from the store hub.
const hub = await text("/medical-supply-solutions");
if (!/supply review/i.test(hub)) note("JOURNEY2 no supply review on the store hub");
const cards = await page
  .locator("main article")
  .evaluateAll((nodes) =>
    nodes.map((n) => [...n.querySelectorAll("a")].map((a) => a.getAttribute("href"))),
  );
for (const links of cards) {
  if (!links.some((h) => h && h.startsWith("https://")))
    note("JOURNEY2 a store card does not reach its store");
}
const reviewHref = await page
  .locator('main a[href^="mailto:"]')
  .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
if (!reviewHref.some((h) => h && h.includes("subject=")))
  note("JOURNEY2 procurement route carries no subject");

// 3. Pharmacy to a development discussion, with the two meanings distinguished.
const pharmacy = await text("/pharmacy-solutions");
if (!/supplying pharmacies/i.test(pharmacy))
  note("JOURNEY3 pharmacy page does not say which business it is");
if (!/running one are different businesses/i.test(pharmacy))
  note("JOURNEY3 the two pharmacy meanings are not distinguished");
const pharmacyMail = await page
  .locator('main a[href^="mailto:"]')
  .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
if (!pharmacyMail.some((h) => h && /subject=Pharmacy/i.test(h)))
  note("JOURNEY3 no pharmacy-specific subject");

// 4. Investor to the model and a materials request.
const investors = await text("/investor-relations/disclosures");
for (const required of ["Canadian dollars", "IFRS", "December 31, 2025"]) {
  if (!investors.includes(required)) note(`JOURNEY4 disclosures missing ${required}`);
}
if (/\$\s?\d/.test(investors.replace(/C\$\d[\d.,]*[MK]?/g, "")))
  note("JOURNEY4 an unlabelled dollar figure appears");
const growth = await text("/investor-relations/growth-strategy");
for (const required of [
  "Design and de-risk",
  "Controlled pilot",
  "Launch and integrate",
  "Replicate and scale",
]) {
  if (!growth.includes(required)) note(`JOURNEY4 growth strategy missing ${required}`);
}

// 5. Pathway overview to detail: one catalogue, eight destinations.
await page.goto(`${BASE}/metabolic-health/care-kits`, { waitUntil: "networkidle" });
const kitHrefs = new Set(
  await page
    .locator('main a[href^="/metabolic-health/care-kits/"]')
    .evaluateAll((as) => as.map((a) => a.getAttribute("href"))),
);
if (kitHrefs.size !== 8) note(`JOURNEY5 expected 8 pathway destinations, found ${kitHrefs.size}`);
for (const href of kitHrefs) {
  const r = await page.request.get(`${BASE}${href}`);
  if (!r.ok()) note(`JOURNEY5 ${href} returned ${r.status()}`);
}

// 6. Existing customer to the right store support.
const contact = await text("/contact");
if (!/Contact the store that took the order/i.test(contact))
  note("JOURNEY6 no existing-order route on contact");

// ---------------------------------------------------------------- round-three claims
const architecture = await text("/about-us");
for (const tier of ["Operating", "In development", "Under evaluation"]) {
  if (!architecture.includes(tier)) note(`CLAIMS About is missing the ${tier} tier`);
}
const structure = await text("/contact");
for (const entity of [
  "Wellmart Health Supplies Ltd.",
  "LifeSupply US, Inc.",
  "Balkowitsch Enterprises Inc.",
]) {
  if (!structure.includes(entity)) note(`CLAIMS Contact is missing ${entity}`);
}
const overview = await text("/news");
for (const required of ["C$6.75M", "C$2.20M", "C$284K"]) {
  if (!overview.includes(required)) note(`CLAIMS news overview missing ${required}`);
}
// Withdrawn wording must be gone from every route.
for (const route of ROUTES) {
  const body = await text(route);
  for (const gone of [
    "Currency: not stated",
    "not separate companies",
    "Health Supplies Inc.",
    "governed workflow",
    "author, reviewer, and review date",
    "as published on the prior LifeSupply website",
    "Command Center publication",
    "disclosure context",
  ]) {
    if (body.includes(gone) && !(route === "/privacy" && gone === "Command Center publication")) {
      note(`STALE ${route} still contains "${gone}"`);
    }
  }
}

// Keyboard, reduced motion, outbound links, sitemap, robots.
await page.goto(`${BASE}/about-us`, { waitUntil: "networkidle" });
for (let i = 0; i < 8; i += 1) {
  await page.keyboard.press("Tab");
  const ok = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return true;
    const s = getComputedStyle(el);
    return (
      s.outlineStyle !== "none" || s.boxShadow !== "none" || /focus/.test(el.className.toString())
    );
  });
  if (!ok) note(`FOCUS tab ${i + 1}`);
}
const trigger = page.locator('button[aria-controls="lsh-menu-investors"]');
await trigger.click();
if ((await trigger.getAttribute("aria-expanded")) !== "true") note("MENU did not open");
await page.keyboard.press("Escape");
if ((await trigger.getAttribute("aria-expanded")) !== "false") note("MENU did not close on Escape");

const rm = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const rp = await rm.newPage();
for (const route of [
  "/",
  "/about-us",
  "/metabolic-health/care-kits",
  "/investor-relations/growth-strategy",
  "/news",
]) {
  await rp.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await rp.waitForTimeout(800);
  const bad = await rp.evaluate(
    () =>
      [...document.querySelectorAll("main *")].filter((el) => {
        const s = getComputedStyle(el);
        const t = (el.textContent ?? "").trim().length > 0;
        return (
          t &&
          el.getAttribute("aria-hidden") !== "true" &&
          (s.opacity === "0" || s.filter.includes("blur"))
        );
      }).length,
  );
  if (bad) note(`REDUCEDMOTION ${route} ${bad}`);
}

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const externals = [
  ...new Set(await page.locator('a[href^="https://"]').evaluateAll((ls) => ls.map((l) => l.href))),
];
for (const url of externals.slice(0, 8)) {
  try {
    const r = await page.request.get(url, { timeout: 20000, maxRedirects: 5 });
    if (r.status() >= 400) note(`EXTERNAL ${url} ${r.status()}`);
  } catch (e) {
    note(`EXTERNAL ${url} ${String(e).slice(0, 40)}`);
  }
}
await browser.close();

const sm = await fetch(`${BASE}/sitemap.xml`)
  .then((r) => r.text())
  .catch(() => "");
if (!sm.includes("<urlset")) note("SITEMAP not a urlset");
const rb = await fetch(`${BASE}/robots.txt`)
  .then((r) => r.text())
  .catch(() => "");
if (!/Disallow: \//.test(rb)) note(`ROBOTSTXT ${rb.slice(0, 60)}`);

console.log(problems.length ? problems.join("\n") : "ROUND THREE QA CLEAN");
console.log(
  `${ROUTES.length} routes at ${WIDTHS.length} widths, six priority journeys, round-three claims, stale-copy sweep, keyboard, reduced motion, external links, sitemap and robots`,
);
