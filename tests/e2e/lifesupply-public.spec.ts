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
      "/medical-supply-solutions",
      "/pharmacy-solutions",
      "/our-team",
      "/investor-relations",
      "/news",
      "/contact",
      "/shop",
      "/medical-supply-solutions/lifesupply",
      "/medical-supply-solutions/wellmart-medical",
      "/medical-supply-solutions/balkowitsch",
      "/clinic-solutions",
      "/clinic-solutions/equipment",
      "/clinic-solutions/ongoing-supplies",
      "/metabolic-health",
      "/metabolic-health/care-kits",
      "/metabolic-health/care-kits/glp-1-support",
      "/metabolic-health/care-kits/sharps-supplies",
      "/metabolic-health/refills",
      "/partners",
      "/partners/clinics",
      "/partners/pharmacies",
      "/partners/suppliers",
      "/partners/acquisitions",
      "/investor-relations/growth-strategy",
      "/investor-relations/advanced-therapeutics",
      "/investor-relations/documents",
      "/investor-relations/shareholder-services",
      "/investor-relations/disclosures",
      "/privacy",
      "/terms",
      "/accessibility",
      "/abdul-ladha",
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
    const stats = page.locator('main p[data-stat="figure"]');
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
    // Hydration applies the instant reveal a frame after load, so poll briefly.
    await expect
      .poll(
        () =>
          heading.evaluate((el) => {
            let node: HTMLElement | null = el.parentElement;
            while (node && !node.getAttribute("style")) node = node.parentElement;
            return node ? getComputedStyle(node).opacity : "1";
          }),
        { timeout: 3000 },
      )
      .toBe("1");
  });

  test("carries the external login in the utility strip on every viewport", async ({ page }) => {
    await page.goto("/about-us");
    // The strip precedes the header, so it is the first login control in the DOM.
    const strip = page.getByRole("link", { name: "Command Center login" }).first();
    await expect(strip).toBeVisible();
    expect(new URL((await strip.getAttribute("href"))!).origin).toBe(RENDER_ORIGIN);
  });

  test("opens the grouped desktop navigation from the keyboard and lists the three stores", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop navigation only");
    await page.goto("/");
    const trigger = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", {
      name: "Medical Supplies",
    });
    await trigger.focus();
    // Focus inside the group reveals the dropdown, so Tab reaches every row.
    const menu = page.locator("#lsh-menu-businesses");
    await expect(menu).toBeVisible();
    const brandLinks = menu.locator("a");
    // The group's own page leads the dropdown, then the three stores.
    await expect(brandLinks).toHaveCount(4);
    await expect(brandLinks.first()).toHaveText("Overview");
    const paths = await brandLinks.evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname.replace(/\/$/, "")),
    );
    expect(paths).toEqual([
      "/medical-supply-solutions",
      "/medical-supply-solutions/lifesupply",
      "/medical-supply-solutions/wellmart-medical",
      "/medical-supply-solutions/balkowitsch",
    ]);
    // The chevron is a real button for touch and assistive technology.
    const chevron = page.getByRole("button", { name: "Open Medical Supplies menu" });
    await chevron.click();
    await expect(page.getByRole("button", { name: "Close Medical Supplies menu" })).toHaveAttribute(
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
    // Groups are collapsed so the panel fits the screen; a child appears once its group is expanded.
    for (const name of [
      "Home",
      "Medical Supplies",
      "Clinic Solutions",
      "Pharmacy Solutions",
      "Metabolic Health",
      "Partners",
    ]) {
      await expect(panel.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(panel.getByRole("link", { name: "Care kits", exact: true })).toBeHidden();
    for (const name of [
      "Medical Supplies",
      "Clinic Solutions",
      "Metabolic Health",
      "Care kits",
      "Refills",
      "Partners",
      "Clinics",
      "Pharmacies",
      "Suppliers",
      "Acquisitions",
      "Growth strategy",
      "Advanced therapeutics",
      "Documents",
      "Shareholder services",
      "Disclosures",
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
      "Balkowitsch Worldwide",
      "Pharmacy Solutions",
    ]) {
      // Collapsed rows are display:none, so the role query must include hidden nodes.
      const link = panel.getByRole("link", { name, exact: true, includeHidden: true }).first();
      if (await link.isHidden()) {
        // Expand the group that owns it through the button that controls its list.
        const id = await link.evaluate((el) => el.closest("ul")?.id ?? "");
        await panel.locator(`button[aria-controls="${id}"]`).click();
      }
      await expect(link, name).toBeVisible();
    }
    // One group open at a time.
    await expect(panel.getByRole("button", { name: /^Collapse / })).toHaveCount(1);
  });

  test("opens the current page's group in the mobile panel and collapses the rest", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile navigation only");
    await page.goto("/metabolic-health/refills");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const panel = page.locator("#lsh-mobile-menu");
    await expect(panel.getByRole("button", { name: "Collapse Metabolic Health" })).toBeVisible();
    // The expanded group opens with its own page, then its children.
    await expect(panel.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute(
      "href",
      /^\/metabolic-health\/?$/,
    );
    await expect(panel.getByRole("link", { name: "Refills", exact: true })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Refills", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(panel.getByRole("link", { name: "Equipment", exact: true })).toBeHidden();
    await panel.getByRole("button", { name: "Expand Clinic Solutions" }).click();
    await expect(panel.getByRole("link", { name: "Equipment", exact: true })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Refills", exact: true })).toBeHidden();
  });

  test("loads nothing from YouTube until the About video is played, then embeds the privacy-enhanced player", async ({
    page,
  }) => {
    const thirdParty: string[] = [];
    page.on("request", (request) => {
      const host = new URL(request.url()).host;
      if (/youtube|ytimg|googlevideo/.test(host)) thirdParty.push(request.url());
    });
    await page.goto("/about-us");
    const play = page.getByRole("button", { name: /Play the video/ });
    await expect(play).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(thirdParty).toEqual([]);
    await play.click();
    const frame = page.locator("iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute(
      "src",
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/Jb3m3Nt3S50\?start=12&autoplay=1/,
    );
    await expect(frame).toHaveAttribute("title", /Who we are/);
  });

  test("shows a back-to-top control after reading down and returns to the top", async ({
    page,
  }) => {
    await page.goto("/about-us");
    const control = page.getByRole("button", { name: "Back to top" });
    await expect(control).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(control).toBeVisible();
    await control.click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBe(0);
    await expect(control).toHaveCount(0);
    // Focus moved to the main landmark, so the next Tab lands in the page.
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("lsh-main");
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
      "mailto:info@lifesupply.com",
    );
    await expect(main.getByRole("link", { name: "Metabolic Health", exact: true })).toHaveAttribute(
      "href",
      /^\/metabolic-health\/?$/,
    );
    await expect(main.getByRole("link", { name: "Explore partner relationships" })).toHaveAttribute(
      "href",
      /^\/partners\/?$/,
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
      ["/medical-supply-solutions/lifesupply", "lifesupply.ca", "Shop LifeSupply"],
      [
        "/medical-supply-solutions/wellmart-medical",
        "wellmartmedical.com",
        "Shop Wellmart Medical",
      ],
      ["/medical-supply-solutions/balkowitsch", "balkowitsch.com", "Shop Balkowitsch Worldwide"],
      ["/clinic-solutions", "www.lifesupplyclinics.com", "Book a consultation"],
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
    // Plan it: the consultation on the Clinics site. Equip it and keep it supplied: the two children.
    await expect(main.getByRole("link", { name: "Book a consultation" }).first()).toHaveAttribute(
      "href",
      "https://www.lifesupplyclinics.com/contact-us/",
    );
    for (const [name, path] of [
      ["Equipment planning and quotes", "/clinic-solutions/equipment"],
      ["Ongoing supplies", "/clinic-solutions/ongoing-supplies"],
    ] as const) {
      const link = main.getByRole("link", { name, exact: true }).first();
      await expect(link).toHaveAttribute("href", new RegExp(`^${path}/?$`));
      const response = await page.request.get(path);
      expect(response.ok(), path).toBe(true);
    }
    await expect(main.getByText("does not operate patient-care clinics")).toBeVisible();
    // The brand content lives on the same page now.
    await expect(main.getByText("From feasibility to hand-over.")).toBeVisible();
    await page.goto("/clinic-solutions/ongoing-supplies");
    // The action appears in the hero and again in the closing band; it reaches the corporate office.
    await expect(
      page.locator("main").getByRole("link", { name: "Request a supply review" }).first(),
    ).toHaveAttribute("href", "mailto:info@lifesupply.com");
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

  test("routes the four partner relationships and separates them from procurement", async ({
    page,
  }) => {
    await page.goto("/partners");
    const main = page.locator("main");
    for (const path of [
      "/partners/clinics",
      "/partners/pharmacies",
      "/partners/suppliers",
      "/partners/acquisitions",
    ]) {
      await expect(main.locator(`a[href="${path}"]`).first()).toBeVisible();
    }
    await expect(main.getByRole("link", { name: "Clinic Solutions" })).toHaveAttribute(
      "href",
      /^\/clinic-solutions\/?$/,
    );
    await page.goto("/partners/acquisitions");
    await expect(
      page
        .locator("main")
        .getByText(/No transaction, letter of intent, or discussion is announced/),
    ).toBeVisible();
    await expect(
      page.locator("main").getByRole("link", { name: "Acquisition or strategic inquiry" }).first(),
    ).toHaveAttribute("href", "mailto:abdul@lifesupply.com");
  });

  test("keeps investor documents at a request step with no file link, and shows the figures scoped", async ({
    page,
  }) => {
    await page.goto("/investor-relations/documents");
    const main = page.locator("main");
    await expect(main.locator("table tbody tr")).toHaveCount(3);
    await expect(main.locator('a[href$=".pdf"], a[download]')).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Request investor materials" })).toHaveAttribute(
      "href",
      "mailto:invest@lifesupply.com",
    );
    await page.goto("/investor-relations/disclosures");
    await expect(
      page
        .locator("main")
        .getByText("Unaudited consolidated financial information", { exact: false })
        .first(),
    ).toBeVisible();
    await expect(
      page.locator("main").getByText("Forward-looking statements").first(),
    ).toBeVisible();
  });

  test("shows the confirmed leader and the board with portraits, keeps their profiles, and redirects the withdrawn ones", async ({
    page,
  }) => {
    await page.goto("/our-team");
    const main = page.locator("main");
    await expect(
      main.getByText("Titles as published on the prior LifeSupply website."),
    ).toBeVisible();
    await expect(main.getByText("Chairman & CEO", { exact: true }).first()).toBeVisible();
    await expect(main.getByRole("heading", { name: "Our Board of Directors" })).toBeVisible();
    for (const [name, href] of [
      ["Abdul Ladha", /^\/abdul-ladha\/?$/],
      ["Keith Dolo", /^\/keith-dolo-2\/?$/],
      ["Barrett Sleeman", /^\/barrett-e-g-sleeman\/?$/],
      ["Dr. David Vogt", /^\/david-vogt\/?$/],
    ] as const) {
      const card = main.getByRole("link", { name: new RegExp(name) }).last();
      await expect(card, name).toHaveAttribute("href", href);
      await expect(card.getByRole("img", { name }), name).toBeVisible();
    }
    await expect(main.getByText(/Ben Hastibakhsh|Margaret Clarke|John Anderson/)).toHaveCount(0);
    const profile = await page.goto("/keith-dolo-2");
    expect(profile?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Keith Dolo");
    await expect(page.locator("main").getByText(/Robert Half International/)).toBeVisible();
    await expect(page.locator("main").getByRole("img", { name: "Keith Dolo" })).toBeVisible();
    for (const slug of ["/john-anderson-2", "/ben-hastibakhsh", "/ross-jelveh"]) {
      const withdrawn = await page.request.get(slug, { maxRedirects: 0 });
      expect(withdrawn.status(), slug).toBe(308);
      expect(withdrawn.headers()["location"], slug).toMatch(/\/our-team$/);
    }
  });

  test("keeps the newsroom honest and the policy pages linked from the footer", async ({
    page,
  }) => {
    await page.goto("/news");
    const main = page.locator("main");
    // Governed sections read the Command Center published endpoints: the honest empty note or,
    // when the service is unreachable, the fail-closed unavailable note; never blank.
    await expect(
      main.getByText(
        /No company news has been published on this site\.|Company news is temporarily unavailable/,
      ),
    ).toBeVisible();
    await expect(
      main.getByText(/No resources have been published yet|Resources are temporarily unavailable/),
    ).toBeVisible();
    await expect(main.locator('a[href^="https://"]')).toHaveCount(4);
    // An unpublished slug is a 404 when the service answers; an outage renders the unavailable page.
    const missing = await page.request.get("/news/anything");
    expect([404, 200]).toContain(missing.status());
    if (missing.status() === 200)
      expect(await missing.text()).toContain("cannot be shown right now");
    const footer = page.locator("footer");
    for (const [path, label] of [
      ["/privacy", "Privacy"],
      ["/terms", "Terms of use"],
      ["/accessibility", "Accessibility"],
    ]) {
      await expect(footer.getByRole("link", { name: label, exact: true })).toHaveAttribute(
        "href",
        new RegExp(`^${path}/?$`),
      );
    }
    await page.goto("/privacy");
    await expect(
      page.locator("main").getByText("do not set cookies", { exact: false }),
    ).toBeVisible();
  });

  test("shows governed sections as empty or unavailable, never blank, and lists no draft", async ({
    page,
  }) => {
    await page.goto("/news");
    const main = page.locator("main");
    // Three section headings, in order: company news, historical, resources.
    await expect(main.getByRole("heading", { level: 2 })).toHaveText([
      "Company news",
      "Historical releases",
      "Resources",
    ]);
    // Nothing under "Company news" links to an item unless the read model published it.
    const items = main.locator('a[href^="/news/"]');
    const count = await items.count();
    for (let index = 0; index < count; index += 1) {
      const response = await page.request.get((await items.nth(index).getAttribute("href"))!);
      expect(response.ok()).toBe(true);
    }
    // The preview route never appears on the public site and is not reachable without a session.
    await expect(page.locator('a[href*="public-web"]')).toHaveCount(0);
    const preview = await page.request.get("/public-web-preview/anything", { maxRedirects: 0 });
    expect([307, 302, 404]).toContain(preview.status());
  });

  test("keeps the published document list fail-closed on the documents page", async ({ page }) => {
    await page.goto("/investor-relations/documents");
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Published public documents" })).toBeVisible();
    await expect(
      main.getByText(
        /No public document has been published yet|The published document list is temporarily unavailable/,
      ),
    ).toBeVisible();
    await expect(main.locator('a[href$=".pdf"], a[download]')).toHaveCount(0);
  });

  test("marks outbound brand links with inert measurement attributes and loads no tracker or cookie", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    const brandLinks = page.locator('a[data-measure="brand_destination_click"]');
    expect(await brandLinks.count()).toBeGreaterThanOrEqual(4);
    const brands = await brandLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute("data-measure-brand")),
    );
    for (const brand of ["lifesupply", "wellmart", "clinics", "balkowitsch"])
      expect(brands).toContain(brand);
    const scriptHosts = await page.evaluate(() =>
      Array.from(document.scripts)
        .map((script) => script.src)
        .filter((src) => src && !src.startsWith(location.origin)),
    );
    expect(scriptHosts).toEqual([]);
    // No cookie at all: the public host bypasses the Auth.js wrapper (D-12, Stage 9).
    expect(await context.cookies()).toEqual([]);
    await page.goto("/clinic-solutions");
    await expect(
      page.locator('a[data-measure="clinic_consultation_click"]').first(),
    ).toHaveAttribute("href", "https://www.lifesupplyclinics.com/contact-us/");
  });

  test("offers contextual related links that resolve, between the program, clinic, and store pages", async ({
    page,
  }) => {
    for (const [route, expected] of [
      ["/metabolic-health", /^\/clinic-solutions\/?$/],
      ["/medical-supply-solutions/lifesupply", /^\/metabolic-health\/?$/],
      ["/clinic-solutions/ongoing-supplies", /^\/partners\/clinics\/?$/],
    ] as const) {
      await page.goto(route);
      const related = page.getByRole("region", { name: "Related" });
      await expect(related).toBeVisible();
      const hrefs = await related
        .locator("a")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href")!));
      expect(
        hrefs.some((href) => expected.test(href)),
        `${route} -> ${expected}`,
      ).toBe(true);
      for (const href of hrefs) {
        if (href.startsWith("/")) expect((await page.request.get(href)).ok(), href).toBe(true);
      }
    }
  });

  test("answers a real 404 with the public recovery page, and redirects the legacy contact address", async ({
    page,
  }) => {
    const missing = await page.goto("/no-such-page");
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/does not exist on this site/);
    await expect(
      page.locator("main").getByRole("link", { name: "Contact", exact: true }),
    ).toBeVisible();
    const legacy = await page.request.get("/contact-2", { maxRedirects: 0 });
    expect(legacy.status()).toBe(308);
    expect(legacy.headers()["location"]).toMatch(/\/contact$/);
    const slashed = await page.request.get("/about-us/", { maxRedirects: 0 });
    expect(slashed.status()).toBe(308);
    expect(slashed.headers()["location"]).toMatch(/\/about-us$/);
    // Withdrawn addresses send their visitors to the replacement section.
    for (const [source, target] of [
      ["/our-operations", /\/medical-supply-solutions$/],
      ["/our-operations/lifesupply", /\/medical-supply-solutions\/lifesupply$/],
      ["/our-operations/lifesupply-clinics", /\/clinic-solutions$/],
      ["/our-operations/technology-fulfilment", /\/medical-supply-solutions$/],
      ["/clinic-solutions/design-build", /\/clinic-solutions$/],
    ] as const) {
      const withdrawn = await page.request.get(source, { maxRedirects: 0 });
      expect(withdrawn.status(), source).toBe(308);
      expect(withdrawn.headers()["location"], source).toMatch(target);
    }
  });

  test("publishes a canonical sitemap and a robots file that disallows crawling until switched on", async ({
    page,
  }) => {
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    const xml = await sitemap.text();
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]!);
    // 40 canonical URLs since the 2026-09-08 restructure (withdrawn pages and profiles redirect).
    expect(locs.length).toBeGreaterThanOrEqual(40);
    for (const loc of locs) {
      // The origin itself is `https://lifesupplyhealth.com/`; every other entry is unslashed.
      expect(loc, loc).toMatch(/^https:\/\/lifesupplyhealth\.com(\/|\/[a-z0-9\-/]*[a-z0-9])$/);
      expect(loc, loc).not.toMatch(/\[|contact-2|public-web/);
    }
    const robots = await page.request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    expect((await robots.text()).replace(/\s+/g, " ")).toMatch(/User-Agent: \* Disallow: \//i);
  });

  test("carries a canonical link, social preview tags, noindex until switched on, and valid structured data", async ({
    page,
  }) => {
    await page.goto("/about-us");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://lifesupplyhealth.com/about-us",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /og-default\.jpg$/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const parsed = JSON.parse(jsonLd ?? "[]") as { "@type": string; name: string; url: string }[];
    expect(parsed.map((entry) => entry["@type"]).sort()).toEqual(["Organization", "WebSite"]);
    expect(parsed[0]!.url).toBe("https://lifesupplyhealth.com/");
  });

  test("never scrolls sideways at 320, 375, or 200% zoom on the principal pages", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "viewport is fixed on the mobile project");
    const routes = [
      "/",
      "/about-us",
      "/clinic-solutions",
      "/metabolic-health/care-kits",
      "/investor-relations",
      "/contact",
      "/no-such-page",
    ];
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 800 });
      for (const route of routes) {
        await page.goto(route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} at ${width}`).toBeLessThanOrEqual(1);
      }
    }
    // Browser zoom at 200% on a 1280 px window is a 640 px CSS viewport: text must reflow, not scroll.
    await page.setViewportSize({ width: 640, height: 400 });
    for (const route of routes) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} at 200% zoom`).toBeLessThanOrEqual(1);
    }
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
