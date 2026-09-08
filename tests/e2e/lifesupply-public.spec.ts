import { expect, test } from "@playwright/test";

const RENDER_ORIGIN = "https://lifesupply-cc-web.onrender.com";

test.describe("LifeSupply public site", () => {
  test("renders a corporate homepage with a separate Command Center login boundary", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Health and medical supply infrastructure for a changing market.",
      }),
    ).toBeVisible();

    const dashboardLogin = page.getByRole("link", { name: "Command Center login" }).first();

    const loginHref = await dashboardLogin.getAttribute("href");
    expect(loginHref).toBeTruthy();
    const loginUrl = new URL(loginHref!);

    expect(loginUrl.origin).toBe(RENDER_ORIGIN);
    expect(loginUrl.pathname).toBe("/login");
    expect(loginUrl.searchParams.get("redirectTo")).toBe("/dashboard");
    await expect(dashboardLogin).not.toHaveAttribute("href", /^\/dashboard/);
  });

  test("keeps principal public corporate routes reachable", async ({ page }) => {
    for (const route of [
      "/about-us",
      "/our-operations",
      "/our-team",
      "/investor-relations",
      "/news",
      "/contact",
    ]) {
      const response = await page.goto(route);
      expect(response?.ok(), `${route} should return a successful response`).toBe(true);
    }
  });

  test("gives each anchor page exactly one h1", async ({ page }) => {
    for (const route of ["/", "/about-us"]) {
      await page.goto(route);
      await expect(page.locator("h1"), `${route} h1 count`).toHaveCount(1);
    }
  });

  test("offers a skip link as the first keyboard stop", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await expect(skipLink).toBeFocused();
    // Visually hidden until focused; focus must reveal it.
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveAttribute("href", "#lsh-main");
    await expect(page.locator("main#lsh-main")).toHaveCount(1);
  });

  test("marks the current route in the navigation that is in use", async ({ page, isMobile }) => {
    await page.goto("/about-us");
    if (isMobile) {
      await page.getByRole("button", { name: "Open navigation" }).click();
    }
    // The desktop nav stays in the DOM (display: none) on mobile, so scope to
    // whichever navigation the viewport actually uses.
    const nav = isMobile
      ? page.locator("#lsh-mobile-menu")
      : page.getByRole("navigation", { name: "Primary navigation" });
    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(/about us/i);
  });

  test("opens and closes the mobile navigation from the keyboard", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile navigation only");
    await page.goto("/about-us");

    const toggle = page.locator('button[aria-controls="lsh-mobile-menu"]');
    await toggle.click();

    const menu = page.locator("#lsh-mobile-menu");
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // The menu carries the same external login boundary as the header.
    const menuLogin = await menu
      .getByRole("link", { name: "Command Center login" })
      .getAttribute("href");
    expect(new URL(menuLogin!).origin).toBe(RENDER_ORIGIN);

    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
