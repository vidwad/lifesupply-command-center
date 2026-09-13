import { expect, test } from "@playwright/test";

/**
 * The consolidated Medical Supply Solutions page: the three store profiles,
 * the category explorer, the demographic chart, the portal concept, and the
 * section anchors.
 *
 * This file covered the three standalone storefront pages until 2026-09-12,
 * when they became anchored profiles on one page (product owner), and it
 * grew with the page on 2026-09-13 when the page became the commercial
 * explanation of the supply business. What it holds: each store is reachable
 * by its own anchor with a photograph and a shop link and no category list of
 * its own; the explorer carries every category link and filters without
 * taking anything out of the document; the portal concept is labelled as a
 * concept and its views are real tabs; every section anchor lands clear of
 * the sticky bars; and the page never overflows sideways.
 */
const storefronts = [
  { anchor: "lifesupply", name: "LifeSupply", host: "lifesupply.ca" },
  { anchor: "wellmart-medical", name: "Wellmart Medical", host: "wellmartmedical.com" },
  { anchor: "balkowitsch", name: "Balkowitsch Worldwide", host: "balkowitsch.com" },
] as const;

const STORE_HOSTS = ["lifesupply.ca", "wellmartmedical.com", "balkowitsch.com"];

const SECTIONS = [
  "customers",
  "categories",
  "market",
  "stores",
  "professional-buyers",
  "technology",
  "portals",
  "foundation",
  "suppliers",
] as const;

test.describe("Medical Supplies storefront visual system", () => {
  for (const storefront of storefronts) {
    test(`${storefront.anchor} keeps its profile, picture and shop link on the consolidated page`, async ({
      page,
    }) => {
      await page.goto(`/medical-supply-solutions#${storefront.anchor}`);

      const profile = page.locator(`#${storefront.anchor}`);
      await expect(profile).toBeVisible();
      await expect(profile.getByRole("heading", { name: storefront.name })).toBeVisible();
      // A picture that actually decoded, not a frame around a missing file.
      const image = profile.locator("img").first();
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      // The store itself, not a corporate page in between.
      const shop = profile.locator(`a[href^="https://${storefront.host}"]`).first();
      await expect(shop).toBeVisible();
      // The category list left the profile on 2026-09-13; the explorer
      // above carries it, once, for every store.
      await expect(profile.locator("details")).toHaveCount(0);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("the category explorer carries eight categories, each naming its stores and linking to them", async ({
    page,
  }) => {
    await page.goto("/medical-supply-solutions#categories");
    const explorer = page.locator("#categories");
    const tiles = explorer.locator("article");
    await expect(tiles).toHaveCount(8);
    for (const index of [0, 1, 2, 3, 4, 5, 6, 7]) await expect(tiles.nth(index)).toBeVisible();

    // Every category link goes to one of the three stores, and every tile
    // says which country and currency each store trades in.
    const hrefs = await explorer
      .locator('a[href^="https://"]')
      .evaluateAll((all) => all.map((a) => new URL((a as HTMLAnchorElement).href).host));
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    for (const host of hrefs) expect(STORE_HOSTS, host).toContain(host);
    for (const index of [0, 1, 2, 3, 4, 5, 6, 7]) {
      await expect(tiles.nth(index)).toContainText(/Canada · CAD|United States · USD/);
    }
    // A picture on every tile, decoded.
    const images = tiles.locator("img");
    await expect(images).toHaveCount(8);
    await expect
      .poll(() => images.first().evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  });

  test("filtering hides tiles without removing them, and announces the count", async ({ page }) => {
    await page.goto("/medical-supply-solutions#categories");
    const explorer = page.locator("#categories");
    const all = explorer.getByRole("button", { name: "All categories" });
    const practice = explorer.getByRole("button", { name: "Professional practice" });
    await expect(all).toHaveAttribute("aria-pressed", "true");

    await practice.click();
    await expect(practice).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    // Still eight in the document; fewer shown.
    const items = explorer.locator("ul > li:has(> article)");
    await expect(items).toHaveCount(8);
    const shown = await items.evaluateAll(
      (all) => all.filter((li) => !(li as HTMLElement).hidden).length,
    );
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(8);
    await expect(explorer.getByText(`Showing ${shown} of 8 categories`)).toBeVisible();
    // A category can be in both groups: clinic and dental supplies stay with
    // the practice filter, and bathroom safety does not.
    await expect(explorer.getByRole("heading", { name: "Clinic & Dental Supplies" })).toBeVisible();
    await expect(
      explorer.getByRole("heading", { name: "Bathroom Safety & Home Care" }),
    ).toBeHidden();

    await all.click();
    await expect(explorer.getByText("Showing 8 of 8 categories")).toBeVisible();
  });

  test("the demographic chart states geography, dates, sources and the projection distinction", async ({
    page,
  }) => {
    await page.goto("/medical-supply-solutions#market");
    const market = page.locator("#market");
    await expect(market).toBeVisible();
    for (const text of ["Canada", "United States", "2016", "2021", "2025", "2010", "2020"]) {
      await expect(market.getByText(text, { exact: true }).first()).toBeVisible();
    }
    await expect(market).toContainText("Sources: Statistics Canada");
    await expect(market).toContainText("U.S. Census Bureau");
    await expect(market).toContainText("Historical: census counts and population estimates");
    await expect(market).toContainText("Projection: direction only");
    await expect(market).toContainText("not a forecast of LifeSupply’s business");
  });

  test("the portal concept is labelled as a concept and its views are real tabs", async ({
    page,
  }) => {
    await page.goto("/medical-supply-solutions#portals");
    const concept = page.locator("[data-portal-concept]");
    await expect(concept).toBeVisible();
    await expect(concept).toContainText("Illustrative portal concept — proposed capabilities");
    await expect(concept).toContainText("Demonstration data is fictional");

    const tabs = concept.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    const catalogue = concept.getByRole("tabpanel", { name: "Catalogue" });
    const purchasing = concept.getByRole("tabpanel", { name: "Purchasing" });
    await expect(catalogue).toBeVisible();
    await expect(purchasing).toBeHidden();

    await concept.getByRole("tab", { name: "Purchasing" }).click();
    await expect(purchasing).toBeVisible();
    await expect(catalogue).toBeHidden();
    await expect(purchasing).toContainText("Approval queue");
    await expect(purchasing).toContainText("Replenishment reminders");

    // Arrow keys move between the tabs, as a tab list should.
    await concept.getByRole("tab", { name: "Purchasing" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(concept.getByRole("tabpanel", { name: "Reporting" })).toBeVisible();
    await expect(concept.getByRole("tabpanel", { name: "Reporting" })).toContainText(
      "Spending summary",
    );

    // The location switch changes what the concept shows, so it is not a
    // decorative control.
    await concept.getByRole("tab", { name: "Catalogue" }).click();
    await expect(catalogue).toContainText("North clinic");
    await concept.getByRole("button", { name: "East clinic" }).click();
    await expect(catalogue).toContainText("East clinic");
    // And nothing in it is a price.
    expect(await concept.innerText()).not.toMatch(/\$\s?\d/);
  });

  test("every section anchor lands with its heading clear of the sticky bars", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "the in-page navigation is sticky on desktop only");
    for (const anchor of SECTIONS) {
      await page.goto(`/medical-supply-solutions#${anchor}`);
      const section = page.locator(`#${anchor}`);
      await expect(section).toBeVisible();
      // The header ends near 75 and the in-page navigation near 135; a
      // section top below that is readable, one above it is covered.
      const top = await section.evaluate((el) => el.getBoundingClientRect().top);
      expect(top, anchor).toBeGreaterThanOrEqual(130);
      expect(top, anchor).toBeLessThan(220);
    }
  });

  test("states the status once, on the page, before the proposed material", async ({ page }) => {
    await page.goto("/medical-supply-solutions");
    const main = page.locator("main");
    const status = main.getByText("none is offered until its implementation is confirmed");
    await expect(status).toHaveCount(1);
    // The status band sits between the stores and business purchasing.
    const order = await page.evaluate(() => {
      const y = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().top ?? -1;
      const band = [...document.querySelectorAll("main section")].find((el) =>
        el.textContent?.includes("none is offered until its implementation is confirmed"),
      );
      return [y("#stores"), band?.getBoundingClientRect().top ?? -1, y("#professional-buyers")];
    });
    const [storesTop = -1, bandTop = -1, buyersTop = -1] = order;
    expect(storesTop).toBeLessThan(bandTop);
    expect(bandTop).toBeLessThan(buyersTop);
  });

  test("removes decorative motion when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/medical-supply-solutions");

    const animationNames = await page.evaluate(() => {
      const hero = document.querySelector('[data-hero-graphic="suppliesFlatlay"] img');
      const profile = document.querySelector("#stores img");
      return [hero, profile].map((element) =>
        element ? getComputedStyle(element).animationName : null,
      );
    });
    expect(animationNames).toEqual(["none", "none"]);
  });
});
