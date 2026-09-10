import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const WIDTHS = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1280, 800],
  [1440, 900],
];
const ROUTES = [
  "/", "/about-us", "/medical-supply-solutions", "/medical-supply-solutions/lifesupply",
  "/clinic-solutions", "/clinic-solutions/ongoing-supplies", "/pharmacy-solutions",
  "/metabolic-health", "/metabolic-health/care-kits", "/metabolic-health/refills",
  "/partners", "/partners/pharmacies", "/investor-relations",
  "/investor-relations/growth-strategy", "/investor-relations/disclosures",
  "/news", "/our-team", "/contact", "/privacy", "/accessibility",
];

const problems = [];
const browser = await chromium.launch();

for (const [w, h] of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    if (!res || !res.ok()) { problems.push(`STATUS ${w} ${route} ${res ? res.status() : "none"}`); continue; }
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const levels = [...document.querySelectorAll("main h1,main h2,main h3,main h4")].map((e) => Number(e.tagName[1]));
      let jump = null;
      for (let i = 1; i < levels.length; i += 1) if (levels[i] - levels[i - 1] > 1) { jump = `h${levels[i - 1]}->h${levels[i]}`; break; }
      const blurred = [...document.querySelectorAll("main *")].filter((el) => {
        const f = getComputedStyle(el).filter;
        return f && f.includes("blur") && (el.textContent ?? "").trim().length > 0;
      }).length;
      return {
        overflow: document.documentElement.scrollWidth - vw,
        h1: document.querySelectorAll("main h1").length,
        jump,
        noAlt: [...document.querySelectorAll("main img")].filter((i) => i.getAttribute("alt") === null).length,
        unnamed: [...document.querySelectorAll("a")].filter((a) => !a.textContent.trim() && !a.getAttribute("aria-label")).length,
        thirdParty: [...document.scripts].map((s) => s.src).filter((s) => s && !s.startsWith(location.origin)),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "missing",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
        title: document.title,
        desc: !!document.querySelector('meta[name="description"]'),
        og: !!document.querySelector('meta[property="og:title"]'),
        forms: document.querySelectorAll("main form").length,
        blurred,
      };
    });
    if (r.overflow > 1) problems.push(`OVERFLOW ${w} ${route} ${r.overflow}px`);
    if (r.h1 !== 1) problems.push(`H1 ${w} ${route} ${r.h1}`);
    if (r.jump) problems.push(`HEADING ${w} ${route} ${r.jump}`);
    if (r.noAlt) problems.push(`ALT ${w} ${route} ${r.noAlt}`);
    if (r.unnamed) problems.push(`LINKNAME ${w} ${route} ${r.unnamed}`);
    if (r.thirdParty.length) problems.push(`THIRDPARTY ${w} ${route} ${r.thirdParty}`);
    if (r.forms) problems.push(`FORM ${w} ${route} ${r.forms}`);
    if (r.blurred) problems.push(`BLURTEXT ${w} ${route} ${r.blurred}`);
    if (w === 1440) {
      if (!/noindex/.test(r.robots)) problems.push(`ROBOTS ${route} ${r.robots}`);
      if (!r.canonical) problems.push(`CANONICAL ${route}`);
      if (!r.title || r.title.length < 5) problems.push(`TITLE ${route} ${r.title}`);
      if (!r.desc) problems.push(`DESC ${route}`);
      if (!r.og) problems.push(`OG ${route}`);
    }
  }
  await ctx.close();
}

// Keyboard: focus visibility, dropdown open and Escape.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/about-us`, { waitUntil: "networkidle" });
for (let i = 0; i < 8; i += 1) {
  await page.keyboard.press("Tab");
  const ok = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return true;
    const s = getComputedStyle(el);
    return s.outlineStyle !== "none" || s.boxShadow !== "none" || /focus/.test(el.className.toString());
  });
  if (!ok) problems.push(`FOCUS tab ${i + 1}`);
}
const trigger = page.locator('button[aria-controls="lsh-menu-investors"]');
await trigger.click();
if ((await trigger.getAttribute("aria-expanded")) !== "true") problems.push("MENU did not open");
await page.keyboard.press("Escape");
if ((await trigger.getAttribute("aria-expanded")) !== "false") problems.push("MENU did not close on Escape");

// Reduced motion: nothing left invisible or blurred.
const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await rm.newPage();
for (const route of ["/", "/about-us", "/metabolic-health/care-kits", "/investor-relations/growth-strategy"]) {
  await rp.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await rp.waitForTimeout(800);
  const bad = await rp.evaluate(() =>
    [...document.querySelectorAll("main *")].filter((el) => {
      const s = getComputedStyle(el);
      const text = (el.textContent ?? "").trim().length > 0;
      return text && el.getAttribute("aria-hidden") !== "true" && (s.opacity === "0" || s.filter.includes("blur"));
    }).length,
  );
  if (bad) problems.push(`REDUCEDMOTION ${route} ${bad}`);
}

// External links resolve.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const externals = [...new Set(await page.locator('a[href^="https://"]').evaluateAll((ls) => ls.map((l) => l.href)))];
for (const url of externals.slice(0, 8)) {
  try {
    const r = await page.request.get(url, { timeout: 20000, maxRedirects: 5 });
    if (r.status() >= 400) problems.push(`EXTERNAL ${url} ${r.status()}`);
  } catch (e) {
    problems.push(`EXTERNAL ${url} ${String(e).slice(0, 40)}`);
  }
}
await browser.close();

const sm = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text()).catch(() => "");
if (!sm.includes("<urlset")) problems.push("SITEMAP not a urlset");
const rb = await fetch(`${BASE}/robots.txt`).then((r) => r.text()).catch(() => "");
if (!/Disallow: \//.test(rb)) problems.push(`ROBOTSTXT ${rb.slice(0, 60)}`);

console.log(problems.length ? problems.join("\n") : "ROUND TWO QA CLEAN");
console.log(`${ROUTES.length} routes at ${WIDTHS.length} widths, plus keyboard, reduced motion, external links, sitemap and robots`);
