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

  test("hides the header while reading down and brings it back on scroll up", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeInViewport();

    // Well past the 96px "always show" zone; one downward step is a direction.
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect
      .poll(async () => (await header.boundingBox())?.y ?? 0, { timeout: 3000 })
      .toBeLessThan(0);

    // Any upward movement returns it immediately.
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(async () => (await header.boundingBox())?.y ?? -1, { timeout: 3000 }).toBe(0);
  });

  test("plays a silent, looping, inline background video in the hero, with no control", async ({
    page,
  }) => {
    await page.goto("/");
    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute("playsinline", "");
    await expect(video).toHaveAttribute("loop", "");
    // React sets muted as a property, not an attribute, so read the property.
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0), {
        timeout: 10_000,
      })
      .toBe(true);
    await expect(page.getByRole("button", { name: /background video/ })).toHaveCount(0);
  });

  test("counts the reported figures up to exactly the approved text", async ({ page }) => {
    await page.goto("/");
    const glance = page.getByText("years of operations cited in the 2025 annual report");
    await glance.scrollIntoViewIfNeeded();
    const stats = page.locator("p.lsh-display.text-4xl");
    await expect(stats).toHaveCount(3);
    await expect(stats.nth(0)).toHaveText("25+", { timeout: 8_000 });
    await expect(stats.nth(1)).toHaveText("50K+");
    await expect(stats.nth(2)).toHaveText("1M+");
  });

  test("keeps the hero heading one accessible sentence while its words animate", async ({
    page,
  }) => {
    await page.goto("/about-us");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "A platform approach to medical-supply access.",
      }),
    ).toBeVisible();
  });

  test("shows the poster instead of footage for visitors who prefer reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.locator('img[src*="hero-poster"]')).toHaveCount(1);
    // Reveal animations collapse too: content is visible without scrolling into it.
    const pillar = page.getByRole("heading", { name: "Experienced" });
    await expect(pillar).toBeVisible();
    expect(await pillar.evaluate((el) => getComputedStyle(el.closest("article")!).opacity)).toBe(
      "1",
    );
  });

  test("carries the external login in the utility strip on every viewport", async ({ page }) => {
    await page.goto("/about-us");
    // The strip precedes the header, so it is the first login control in the DOM.
    const strip = page.getByRole("link", { name: "Command Center login" }).first();
    await expect(strip).toBeVisible();
    expect(new URL((await strip.getAttribute("href"))!).origin).toBe(RENDER_ORIGIN);
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
