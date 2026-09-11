import { chromium } from "playwright";

/**
 * Round four acceptance sweep.
 *
 * Structural grid, then every acceptance condition the round-four brief names,
 * walked as a visitor would. Two rules learned the hard way and kept here:
 * accordions and disclosures are expanded before their content is judged, and
 * the hero is tested with JavaScript disabled so an entrance animation is never
 * mistaken for a rendering failure.
 *
 * `textContent`, not `innerText`: the display face is uppercased in CSS, and
 * innerText reports the transformed text.
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
  "/", "/about-us", "/medical-supply-solutions", "/medical-supply-solutions/lifesupply",
  "/clinic-solutions", "/clinic-solutions/ongoing-supplies", "/pharmacy-solutions",
  "/metabolic-health", "/metabolic-health/care-kits", "/metabolic-health/refills",
  "/partners", "/partners/pharmacies", "/investor-relations",
  "/investor-relations/growth-strategy", "/investor-relations/disclosures",
  "/news", "/our-team", "/contact", "/privacy", "/accessibility",
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
    if (!res || !res.ok()) { note(`STATUS ${w} ${route} ${res ? res.status() : "none"}`); continue; }
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

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const text = async (route) => {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  return (await page.locator("main").evaluate((n) => n.textContent ?? "")).replace(/\s+/g, " ");
};

// ------------------------------------------------- change 2: hero without JavaScript
const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
for (const route of ["/", "/about-us", "/metabolic-health", "/contact"]) {
  const p = await noJs.newPage();
  await p.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  const bad = await p.evaluate(() => {
    const section = document.querySelector("main h1")?.closest("section");
    if (!section) return "no hero";
    const hidden = [...section.querySelectorAll("*")].filter((el) => {
      const s = getComputedStyle(el);
      return (el.textContent ?? "").trim().length > 0 && (s.opacity === "0" || s.visibility === "hidden");
    }).length;
    const h1 = document.querySelector("main h1");
    return hidden > 0 || !h1?.textContent?.trim() ? `hidden=${hidden}` : null;
  });
  if (bad) note(`CHANGE2 ${route} hero not visible without JS (${bad})`);
  await p.close();
}
await noJs.close();

// ------------------------------------------------- change 1: no adjacent repetition
const home = await text("/");
const h2s = await page.locator("main h2").evaluateAll((n) => n.map((x) => x.textContent.trim()));
if (h2s.filter((h) => /operating|four (operating )?(websites|businesses)/i.test(h)).length > 1) {
  note(`CHANGE1 more than one homepage section titled around operating businesses: ${h2s.join(" | ")}`);
}
if (/Four operating websites sit under one/.test(home)) note("CHANGE1 old group statement still present");

// ------------------------------------------------- change 3: model, closed then open
await page.goto(`${BASE}/metabolic-health`, { waitUntil: "networkidle" });
const details = page.locator("main details").first();
if ((await details.count()) === 0) note("CHANGE3 no disclosure on the commercial model");
else {
  const openByDefault = await details.evaluate((d) => d.hasAttribute("open"));
  if (openByDefault) note("CHANGE3 disclosure is open by default");
  await details.locator("summary").click();
  await page.waitForTimeout(250);
  const cols = await page.locator("main details table thead th").evaluateAll((n) => n.length);
  if (cols !== 4) note(`CHANGE3 expected 4 detail columns, found ${cols}`);
  const summaryLabels = await page.locator("main dt").evaluateAll((n) => n.map((x) => x.textContent.trim()));
  for (const required of ["Contracting party", "What is provided", "Status"]) {
    if (!summaryLabels.includes(required)) note(`CHANGE3 summary missing ${required}`);
  }
}

// ------------------------------------------------- change 4: relationship and status
const metabolic = await text("/metabolic-health");
if (/one commercial relationship/i.test(metabolic)) note("CHANGE4 'one commercial relationship' still present");
if (!/not one contract, not one account/i.test(metabolic)) note("CHANGE4 coordination wording missing");
if (/status reporting/i.test(metabolic)) note("CHANGE4 reporting promise still present");

// ------------------------------------------------- change 5: supplies focus
const supplies = await text("/clinic-solutions/ongoing-supplies");
if (/attributes no construction work|a consultation is not a contracted project/i.test(supplies)) {
  note("CHANGE5 project qualifications still on the supplies page");
}
if (!/separate service for British Columbia projects/i.test(supplies)) note("CHANGE5 project pointer missing");

// ------------------------------------------------- change 6: investor opening
const ir = await text("/investor-relations");
if (!/sells health, safety, medical and industrial products online/i.test(ir)) note("CHANGE6 investor opening does not lead with the business");
if (/disclosed information, forward-looking statements/i.test(ir)) note("CHANGE6 access policy still opens the section");

// ------------------------------------------------- change 7: contact order and labels
await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
const contactOrder = await page.locator("main h2, main h3").evaluateAll((n) => n.slice(0, 4).map((x) => x.textContent.trim()));
if (/what to include/i.test(contactOrder[1] ?? "")) note("CHANGE7 preparation guidance still precedes the choices");
const behaviours = await page.locator("main li").evaluateAll((n) =>
  n.map((x) => (x.textContent ?? "").replace(/\s+/g, " ")).filter((t) => /Opens (an email|lifesupplyclinics)/.test(t)),
);
if (behaviours.length < 5) note(`CHANGE7 only ${behaviours.length} choices label their behaviour`);
const externalLabelled = behaviours.filter((t) => /Opens lifesupplyclinics\.com/.test(t)).length;
if (externalLabelled !== 2) note(`CHANGE7 expected 2 external-page labels, found ${externalLabelled}`);

// ------------------------------------------------- change 8: timeline order
await page.goto(`${BASE}/about-us`, { waitUntil: "networkidle" });
const keys = await page.locator("main ol li").evaluateAll((n) =>
  n.map((x) => (x.querySelector("p")?.textContent ?? "").trim()).filter(Boolean),
);
const YEAR = (s) => Number((s.match(/(19|20)\d\d/) ?? [0])[0]);
const years = keys.map(YEAR).filter(Boolean);
if (years.some((y, i) => i > 0 && y < years[i - 1])) note(`CHANGE8 milestones out of order: ${keys.join(" >> ")}`);
const about = await text("/about-us");
if (!/cumulatively since inception, not a count of current customers/i.test(about)) note("CHANGE8 cumulative clause missing");

// ------------------------------------------------- change 9: resources
const news = await text("/news");
if (/Open to anyone, with its date and version shown/i.test(news)) note("CHANGE9 empty access-class tiles still present");
if (!/None is downloadable here/i.test(news)) note("CHANGE9 download honesty line missing");

// ------------------------------------------------- preserved improvements
for (const [route, pattern, label] of [
  ["/medical-supply-solutions", /Shop\s+LifeSupply/i, "direct store buttons"],
  ["/medical-supply-solutions", /supply review/i, "professional procurement"],
  ["/investor-relations/disclosures", /Currency: Canadian dollars/i, "currency label"],
  ["/contact", /Wellmart Health Supplies Ltd\./, "subsidiary distinction"],
  ["/metabolic-health", /Who buys what/i, "commercial model placement"],
  ["/investor-relations/growth-strategy", /Design and de-risk/i, "execution sequence"],
  ["/pharmacy-solutions", /Supplying pharmacies and running one/i, "pharmacy distinction"],
  ["/news", /What LifeSupply is, in one place/i, "company at a glance"],
]) {
  const body = await text(route);
  if (!pattern.test(body)) note(`PRESERVED lost: ${label} (${route})`);
}

// The GLP-1 answers, expanded by click, must survive untouched.
await page.goto(`${BASE}/metabolic-health/care-kits/glp-1-support`, { waitUntil: "networkidle" });
const triggers = page.locator("main [aria-expanded]");
let compatibilityAnswered = false;
for (let i = 0; i < (await triggers.count()); i += 1) {
  const t = triggers.nth(i);
  if ((await t.getAttribute("aria-expanded")) === "false") await t.click();
  await page.waitForTimeout(250);
  const id = await t.getAttribute("aria-controls");
  const answer = id ? ((await page.locator(`#${id}`).textContent()) ?? "") : "";
  if (/No accessory is universal/i.test(answer)) compatibilityAnswered = true;
}
if (!compatibilityAnswered) note("PRESERVED the GLP-1 compatibility answer is gone or unreachable");

// ------------------------------------------------- keyboard, motion, links, metadata
await page.goto(`${BASE}/about-us`, { waitUntil: "networkidle" });
for (let i = 0; i < 8; i += 1) {
  await page.keyboard.press("Tab");
  const ok = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return true;
    const s = getComputedStyle(el);
    return s.outlineStyle !== "none" || s.boxShadow !== "none" || /focus/.test(el.className.toString());
  });
  if (!ok) note(`FOCUS tab ${i + 1}`);
}
const trigger = page.locator('button[aria-controls="lsh-menu-investors"]');
await trigger.click();
if ((await trigger.getAttribute("aria-expanded")) !== "true") note("MENU did not open");
await page.keyboard.press("Escape");
if ((await trigger.getAttribute("aria-expanded")) !== "false") note("MENU did not close on Escape");

/*
 * Pathway links by keyboard and by click.
 *
 * Two things this must get right, both of which produced a false finding on
 * the first run. The catalogue renders a table from `lg` up and cards below,
 * from the same data, so the first link in the DOM is hidden at desktop width
 * and cannot take focus: filter to the visible one. And a navigation has to be
 * awaited alongside the keypress, not after it, or the URL is read before the
 * browser has moved and a working link looks broken.
 */
for (const [width, how] of [
  [1280, "keyboard"],
  [1280, "click"],
  [390, "click"],
]) {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  await p.goto(`${BASE}/metabolic-health/care-kits`, { waitUntil: "networkidle" });
  const link = p
    .locator('main a[href^="/metabolic-health/care-kits/"]')
    .filter({ visible: true })
    .first();
  const href = await link.getAttribute("href");
  let navigated = true;
  await Promise.all([
    p
      .waitForURL((u) => u.pathname.startsWith("/metabolic-health/care-kits/"), { timeout: 8000 })
      .catch(() => {
        navigated = false;
      }),
    how === "keyboard" ? link.focus().then(() => p.keyboard.press("Enter")) : link.click(),
  ]);
  if (!navigated) note(`PATHWAY ${width} by ${how}: ${href} did not follow`);
  await p.close();
}

const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await rm.newPage();
for (const route of ["/", "/about-us", "/metabolic-health", "/contact", "/news"]) {
  await rp.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await rp.waitForTimeout(800);
  const bad = await rp.evaluate(() =>
    [...document.querySelectorAll("main *")].filter((el) => {
      const s = getComputedStyle(el);
      const t = (el.textContent ?? "").trim().length > 0;
      return t && el.getAttribute("aria-hidden") !== "true" && (s.opacity === "0" || s.filter.includes("blur"));
    }).length,
  );
  if (bad) note(`REDUCEDMOTION ${route} ${bad}`);
}

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const externals = [...new Set(await page.locator('a[href^="https://"]').evaluateAll((ls) => ls.map((l) => l.href)))];
for (const url of externals.slice(0, 8)) {
  try {
    const r = await page.request.get(url, { timeout: 20000, maxRedirects: 5 });
    if (r.status() >= 400) note(`EXTERNAL ${url} ${r.status()}`);
  } catch (e) {
    note(`EXTERNAL ${url} ${String(e).slice(0, 40)}`);
  }
}
await browser.close();

const sm = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text()).catch(() => "");
if (!sm.includes("<urlset")) note("SITEMAP not a urlset");
const rb = await fetch(`${BASE}/robots.txt`).then((r) => r.text()).catch(() => "");
if (!/Disallow: \//.test(rb)) note(`ROBOTSTXT ${rb.slice(0, 60)}`);

console.log(problems.length ? problems.join("\n") : "ROUND FOUR QA CLEAN");
console.log(
  `${ROUTES.length} routes at ${WIDTHS.length} widths, nine acceptance conditions, hero without JavaScript, preserved improvements, keyboard, reduced motion, external links, sitemap and robots`,
);
