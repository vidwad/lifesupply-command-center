import { expect, test } from "@playwright/test";

/**
 * The brand band at the top of the footer (product owner, 2026-09-13): the
 * logos of brands carried across the operating stores, greyscale on light
 * grey, looping slowly across the screen.
 *
 * What it holds: the band is on every public page above the footer proper;
 * each brand is announced once (the looping copy is hidden from assistive
 * technology); every logo decodes; the loop runs by CSS animation and stops
 * under a reduced-motion preference, where the single list wraps instead;
 * and the band never widens the page.
 */
test.describe("Supplier logo band", () => {
  test("sits at the top of the footer with every logo decoded and each brand announced once", async ({
    page,
  }) => {
    await page.goto("/");
    const band = page.locator("[data-supplier-marquee]");
    await expect(band).toBeVisible();
    await expect(band).toContainText("Brands carried across our stores");
    // Inside the footer, before its columns.
    const placement = await page.evaluate(() => {
      const footer = document.querySelector("footer");
      const band = document.querySelector("[data-supplier-marquee]");
      return {
        inFooter: !!band && !!footer && footer.contains(band),
        first: footer?.firstElementChild === band,
      };
    });
    expect(placement).toEqual({ inFooter: true, first: true });

    const named = band.locator("ul:not([aria-hidden]) img");
    const copies = band.locator('ul[aria-hidden="true"] img');
    const count = await named.count();
    expect(count).toBeGreaterThanOrEqual(20);
    await expect(copies).toHaveCount(count);
    // Every named logo has a brand name for alt text; every copy is empty.
    for (const alt of await named.evaluateAll((all) => all.map((img) => img.getAttribute("alt")))) {
      expect(alt).toBeTruthy();
    }
    for (const alt of await copies.evaluateAll((all) =>
      all.map((img) => img.getAttribute("alt")),
    )) {
      expect(alt).toBe("");
    }
    // The band scrolls the logos into view so they decode; check the first
    // few, which are on screen from the start.
    await band.scrollIntoViewIfNeeded();
    for (const index of [0, 1, 2]) {
      await expect
        .poll(() => named.nth(index).evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("loops by CSS animation, and moves", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const belt = page.locator("[data-supplier-marquee] .lsh-marquee-belt");
    // The belt itself is moving, so it is never "stable" enough to scroll
    // to; the band around it is.
    await page.locator("[data-supplier-marquee]").scrollIntoViewIfNeeded();
    await expect
      .poll(() => belt.evaluate((el) => getComputedStyle(el).animationName))
      .toBe("lsh-marquee");
    const before = await belt.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    await page.waitForTimeout(700);
    const after = await belt.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    expect(after).not.toBe(before);
    // Slowly: well under a full screen a second.
    expect(Math.abs(after - before)).toBeLessThan(200);
  });

  test("stands still under reduced motion, with the single list wrapping and no hidden copy", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const band = page.locator("[data-supplier-marquee]");
    const belt = band.locator(".lsh-marquee-belt");
    await expect.poll(() => belt.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    await expect(band.locator('ul[aria-hidden="true"]')).toBeHidden();
    // Wrapped: the list is no wider than the page.
    const widths = await band.evaluate((el) => {
      const list = el.querySelector("ul:not([aria-hidden])") as HTMLElement;
      return { list: list.scrollWidth, page: document.documentElement.clientWidth };
    });
    expect(widths.list).toBeLessThanOrEqual(widths.page);
  });
});
