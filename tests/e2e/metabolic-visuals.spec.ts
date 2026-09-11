import { expect, test } from "@playwright/test";

test.describe("Metabolic Health visual layer", () => {
  test("keeps the editorial visual sequence and narrative graphics visible without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/metabolic-health");

    await expect(
      page.getByRole("heading", { name: "Non-drug supply support for metabolic-health programs." }),
    ).toBeVisible();
    await expect(page.locator('img[src*="files.manuscdn.com"]')).toHaveCount(1);
    await expect(page.locator(".lsh-metabolic-orbit svg")).toBeVisible();
    await expect(page.locator(".lsh-metabolic-editorial img")).toHaveCount(3);
    await expect(page.locator(".lsh-metabolic-rhythm")).toBeVisible();
    await expect(page.locator(".lsh-metabolic-coordinates")).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("stops its decorative motion when the visitor requests reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/metabolic-health");

    const animationNames = await page.evaluate(() => {
      const halo = document.querySelector(".lsh-metabolic-hero-halo--one");
      const orbit = document.querySelector(".lsh-metabolic-orbit svg");
      const editorialImage = document.querySelector(".lsh-metabolic-editorial img");
      const rhythm = document.querySelector(".lsh-metabolic-rhythm-unit");
      const coordinates = document.querySelector(".lsh-metabolic-coordinates");
      return [
        halo ? getComputedStyle(halo).animationName : null,
        orbit ? getComputedStyle(orbit).animationName : null,
        editorialImage ? getComputedStyle(editorialImage).animationName : null,
        rhythm ? getComputedStyle(rhythm).animationName : null,
        coordinates ? getComputedStyle(coordinates).animationName : null,
      ];
    });

    expect(animationNames).toEqual(["none", "none", "none", "none", "none"]);
  });
});
