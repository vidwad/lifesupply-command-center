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
      "/shop",
      "/our-operations/lifesupply",
      "/our-operations/wellmart-medical",
      "/our-operations/lifesupply-clinics",
      "/our-operations/balkowitsch",
      "/our-operations/technology-fulfilment",
      "/clinic-solutions",
      "/clinic-solutions/design-build",
      "/clinic-solutions/equipment",
      "/clinic-solutions/ongoing-supplies",
      "/metabolic-health",
      "/metabolic-health/care-kits",
      "/metabolic-health/care-kits/glp-1-support",
      "/metabolic-health/care-kits/sharps-supplies",
      "/metabolic-health/refills",
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
    // The grouped header marks the About group's trigger; the mobile panel marks the same link.
    await expect(current).toHaveText(/^about/i);
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
    // Reveal animations collapse too: a section far below the fold is fully
    // opaque without scrolling to it. The nearest ancestor carrying an inline
    // style is the motion wrapper; with reduced motion there is none.
    const heading = page.getByRole("heading", { name: "Metabolic-health supply services." });
    await expect(heading).toBeVisible();
    const opacity = await heading.evaluate((el) => {
      let node: HTMLElement | null = el.parentElement;
      while (node && !node.getAttribute("style")) node = node.parentElement;
      return node ? getComputedStyle(node).opacity : "1";
    });
    expect(opacity).toBe("1");
  });

  test("carries the external login in the utility strip on every viewport", async ({ page }) => {
    await page.goto("/about-us");
    // The strip precedes the header, so it is the first login control in the DOM.
    const strip = page.getByRole("link", { name: "Command Center login" }).first();
    await expect(strip).toBeVisible();
    expect(new URL((await strip.getAttribute("href"))!).origin).toBe(RENDER_ORIGIN);
  });

  test("opens the grouped desktop navigation from the keyboard and lists the four brands", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop navigation only");
    await page.goto("/");
    const trigger = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", {
      name: "Our Businesses",
    });
    await trigger.focus();
    // Focus inside the group reveals the dropdown, so Tab reaches every row.
    const menu = page.locator("#lsh-menu-businesses");
    await expect(menu).toBeVisible();
    const brandLinks = menu.locator("a");
    await expect(brandLinks).toHaveCount(5);
    const paths = await brandLinks.evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname.replace(/\/$/, "")),
    );
    expect(paths).toEqual([
      "/our-operations/lifesupply",
      "/our-operations/wellmart-medical",
      "/our-operations/lifesupply-clinics",
      "/our-operations/balkowitsch",
      "/our-operations/technology-fulfilment",
    ]);
    // The chevron is a real button for touch and assistive technology.
    const chevron = page.getByRole("button", { name: "Open Our Businesses menu" });
    await chevron.click();
    await expect(page.getByRole("button", { name: "Close Our Businesses menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(chevron).toHaveAttribute("aria-expanded", "false");
  });

  test("lists every group and utility link in the mobile panel without a hover", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile navigation only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const panel = page.locator("#lsh-mobile-menu");
    for (const name of [
      "Our Businesses",
      "Clinic Solutions",
      "Metabolic Health",
      "Care kits",
      "Refills",
      "Design & build",
      "Equipment",
      "Ongoing supplies",
      "Investors",
      "About",
      "Our team",
      "News & resources",
      "Shop & Services",
      "Contact",
      "LifeSupply",
      "Wellmart Medical",
      "LifeSupply Clinics",
      "Balkowitsch Worldwide",
      "Technology & fulfilment",
    ]) {
      await expect(panel.getByRole("link", { name, exact: true }).first(), name).toBeVisible();
    }
  });

  test("names the four operating brands in the footer with verified external links", async ({
    page,
  }) => {
    await page.goto("/about-us");
    const footer = page.getByRole("contentinfo");
    const hosts = await footer
      .locator('a[target="_blank"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).host));
    for (const host of [
      "lifesupply.ca",
      "wellmartmedical.com",
      "www.lifesupplyclinics.com",
      "balkowitsch.com",
    ]) {
      expect(hosts, host).toContain(host);
    }
  });

  test("points every internal shell link at a route that exists", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
    const hrefs = await page
      .locator(
        'header a[href^="/"], footer a[href^="/"], nav[aria-label="Utility navigation"] a[href^="/"]',
      )
      .evaluateAll((links) =>
        Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href")!))),
      );
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(response.ok(), href).toBe(true);
    }
  });

  test("gives the homepage clinic, program, partner, and investor paths verified destinations", async ({
    page,
  }) => {
    await page.goto("/");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: "Book a consultation" })).toHaveAttribute(
      "href",
      "https://www.lifesupplyclinics.com/contact-us/",
    );
    await expect(main.getByRole("link", { name: "Request an equipment quote" })).toHaveAttribute(
      "href",
      "https://www.lifesupplyclinics.com/buy-clinic-equipment/",
    );
    await expect(main.getByRole("link", { name: "Request a supply review" })).toHaveAttribute(
      "href",
      "mailto:ben@lifesupply.com",
    );
    await expect(main.getByRole("link", { name: "Discuss a supply program" })).toHaveAttribute(
      "href",
      "mailto:info@lifesupply.com",
    );
    await expect(main.getByRole("link", { name: "Start a partner conversation" })).toHaveAttribute(
      "href",
      "mailto:info@lifesupply.com",
    );
    await expect(
      main.getByRole("link", { name: "Investor relations", exact: true }),
    ).toHaveAttribute("href", /^\/investor-relations\/?$/); // next/link drops the trailing slash
    // Four brand cards, all external, all verified hosts.
    const cards = main.locator('a[href^="https://"]:has-text("Visit ")');
    await expect(cards).toHaveCount(4);
  });

  test("sends each store brand page to its own store, and the Clinics page to the Clinics site", async ({
    page,
  }) => {
    for (const [route, host, action] of [
      ["/our-operations/lifesupply", "lifesupply.ca", "Shop LifeSupply"],
      ["/our-operations/wellmart-medical", "wellmartmedical.com", "Shop Wellmart Medical"],
      ["/our-operations/balkowitsch", "balkowitsch.com", "Shop Balkowitsch Worldwide"],
      ["/our-operations/lifesupply-clinics", "www.lifesupplyclinics.com", "Book a consultation"],
    ] as const) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      const primary = page.locator("main").getByRole("link", { name: action }).first();
      const href = await primary.getAttribute("href");
      expect(new URL(href!).host, route).toBe(host);
      // Every external link on a brand page stays on that brand's host or an approved channel.
      const hosts = await page
        .locator('main a[href^="https://"]')
        .evaluateAll((links) =>
          links.map((link) => new URL((link as HTMLAnchorElement).href).host),
        );
      expect(new Set(hosts), route).toEqual(new Set([host]));
    }
  });

  test("routes the three clinic needs and lets an open clinic skip construction", async ({
    page,
  }) => {
    await page.goto("/clinic-solutions");
    const main = page.locator("main");
    for (const [name, path] of [
      ["Design and build", "/clinic-solutions/design-build"],
      ["Equipment", "/clinic-solutions/equipment"],
      ["Ongoing supplies", "/clinic-solutions/ongoing-supplies"],
    ] as const) {
      const link = main.getByRole("link", { name, exact: true });
      await expect(link).toHaveAttribute("href", new RegExp(`^${path}/?$`));
      const response = await page.request.get(path);
      expect(response.ok(), path).toBe(true);
    }
    await expect(main.getByText("does not operate patient-care clinics")).toBeVisible();
    await page.goto("/clinic-solutions/ongoing-supplies");
    // The action appears in the hero and again in the closing band.
    await expect(
      page.locator("main").getByRole("link", { name: "Request a supply review" }).first(),
    ).toHaveAttribute("href", "mailto:ben@lifesupply.com");
  });

  test("names geography and currency for the four choices on Shop & Services, and sells nothing", async ({
    page,
  }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/store or service/i);
    const main = page.locator("main");
    await expect(main.getByText("Canada · CAD")).toHaveCount(3);
    await expect(main.getByText("United States · USD")).toHaveCount(1);
    await expect(main.getByText(/add to cart/i)).toHaveCount(0);
    const hosts = await main
      .locator('a[href^="https://"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).host));
    for (const host of [
      "lifesupply.ca",
      "wellmartmedical.com",
      "www.lifesupplyclinics.com",
      "balkowitsch.com",
    ]) {
      expect(hosts, host).toContain(host);
    }
  });

  test("routes contact intents to verified pages or approved channels without a form", async ({
    page,
  }) => {
    await page.goto("/contact");
    const main = page.locator("main");
    await expect(main.locator("form")).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Book a consultation" })).toHaveAttribute(
      "href",
      "https://www.lifesupplyclinics.com/contact-us/",
    );
    await expect(
      main.getByRole("link", { name: "Acquisition or strategic inquiry" }),
    ).toHaveAttribute("href", "mailto:abdul@lifesupply.com");
    await expect(main.getByRole("link", { name: "Shareholder services" })).toHaveAttribute(
      "href",
      "mailto:invest@lifesupply.com",
    );
    // Existing orders go to the store that took them.
    await expect(main.getByRole("link", { name: "LifeSupply support" })).toHaveAttribute(
      "href",
      "https://lifesupply.ca/contact/",
    );
  });

  test("lists eight pathways, each an information page with no purchase and the program channel", async ({
    page,
  }) => {
    await page.goto("/metabolic-health/care-kits");
    const main = page.locator("main");
    const kitLinks = main.locator('a[href^="/metabolic-health/care-kits/"]');
    await expect(kitLinks).toHaveCount(8);
    const hrefs = await kitLinks.evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")!),
    );
    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(response.ok(), href).toBe(true);
    }
    await expect(main.getByText("In development").first()).toBeVisible();
    await expect(main.getByText(/add to cart|buy now/i)).toHaveCount(0);
    await expect(
      main.getByRole("link", { name: "Discuss a supply program" }).first(),
    ).toHaveAttribute("href", "mailto:info@lifesupply.com");
  });

  test("says K03 has no store destination and keeps browse links on registered store hosts", async ({
    page,
  }) => {
    await page.goto("/metabolic-health/care-kits/sharps-supplies");
    const main = page.locator("main");
    await expect(
      main.getByText(/No operating store publishes a sharps-container category/),
    ).toBeVisible();
    await expect(main.locator('a[href^="https://"]')).toHaveCount(0);

    await page.goto("/metabolic-health/care-kits/diabetes-supplies");
    const hosts = await page
      .locator('main a[href^="https://"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).host));
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts)
      expect(["lifesupply.ca", "wellmartmedical.com", "balkowitsch.com"]).toContain(host);
  });

  test("states on the refills page that no automatic shipment or subscription exists", async ({
    page,
  }) => {
    await page.goto("/metabolic-health/refills");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /starter items are not refills/i,
    );
    await expect(
      page
        .locator("main")
        .getByText(/no automatic shipment, no reminder service, and no subscription/),
    ).toBeVisible();
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
