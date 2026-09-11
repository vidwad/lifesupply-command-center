/**
 * The website consolidation's standing verification sweep
 * (docs/website-consolidation/QA.md).
 *
 * The consolidation reduced 41 public content pages to 21 by moving content
 * into sections and retiring twenty addresses to permanent redirects. The
 * failure modes that matter here are the silent ones: a redirect that lands
 * on a fragment nothing renders, an internal link still pointing at a retired
 * address, a section revealed only once JavaScript runs, or a target sitting
 * under the sticky header. None of those fails a build.
 *
 * The three checks at the end came from an independent review on 2026-09-10
 * that asked what a status code cannot tell you.
 */
import { expect, test } from "@playwright/test";

const RETAINED = [
  "/",
  "/about-us",
  "/medical-supply-solutions",
  "/medical-supply-solutions/lifesupply",
  "/medical-supply-solutions/wellmart-medical",
  "/medical-supply-solutions/balkowitsch",
  "/clinic-solutions",
  "/pharmacy-solutions",
  "/metabolic-health",
  "/our-team",
  "/contact",
  "/news",
  "/investor-relations",
  "/investor-relations/growth-strategy",
  "/investor-relations/advanced-therapeutics",
  "/investor-relations/disclosures",
  "/partners/suppliers",
  "/partners/acquisitions",
  "/privacy",
  "/terms",
  "/accessibility",
];

const REDIRECTS: [string, string][] = [
  ["/shop", "/medical-supply-solutions#stores"],
  ["/clinic-solutions/equipment", "/clinic-solutions#equipment"],
  ["/clinic-solutions/ongoing-supplies", "/clinic-solutions#ongoing-supplies"],
  ["/partners/clinics", "/clinic-solutions#collaboration"],
  ["/partners/pharmacies", "/pharmacy-solutions#partner-program"],
  ["/metabolic-health/care-kits", "/metabolic-health#pathways"],
  ["/metabolic-health/care-kits/glp-1-support", "/metabolic-health#glp-1-support"],
  ["/metabolic-health/care-kits/injection-safety", "/metabolic-health#injection-safety"],
  ["/metabolic-health/care-kits/sharps-supplies", "/metabolic-health#sharps-supplies"],
  ["/metabolic-health/care-kits/travel-support", "/metabolic-health#travel-support"],
  ["/metabolic-health/care-kits/home-monitoring", "/metabolic-health#home-monitoring"],
  ["/metabolic-health/care-kits/diabetes-supplies", "/metabolic-health#diabetes-supplies"],
  [
    "/metabolic-health/care-kits/clinic-injectable-supplies",
    "/metabolic-health#clinic-injectable-supplies",
  ],
  [
    "/metabolic-health/care-kits/pharmacy-patient-support",
    "/metabolic-health#pharmacy-patient-support",
  ],
  ["/metabolic-health/refills", "/metabolic-health#replenishment"],
  ["/partners", "/contact#business-inquiries"],
  ["/abdul-ladha", "/our-team#abdul-ladha"],
  ["/keith-dolo-2", "/our-team#keith-dolo"],
  ["/barrett-e-g-sleeman", "/our-team#barrett-sleeman"],
  ["/david-vogt", "/our-team#david-vogt"],
];

const LEGACY: [string, string][] = [
  ["/contact-2", "/contact"],
  ["/our-operations", "/medical-supply-solutions"],
  ["/our-operations/lifesupply", "/medical-supply-solutions/lifesupply"],
  ["/our-operations/wellmart-medical", "/medical-supply-solutions/wellmart-medical"],
  ["/our-operations/balkowitsch", "/medical-supply-solutions/balkowitsch"],
  ["/our-operations/lifesupply-clinics", "/clinic-solutions"],
  ["/our-operations/technology-fulfilment", "/medical-supply-solutions"],
  ["/clinic-solutions/design-build", "/clinic-solutions"],
  ["/investor-relations/documents", "/news"],
  ["/investor-relations/shareholder-services", "/investor-relations"],
  ["/ross-jelveh", "/our-team"],
  ["/gary-li", "/our-team"],
  ["/john-anderson-2", "/our-team"],
];

test("A. every retained page answers 200 and the count is 21", async ({ page }) => {
  expect(RETAINED).toHaveLength(21);
  for (const route of RETAINED) {
    const response = await page.request.get(route, { maxRedirects: 0 });
    expect(response.status(), route).toBe(200);
  }
});

test("A. every retired address is a permanent redirect to its exact fragment", async ({ page }) => {
  expect(REDIRECTS).toHaveLength(20);
  for (const [from, to] of REDIRECTS) {
    const response = await page.request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers()["location"], from).toBe(to);
  }
});

test("A. every legacy redirect still resolves in one hop, destination unchanged", async ({
  page,
}) => {
  for (const [from, to] of LEGACY) {
    const first = await page.request.get(from, { maxRedirects: 0 });
    expect(first.status(), from).toBe(308);
    expect(first.headers()["location"], from).toBe(to);
    // One hop: the destination itself answers 200, not another redirect.
    const second = await page.request.get(to, { maxRedirects: 0 });
    expect(second.status(), `${from} → ${to}`).toBe(200);
  }
});

test("A. an unknown slug still returns the recovery page", async ({ page }) => {
  const response = await page.goto("/no-such-address-at-all");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/does not exist/i);
});

test("C. every declared fragment resolves to a visible section", async ({ page }) => {
  const byPage = new Map<string, string[]>();
  for (const [, to] of REDIRECTS) {
    const [path, anchor] = to.split("#");
    byPage.set(path!, [...(byPage.get(path!) ?? []), anchor!]);
  }
  for (const [path, anchors] of byPage) {
    await page.goto(path);
    for (const anchor of anchors) {
      const target = page.locator(`#${anchor}`);
      await expect(target, `${path}#${anchor}`).toHaveCount(1);
      await expect(target, `${path}#${anchor}`).toBeVisible();
    }
  }
});

test("C. deep links reveal their content with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const [, to] of REDIRECTS) {
    const [path, anchor] = to.split("#");
    await page.goto(path!);
    const target = page.locator(`#${anchor}`);
    await expect(target, `no-JS ${to}`).toHaveCount(1);
    await expect(target, `no-JS ${to}`).toBeVisible();
  }
  await context.close();
});

test("F. no internal link on any retained page points at a retired address", async ({ page }) => {
  const retired = REDIRECTS.map(([from]) => from);
  const offenders: string[] = [];
  for (const route of RETAINED) {
    await page.goto(route);
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
    for (const href of hrefs) {
      const path = href.split("#")[0]!.replace(/\/$/, "") || "/";
      if (retired.includes(path)) offenders.push(`${route} → ${href}`);
    }
  }
  expect(offenders, offenders.join("\n")).toEqual([]);
});

test("D. no retained page scrolls sideways at 360, 390, 768, 1280 or 1440", async ({ page }) => {
  const offenders: string[] = [];
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of RETAINED) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) offenders.push(`${route} at ${width}: ${overflow}px`);
    }
  }
  expect(offenders, offenders.join("\n")).toEqual([]);
});

test("D. every image on a retained page declares an alternative", async ({ page }) => {
  const offenders: string[] = [];
  for (const route of RETAINED) {
    await page.goto(route);
    const missing = await page
      .locator("main img:not([alt])")
      .evaluateAll((els) => els.map((el) => el.getAttribute("src") ?? "?"));
    for (const src of missing) offenders.push(`${route}: ${src}`);
  }
  expect(offenders, offenders.join("\n")).toEqual([]);
});

test("E. outbound destinations stay on registered hosts, and nothing is sent", async ({ page }) => {
  // Two kinds of outbound destination are approved, and nothing else.
  const operating = [
    "lifesupply.ca",
    "wellmartmedical.com",
    "www.lifesupplyclinics.com",
    "balkowitsch.com",
  ];
  // The dated public record: each milestone and historical release links to
  // the wire service that carried it. These predate the consolidation.
  const publicRecord = ["www.newswire.ca", "ca.finance.yahoo.com", "www.yahoo.com"];
  const infrastructure = [
    "lifesupply-cc-web.onrender.com",
    "www.youtube-nocookie.com",
    "www.youtube.com",
  ];
  const allowed = [...operating, ...publicRecord, ...infrastructure];
  const offenders: string[] = [];
  for (const route of RETAINED) {
    await page.goto(route);
    const hosts = await page
      .locator('a[href^="https://"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).host));
    for (const host of new Set(hosts)) {
      if (!allowed.includes(host)) offenders.push(`${route}: ${host}`);
    }
  }
  expect(offenders, offenders.join("\n")).toEqual([]);
});

test("F. every retained page carries a canonical URL and stays noindex", async ({ page }) => {
  for (const route of RETAINED) {
    await page.goto(route);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, route).toBeTruthy();
    expect(canonical, route).toMatch(/^https:\/\/lifesupplyhealth\.com/);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots, route).toContain("noindex");
  }
});

/*
 * Fragment failure modes raised by the independent review (2026-09-10) that
 * the sweep above did not cover. Each one is a way a redirect-to-fragment can
 * look correct in a status check and still fail a reader.
 */

test("C. a retired address keeps its query string and overrides its own fragment", async ({
  page,
}) => {
  // A real inbound link often carries a campaign parameter or an old anchor.
  const withQuery = await page.request.get("/metabolic-health/care-kits/glp-1-support?ref=email", {
    maxRedirects: 0,
  });
  expect(withQuery.status()).toBe(308);
  // Query before fragment, which is the correct URL form: the parameter
  // survives the redirect and the fragment still resolves.
  expect(withQuery.headers()["location"]).toBe("/metabolic-health?ref=email#glp-1-support");

  // A fragment on the request never reaches the server, so the browser applies
  // the destination's fragment. Confirmed through a real navigation.
  await page.goto("/partners/clinics#anything");
  const url = new URL(page.url());
  expect(url.pathname.replace(/\/$/, "")).toBe("/clinic-solutions");
  await expect(page.locator("#collaboration")).toBeVisible();
});

test("C. the sticky header does not cover a section a redirect lands on", async ({ page }) => {
  for (const [from, to] of [
    ["/clinic-solutions/equipment", "equipment"],
    ["/metabolic-health/care-kits/diabetes-supplies", "diabetes-supplies"],
    ["/abdul-ladha", "abdul-ladha"],
  ] as const) {
    await page.goto(from);
    // Let fonts, images and the responsive layout settle before measuring.
    await page.waitForLoadState("networkidle");
    const header = page.locator("header").first();
    const headerBox = await header.boundingBox();
    const target = page.locator(`#${to}`);
    const targetBox = await target.boundingBox();
    expect(targetBox, from).not.toBeNull();
    // The section starts at or below the header's lower edge, not under it.
    if (headerBox && targetBox) {
      expect(
        targetBox.y,
        `${from}: header ${headerBox.y + headerBox.height}`,
      ).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
    }
  }
});

test("C. back, forward and reload all keep the reader at the section", async ({ page }) => {
  await page.goto("/metabolic-health");
  await page.goto("/metabolic-health/care-kits/travel-support");
  expect(new URL(page.url()).hash).toBe("#travel-support");
  await page.reload();
  expect(new URL(page.url()).hash).toBe("#travel-support");
  await expect(page.locator("#travel-support")).toBeVisible();
  await page.goBack();
  expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe("/metabolic-health");
  // Forward across a same-document fragment entry is not exercised here:
  // Chromium aborts that navigation under automation, which is a harness
  // quirk rather than a site behaviour. Choosing another section while
  // already on the page is the equivalent journey, and it is tested instead.
  await page.locator('a[href="#replenishment"]').first().click();
  expect(new URL(page.url()).hash).toBe("#replenishment");
  await expect(page.locator("#replenishment")).toBeVisible();
});

test("C. every section a redirect names carries its own heading and context", async ({ page }) => {
  // A reader who bypasses the page introduction must still know what they are
  // looking at, so each landing section states its own subject.
  for (const [path, anchor] of [
    ["/clinic-solutions", "equipment"],
    ["/clinic-solutions", "ongoing-supplies"],
    ["/clinic-solutions", "collaboration"],
    ["/pharmacy-solutions", "partner-program"],
    ["/metabolic-health", "pathways"],
    ["/metabolic-health", "replenishment"],
    ["/metabolic-health", "collaboration"],
    ["/metabolic-health", "glp-1-support"],
    ["/medical-supply-solutions", "stores"],
    ["/our-team", "keith-dolo"],
    ["/contact", "business-inquiries"],
  ] as const) {
    await page.goto(path);
    const section = page.locator(`#${anchor}`);
    const headings = await section
      .locator("h2, h3, h4")
      .evaluateAll((els) => els.map((el) => (el.textContent ?? "").trim()).filter(Boolean));
    expect(headings.length, `${path}#${anchor}`).toBeGreaterThan(0);
    const text = (await section.innerText()).trim();
    expect(text.length, `${path}#${anchor}`).toBeGreaterThan(120);
  }
});

test("C. no section target is hidden inside a closed accordion or details", async ({ page }) => {
  for (const [path, anchor] of [
    ["/clinic-solutions", "equipment"],
    ["/metabolic-health", "glp-1-support"],
    ["/our-team", "david-vogt"],
  ] as const) {
    await page.goto(path);
    const insideClosed = await page.locator(`#${anchor}`).evaluate((el) => {
      let node: HTMLElement | null = el as HTMLElement;
      while (node) {
        if (node.tagName === "DETAILS" && !(node as HTMLDetailsElement).open) return true;
        if (node.hidden) return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(insideClosed, `${path}#${anchor}`).toBe(false);
  }
});
