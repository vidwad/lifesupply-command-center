import { expect, test } from "@playwright/test";

const storefronts = [
  {
    path: "/medical-supply-solutions/lifesupply",
    hero: "brandLifeSupply",
    category: "lifesupply",
  },
  {
    path: "/medical-supply-solutions/wellmart-medical",
    hero: "brandWellmart",
    category: "wellmart",
  },
  {
    path: "/medical-supply-solutions/balkowitsch",
    hero: "warehouse",
    category: "balkowitsch",
  },
] as const;

test.describe("Medical Supplies storefront visual system", () => {
  for (const storefront of storefronts) {
    test(`${storefront.category} keeps its hero and editorial storefront sequence visible without overflow`, async ({
      page,
    }) => {
      await page.goto(storefront.path);

      await expect(page.locator(`[data-hero-graphic="${storefront.hero}"]`)).toBeVisible();
      await expect(
        page.locator(`[data-storefront-category-visual="${storefront.category}"]`),
      ).toBeVisible();
      await expect(page.locator(".lsh-storefront-terminal")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Service channels" })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("removes decorative hero and storefront motion when reduced motion is requested", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/medical-supply-solutions/lifesupply");

    const animationNames = await page.evaluate(() => {
      const heroImage = document.querySelector(".lsh-graphic-backdrop-image");
      const heroAccent = document.querySelector(".lsh-graphic-backdrop-accent");
      const categoryImage = document.querySelector(".lsh-storefront-category-visual img");
      const categoryRule = document.querySelector(".lsh-storefront-category-rule");
      return [heroImage, heroAccent, categoryImage, categoryRule].map((element) =>
        element ? getComputedStyle(element).animationName : null,
      );
    });

    expect(animationNames).toEqual(["none", "none", "none", "none"]);
  });
});
