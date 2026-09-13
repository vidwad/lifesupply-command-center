import { expect, test } from "@playwright/test";

/**
 * The three store profiles on the consolidated Medical Supply Solutions page.
 *
 * This file covered the three standalone storefront pages until 2026-09-12,
 * when they became anchored profiles on one page (product owner). It covers
 * the profiles that replaced them: each is reachable by its own anchor, each
 * carries a photograph and a shop link, the category list is a real
 * disclosure, and the page never overflows sideways.
 */
const storefronts = [
  { anchor: "lifesupply", name: "LifeSupply", host: "lifesupply.ca" },
  { anchor: "wellmart-medical", name: "Wellmart Medical", host: "wellmartmedical.com" },
  { anchor: "balkowitsch", name: "Balkowitsch Worldwide", host: "balkowitsch.com" },
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

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test(`${storefront.anchor} lists its categories in a disclosure that opens`, async ({
      page,
    }) => {
      await page.goto("/medical-supply-solutions");
      const profile = page.locator(`#${storefront.anchor}`);
      const disclosure = profile.locator("details");
      await expect(disclosure).toHaveCount(1);

      // Shut to begin with, and the links are in the document either way, so
      // nothing here depends on a script having run.
      await expect(disclosure).not.toHaveAttribute("open", "");
      const links = disclosure.locator("a");
      expect(await links.count()).toBeGreaterThan(0);

      await disclosure.locator("summary").click();
      await expect(disclosure).toHaveAttribute("open", "");
      await expect(links.first()).toBeVisible();
      // Every category goes to the store it belongs to.
      for (const href of await links.evaluateAll((all) =>
        all.map((a) => (a as HTMLAnchorElement).href),
      )) {
        expect(href, href).toContain(storefront.host);
      }
    });
  }

  test("lets more than one category list stay open at once", async ({ page }) => {
    await page.goto("/medical-supply-solutions");
    const all = page.locator("#stores details");
    await expect(all).toHaveCount(3);
    for (const index of [0, 1, 2]) await all.nth(index).locator("summary").click();
    for (const index of [0, 1, 2]) {
      await expect(all.nth(index), `disclosure ${index}`).toHaveAttribute("open", "");
    }
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
