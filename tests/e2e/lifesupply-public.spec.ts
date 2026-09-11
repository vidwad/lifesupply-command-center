import { expect, test } from "@playwright/test";

const RENDER_ORIGIN = "https://lifesupply-cc-web.onrender.com";

/** The registered operating hosts. Nothing outbound may leave this set. */
const STORE_HOSTS = [
  "lifesupply.ca",
  "wellmartmedical.com",
  "www.lifesupplyclinics.com",
  "balkowitsch.com",
];

test.describe("LifeSupply public site", () => {
  test("renders a corporate homepage with a separate Command Center login boundary", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Medical supplies today, with new supply services in development.",
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
      "/medical-supply-solutions/lifesupply",
      "/medical-supply-solutions/wellmart-medical",
      "/medical-supply-solutions/balkowitsch",
      "/clinic-solutions",
      "/metabolic-health",
      "/partners/suppliers",
      "/partners/acquisitions",
      "/investor-relations/growth-strategy",
      "/investor-relations/advanced-therapeutics",
      "/investor-relations/disclosures",
      "/privacy",
      "/terms",
      "/accessibility",
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
    // The figures band became a definition list in the 2026-09-10 design pass:
    // the figure is the description, its label the term.
    const stats = page.locator('main [data-stat="figure"]');
    await expect(stats).toHaveCount(3);
    await expect(stats.nth(0)).toHaveText("25+", { timeout: 8_000 });
    await expect(stats.nth(1)).toHaveText("50K+");
    await expect(stats.nth(2)).toHaveText("1M+");
  });

  test("opens the homepage after the hero with Experienced, Growing, and Connected, before the group introduction", async ({
    page,
  }) => {
    await page.goto("/");
    const main = page.locator("main");
    // Audience routes open the page, then the three-panel statement, then the group
    // introduction (website improvement program, 2026-09-09).
    const headings = main.getByRole("heading", { level: 2 });
    await expect(headings.nth(0)).toHaveText("Where to start");
    await expect(headings.nth(1)).toHaveText("Who we are and where we are going.");
    for (const route of [
      "Operating businesses",
      "Partnership opportunities",
      "Investor information",
    ]) {
      await expect(main.getByRole("heading", { level: 3, name: route })).toBeVisible();
    }
    await expect(main.getByRole("heading", { level: 3, name: "Experienced" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 3, name: "Growing" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 3, name: "Connected" })).toBeVisible();
    await expect(main.getByText("This is where we want to be")).toBeVisible();
    // The third section explains how the group is put together. It used to
    // restate the operating scope the panels above already carry (round four,
    // change 1).
    const order = await main
      .getByRole("heading", { level: 2 })
      .evaluateAll((nodes) => nodes.slice(0, 3).map((node) => node.textContent?.trim()));
    expect(order[2]).toBe("One parent company, three wholly-owned subsidiaries.");
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

  test("divides About with two decorative legacy photographs that drift on scroll and hold still under reduced motion, behind a photographic hero", async ({
    page,
  }) => {
    await page.goto("/about-us");
    const main = page.locator("main");
    await expect(main.locator('[data-hero-band="data"] img')).toHaveCount(1);
    const bands = main.locator("[data-band]");
    await expect(bands).toHaveCount(2);
    for (const index of [0, 1]) {
      const band = bands.nth(index);
      // The photograph's layer is decorative; the band's one line is real text.
      await expect(band.locator('[aria-hidden="true"] img')).toHaveCount(1);
      await band.scrollIntoViewIfNeeded();
      await expect
        .poll(() => band.locator("img").evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
    await expect(bands.nth(0)).toContainText("More than 25 years of operations");
    await expect(bands.nth(1)).toContainText("Four operating websites");
    // The removed sections are gone and the developing opportunities close the page.
    await expect(main.getByText(/Shared capabilities|Published entities/)).toHaveCount(0);
    const headings = main.getByRole("heading", { level: 2 });
    await expect(headings.last()).toHaveText("Developing opportunities under evaluation.");
    await expect(
      main.getByText(/The growth strategy is to acquire profitable operations/),
    ).toBeVisible();
    // Each developing card still carries its own detail, and the pharmacy card
    // now distinguishes supplying pharmacies from running one (round three).
    await expect(
      main.getByText(/Holding licensed pharmacy operations of its own is a separate question/),
    ).toBeVisible();
    await expect(
      main.getByText(/It applies the existing supply model to a recurring patient-support need/),
    ).toBeVisible();
    // The three tiers of the business appear above the developing detail.
    await expect(main.getByRole("heading", { name: "Operating", exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { name: "In development", exact: true })).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "Under evaluation", exact: true }),
    ).toBeVisible();
    // The photograph moves with the scroll position.
    const first = bands.first();
    await page.evaluate(() => window.scrollTo(0, 0));
    await first.scrollIntoViewIfNeeded();
    const before = await first
      .locator("img")
      .evaluate(
        (img) =>
          img.getBoundingClientRect().top - img.closest("[data-band]")!.getBoundingClientRect().top,
      );
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(300);
    const after = await first
      .locator("img")
      .evaluate(
        (img) =>
          img.getBoundingClientRect().top - img.closest("[data-band]")!.getBoundingClientRect().top,
      );
    expect(Math.abs(after - before)).toBeGreaterThan(2);
    // Reduced motion: the photograph stays put.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await first.scrollIntoViewIfNeeded();
    const stillBefore = await first
      .locator("img")
      .evaluate(
        (img) =>
          img.getBoundingClientRect().top - img.closest("[data-band]")!.getBoundingClientRect().top,
      );
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(300);
    const stillAfter = await first
      .locator("img")
      .evaluate(
        (img) =>
          img.getBoundingClientRect().top - img.closest("[data-band]")!.getBoundingClientRect().top,
      );
    expect(Math.abs(stillAfter - stillBefore)).toBeLessThan(0.5);
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

  test("keeps staff login in the footer only, still external to Render", async ({ page }) => {
    await page.goto("/about-us");
    // Round two moved it out of the utility strip and the mobile panel; the footer
    // keeps a discreet staff route, and it still leaves this host.
    const links = page.getByRole("link", { name: "Command Center login" });
    await expect(links).toHaveCount(1);
    await expect(
      page.locator("footer").getByRole("link", { name: "Command Center login" }),
    ).toHaveCount(1);
    expect(new URL((await links.first().getAttribute("href"))!).origin).toBe(RENDER_ORIGIN);
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

  test("opens the Solutions menu from the keyboard, with three entries and no page of its own", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop navigation only");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    // Five primary items, in the owner's order. Solutions is a button because
    // it has no page; the other four are links.
    await expect(nav.getByRole("link", { name: "About", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Solutions", exact: true })).toHaveCount(0);
    const trigger = nav.getByRole("button", { name: /Solutions menu$/ });
    await expect(trigger).toBeVisible();
    // It opens from the keyboard, not only on hover.
    await trigger.focus();
    await trigger.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = page.locator("#lsh-menu-solutions");
    await expect(menu).toBeVisible();
    const entries = await menu
      .locator("a")
      .evaluateAll((links) => links.map((link) => link.textContent?.trim() ?? ""));
    expect(entries).toEqual([
      "Clinic Solutions",
      "Pharmacy Solutions",
      "Metabolic Health Solutions",
    ]);
    // No "Overview" row, because there is nothing to overview.
    await expect(menu.getByRole("link", { name: "Overview" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Contact is last and has no dropdown at all.
    await expect(nav.getByRole("link", { name: "Contact", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Contact menu$/ })).toHaveCount(0);
    // And no `/solutions` page exists behind the menu.
    expect((await page.request.get("/solutions")).status()).toBe(404);
  });

  test("retires the Partners hub while both retained children keep answering", async ({ page }) => {
    const response = await page.goto("/partners");
    expect(response?.ok()).toBe(true);
    const url = new URL(page.url());
    expect(url.pathname.replace(/\/$/, "")).toBe("/contact");
    expect(url.hash).toBe("#business-inquiries");
    await expect(page.locator("#business-inquiries")).toBeVisible();
    // The hazard: an exact-path rule, so the children are untouched.
    for (const retained of ["/partners/suppliers", "/partners/acquisitions"]) {
      const child = await page.goto(retained);
      expect(child?.ok(), retained).toBe(true);
      expect(new URL(page.url()).pathname.replace(/\/$/, ""), retained).toBe(retained);
    }
    // Suppliers keeps a prominent route in from Medical Supplies.
    await page.goto("/medical-supply-solutions");
    await expect(
      page.locator("main").locator('a[href^="/partners/suppliers"]').first(),
    ).toBeVisible();
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
    // The five primary items. Solutions has no page of its own, so its label
    // is a button that opens the group rather than a link.
    for (const name of ["About", "Medical Supplies", "Investors", "Contact"]) {
      await expect(panel.getByRole("link", { name, exact: true })).toBeVisible();
    }
    // Solutions is one control: its visible label is the disclosure button,
    // named "Expand Solutions" so the accessible name still contains the
    // visible text (WCAG 2.5.3), and it is not a link to anywhere.
    await expect(panel.getByRole("button", { name: "Expand Solutions" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Expand Solutions" })).toHaveText("Solutions");
    await expect(panel.getByRole("link", { name: "Solutions", exact: true })).toHaveCount(0);
    await expect(panel.getByRole("link", { name: "Disclosures", exact: true })).toBeHidden();
    for (const name of [
      "Medical Supplies",
      "Clinic Solutions",
      "Metabolic Health Solutions",
      "Pharmacy Solutions",
      "Acquisitions & Strategic Transactions",
      "Growth strategy",
      "Advanced therapeutics",
      "Disclosures",
      "Investors",
      "About",
      "Our team",
      "News & resources",
      "Contact",
      "LifeSupply",
      "Wellmart Medical",
      "Balkowitsch Worldwide",
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
    await page.goto("/investor-relations/disclosures");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const panel = page.locator("#lsh-mobile-menu");
    await expect(panel.getByRole("button", { name: "Collapse Investors" })).toBeVisible();
    // The expanded group opens with its own page, then its children.
    await expect(panel.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute(
      "href",
      /^\/investor-relations\/?$/,
    );
    await expect(panel.getByRole("link", { name: "Disclosures", exact: true })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Disclosures", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // One group open at a time: expanding Solutions collapses Investors.
    await expect(panel.getByRole("link", { name: "Clinic Solutions", exact: true })).toBeHidden();
    await panel.getByRole("button", { name: "Expand Solutions" }).click();
    await expect(panel.getByRole("link", { name: "Clinic Solutions", exact: true })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Disclosures", exact: true })).toBeHidden();
    // Solutions has no page behind it, so its panel offers no "Overview" row.
    const solutions = panel.locator("#lsh-mobile-group-solutions");
    await expect(solutions.getByRole("link", { name: "Overview" })).toHaveCount(0);
    const entries = await solutions
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.textContent?.trim() ?? ""));
    expect(entries).toEqual([
      "Clinic Solutions",
      "Pharmacy Solutions",
      "Metabolic Health Solutions",
    ]);
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
      /^mailto:info@lifesupply\.com\?subject=/,
    );
    await expect(main.getByRole("link", { name: "Metabolic Health", exact: true })).toHaveAttribute(
      "href",
      /^\/metabolic-health\/?$/,
    );
    // The audience routes under the hero reuse these actions, so every match must agree.
    // The Partners hub was retired on 2026-09-10; the partner path now goes
    // where the conversation actually starts, with its own anchor.
    for (const link of await main
      .getByRole("link", { name: "Explore partner relationships" })
      .all()) {
      await expect(link).toHaveAttribute("href", "/contact#business-inquiries");
    }
    for (const link of await main
      .getByRole("link", { name: "Investor relations", exact: true })
      .all()) {
      await expect(link).toHaveAttribute("href", /^\/investor-relations\/?$/);
    } // next/link drops the trailing slash
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
      if (route === "/clinic-solutions") {
        // The equipment section absorbed the catalogue links on 2026-09-10,
        // and the clinic-supply categories are published on LifeSupply.ca.
        // Every host must still be a registered store, not an arbitrary one.
        expect(
          hosts.every((h) => STORE_HOSTS.includes(h)),
          route,
        ).toBe(true);
        expect(new Set(hosts), route).toContain(host);
      } else {
        expect(new Set(hosts), route).toEqual(new Set([host]));
      }
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
    // The router sends each of the three audiences to its section (page
    // redesign, 2026-09-10).
    for (const [name, anchor] of [
      ["Plan or renovate a clinic", "#planning"],
      ["Plan and quote equipment", "#equipment"],
      ["Keep a clinic supplied", "#ongoing-supplies"],
    ] as const) {
      const link = main.getByRole("link", { name }).first();
      await expect(link, name).toHaveAttribute("href", anchor);
      await expect(page.locator(anchor), anchor).toHaveCount(1);
    }
    // Stated twice and deliberately so: once where a reader has just learned
    // what the service is, and again in the supplies section in its own
    // words, because that reader is buying rather than building (round four,
    // change 5).
    const boundary = main.getByText("does not operate patient-care clinics");
    await expect(boundary).toHaveCount(2);
    await expect(boundary.first()).toBeVisible();
    await expect(page.locator("#ongoing-supplies")).toContainText(
      "takes no part in clinical decisions",
    );
    // The brand content lives on the same page.
    await expect(main.getByText("From feasibility to hand-over.")).toBeVisible();
    // The supply review reaches the corporate office from the supplies section.
    await expect(
      main.getByRole("link", { name: "Request a supply review" }).first(),
    ).toHaveAttribute("href", /^mailto:info@lifesupply\.com\?subject=/);
  });

  test("carries every consolidated address to the section that replaced it", async ({ page }) => {
    // Website consolidation, stage 1. Each retired address must arrive at a
    // section that exists, and the section must be there in the served HTML
    // rather than appearing only once JavaScript has run.
    for (const [from, path, anchor] of [
      ["/shop", "/medical-supply-solutions", "stores"],
      ["/clinic-solutions/equipment", "/clinic-solutions", "equipment"],
      ["/clinic-solutions/ongoing-supplies", "/clinic-solutions", "ongoing-supplies"],
      ["/partners/clinics", "/clinic-solutions", "collaboration"],
    ] as const) {
      const response = await page.goto(from);
      expect(response?.ok(), `${from} should resolve`).toBe(true);
      const url = new URL(page.url());
      expect(url.pathname.replace(/\/$/, ""), `${from} destination`).toBe(path);
      expect(url.hash, `${from} fragment`).toBe(`#${anchor}`);
      const target = page.locator(`#${anchor}`);
      await expect(target, `${from} target`).toHaveCount(1);
      await expect(target).toBeVisible();
    }
    // The `/partners` hazard: the retired child must not take its siblings.
    for (const retained of ["/partners/suppliers", "/partners/acquisitions"]) {
      const response = await page.goto(retained);
      expect(response?.ok(), retained).toBe(true);
      expect(new URL(page.url()).pathname.replace(/\/$/, ""), retained).toBe(retained);
    }
  });

  test("routes Clinic Solutions from one control that names every section", async ({ page }) => {
    // The page asked its routing question three times before the redesign of
    // 2026-09-10: a section-navigation strip, a two-card "which do you need",
    // and a three-card "plan / equip / supply". One named landmark does it
    // now, and it still reaches all four sections.
    await page.goto("/clinic-solutions");
    const nav = page.getByRole("navigation", { name: "Choose a starting point" });
    await expect(nav).toBeVisible();
    const hrefs = await nav
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs).toEqual(["#planning", "#equipment", "#ongoing-supplies", "#collaboration"]);
    for (const href of hrefs) {
      await expect(page.locator(href!), href!).toHaveCount(1);
    }
    // And there is only one such control on the page.
    await expect(page.getByRole("navigation", { name: "On this page" })).toHaveCount(0);
    // The reader who is already open must recognise themselves in the router.
    await expect(nav).toContainText("Already seeing patients");
    // The collaboration section states what it is not, with its statuses.
    await expect(page.locator("#collaboration")).toContainText("Collaboration is not procurement");
    await expect(page.locator("#collaboration")).toContainText("Proposed");
  });

  test("stays readable on Clinic Solutions with JavaScript disabled", async ({ browser }) => {
    // Scroll-revealed sections used to start at opacity 0, and framer-motion
    // writes the initial variant into the server-rendered HTML, so the whole
    // page body was invisible until a script ran. Entrances animate transform
    // only now (page redesign, 2026-09-10).
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/clinic-solutions");
    for (const probe of [
      "What does your clinic need?",
      "Bring a clinic plan into focus.",
      "Six clinics built across British Columbia.",
      "Plan the equipment each room needs.",
      "Keep an open clinic supplied.",
      "Start with what the clinic needs.",
    ]) {
      await expect(page.getByText(probe).first(), probe).toBeVisible();
    }
    await context.close();
  });

  test("names geography, currency and support in the stores section, and sells nothing", async ({
    page,
  }) => {
    // Shop & Services merged into this section on 2026-09-10; what it said
    // about geography, currency and the support boundary has to still be here.
    await page.goto("/medical-supply-solutions");
    const stores = page.locator("#stores");
    await expect(stores).toBeVisible();
    await expect(stores.getByText("Canada · CAD")).toHaveCount(2);
    await expect(stores.getByText("United States · USD")).toHaveCount(1);
    await expect(stores).toContainText("does not sell products or take orders");
    await expect(stores).toContainText("Geography and currency");
    await expect(stores).toContainText("cannot see or change store orders");
    await expect(page.locator("main").getByText(/add to cart/i)).toHaveCount(0);
    const hosts = await stores
      .locator('a[href^="https://"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).host));
    for (const host of ["lifesupply.ca", "wellmartmedical.com", "balkowitsch.com"]) {
      expect(hosts, host).toContain(host);
    }
    // The fourth destination is the clinic section, which has its own page.
    await expect(
      page.locator("main").getByRole("link", { name: "Clinic Solutions" }).first(),
    ).toHaveAttribute("href", /clinic-solutions/);
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
    ).toHaveAttribute("href", /^mailto:abdul@lifesupply\.com\?subject=/);
    await expect(main.getByText(/Shareholder services/)).toHaveCount(0);
    // Existing orders go to the store that took them.
    await expect(main.getByRole("link", { name: "LifeSupply support" })).toHaveAttribute(
      "href",
      "https://lifesupply.ca/contact/",
    );
  });

  test("lists eight pathways, each an information page with no purchase and the program channel", async ({
    page,
  }) => {
    await page.goto("/metabolic-health");
    const main = page.locator("main");
    // One catalogue, rendered as a table from `lg` up and as cards below it, so
    // every pathway has two link elements and eight distinct destinations
    // (round three, outcome 5). Since 2026-09-10 those destinations are
    // sections of this page rather than pages of their own.
    const kitLinks = main.locator('a[href^="#"]').filter({ hasNotText: "On this page" });
    const allHrefs = await kitLinks.evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")!),
    );
    const hrefs = [...new Set(allHrefs)].filter(
      (href) => !["#pathways", "#replenishment", "#collaboration"].includes(href),
    );
    expect(hrefs).toHaveLength(8);
    for (const href of hrefs) {
      // Each one is a section on this page, present and visible.
      await expect(page.locator(href), href).toHaveCount(1);
      await expect(page.locator(href), href).toBeVisible();
    }
    await expect(main.getByText("In development").first()).toBeVisible();
    await expect(main.getByText(/add to cart|buy now/i)).toHaveCount(0);
    await expect(
      main.getByRole("link", { name: "Discuss a supply program" }).first(),
    ).toHaveAttribute("href", /^mailto:info@lifesupply\.com\?subject=/);
  });

  test("says K03 has no store destination and keeps browse links on registered store hosts", async ({
    page,
  }) => {
    await page.goto("/metabolic-health");
    // K03 says plainly that no store carries the category, rather than
    // offering a link that goes nowhere.
    const sharps = page.locator("#sharps-supplies");
    await expect(
      sharps.getByText(/No operating store publishes a sharps-container category/),
    ).toBeVisible();
    await expect(sharps.locator('a[href^="https://"]')).toHaveCount(0);

    const hosts = await page
      .locator('#diabetes-supplies a[href^="https://"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).host));
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts)
      expect(["lifesupply.ca", "wellmartmedical.com", "balkowitsch.com"]).toContain(host);
  });

  test("states in the replenishment section that no automatic shipment or subscription exists", async ({
    page,
  }) => {
    await page.goto("/metabolic-health");
    const replenishment = page.locator("#replenishment");
    await expect(replenishment).toContainText(/starter items are not refills/i);
    await expect(
      replenishment.getByText(
        /no automatic shipment, no reminder service, and no subscription on this site today/,
      ),
    ).toBeVisible();
  });

  test("carries every stage 2 address to the section that replaced it", async ({ page }) => {
    const KITS = [
      "glp-1-support",
      "injection-safety",
      "sharps-supplies",
      "travel-support",
      "home-monitoring",
      "diabetes-supplies",
      "clinic-injectable-supplies",
      "pharmacy-patient-support",
    ];
    const moves: [string, string, string][] = [
      ["/partners/pharmacies", "/pharmacy-solutions", "partner-program"],
      ["/metabolic-health/care-kits", "/metabolic-health", "pathways"],
      ["/metabolic-health/refills", "/metabolic-health", "replenishment"],
      ...KITS.map((slug): [string, string, string] => [
        `/metabolic-health/care-kits/${slug}`,
        "/metabolic-health",
        slug,
      ]),
    ];
    for (const [from, path, anchor] of moves) {
      const response = await page.goto(from);
      expect(response?.ok(), `${from} should resolve`).toBe(true);
      const url = new URL(page.url());
      expect(url.pathname.replace(/\/$/, ""), `${from} destination`).toBe(path);
      expect(url.hash, `${from} fragment`).toBe(`#${anchor}`);
      const target = page.locator(`#${anchor}`);
      await expect(target, `${from} target`).toHaveCount(1);
      await expect(target).toBeVisible();
    }
  });

  test("keeps every pathway whole in its section", async ({ page }) => {
    await page.goto("/metabolic-health");
    // The eight pathway pages each carried an audience, a distinction, three
    // item roles, compatibility, exclusions, store categories and FAQs.
    // Consolidation must not have quietly dropped any of them.
    for (const slug of ["glp-1-support", "diabetes-supplies", "pharmacy-patient-support"]) {
      const section = page.locator(`#${slug}`);
      await expect(section, slug).toBeVisible();
      for (const label of [
        "Who it is for",
        "The distinction that matters",
        "Compatibility",
        "Excluded",
        "Browse related store categories",
        "Questions",
      ]) {
        await expect(
          section.getByText(label, { exact: true }).first(),
          `${slug}: ${label}`,
        ).toBeVisible();
      }
      // Item roles, each labelled. A pathway declares the roles it actually
      // has and no more: diabetes supplies has no occasional item, and
      // pharmacy patient support has no starter one. The rule is that a
      // pathway shows at least one role and that every role it shows is one
      // of the three the legend defines — not that all three are present.
      const VALID = ["starter", "consumable", "occasional"];
      const roles = await section
        .locator("li span")
        .evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ""));
      const shown = roles.filter((role) => VALID.includes(role));
      expect(shown.length, `${slug} roles`).toBeGreaterThan(0);
      expect(new Set(shown).size, `${slug} roles are distinct`).toBe(shown.length);
    }
    // Nothing on the page offers a purchase. Checked as affordances rather
    // than as words: the replenishment section says there is "no subscription
    // on this site today", which is a denial and must not read as an offer.
    const main = page.locator("main");
    await expect(
      main.getByRole("button", { name: /add to cart|buy|subscribe|checkout/i }),
    ).toHaveCount(0);
    await expect(
      main.getByRole("link", { name: /add to cart|buy now|subscribe|checkout/i }),
    ).toHaveCount(0);
    await expect(main.getByText(/add to cart|buy now/i)).toHaveCount(0);
  });

  test("keeps the two retained partner pages separate from procurement", async ({ page }) => {
    await page.goto("/partners/acquisitions");
    // Boundaries blocks were internal guidance and left every page on 2026-09-09.
    await expect(page.locator("main").getByRole("heading", { name: "Boundaries" })).toHaveCount(0);
    await expect(
      page.locator("main").getByRole("link", { name: "Acquisition or strategic inquiry" }).first(),
    ).toHaveAttribute("href", /^mailto:abdul@lifesupply\.com\?subject=/);
    await page.goto("/partners/suppliers");
    await expect(
      page.locator("main").getByRole("link", { name: "Supplier inquiry" }).first(),
    ).toHaveAttribute("href", /^mailto:/);
  });

  test("never scrolls sideways: no public page is wider than the viewport", async ({ page }) => {
    // The investor documents table needed 40rem and widened the whole news page on a
    // phone (product owner, 2026-09-09). It now stacks below md; this holds the line.
    for (const route of [
      "/",
      "/about-us",
      "/news",
      "/pharmacy-solutions",
      "/our-team",
      "/investor-relations/disclosures",
    ]) {
      await page.goto(route);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, route).toBeLessThanOrEqual(clientWidth + 1);
    }
  });

  test("keeps investor documents at a request step with no file link, and shows the figures scoped", async ({
    page,
  }) => {
    await page.goto("/news");
    const main = page.locator("main");
    await expect(
      main.getByRole("heading", { name: "Investor documents", exact: true }),
    ).toBeVisible();
    await expect(main.locator("table tbody tr")).toHaveCount(3);
    await expect(main.locator('a[href$=".pdf"], a[download]')).toHaveCount(0);
    // The corporate overview added in round three offers the same action, so
    // check every instance rather than assuming a single one.
    const requests = await main.getByRole("link", { name: "Request investor materials" }).all();
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      await expect(request).toHaveAttribute("href", /^mailto:invest@lifesupply\.com\?subject=/);
    }
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

  test("shows the leader and the board with portraits, their full profiles below, and redirects the withdrawn ones", async ({
    page,
  }) => {
    await page.goto("/our-team");
    const main = page.locator("main");
    // Round three replaced the provenance note with the title itself.
    await expect(main.getByText(/as published on the prior LifeSupply website/)).toHaveCount(0);
    await expect(main.getByText("Chairman & CEO", { exact: true }).first()).toBeVisible();
    await expect(main.getByRole("heading", { name: "Our Board of Directors" })).toBeVisible();
    // The four biographies became sections of this page on 2026-09-10, so a
    // card links to an anchor and the full record is already on the page.
    // The board cards use the short name; the biography keeps the full legacy
    // name it was published under ("Barrett E.G. Sleeman, P.Eng."), so each
    // person is matched on a pattern rather than on one exact string.
    for (const [name, anchor, full] of [
      ["Abdul Ladha", "abdul-ladha", /Abdul Ladha/],
      ["Keith Dolo", "keith-dolo", /Keith Dolo/],
      ["Barrett Sleeman", "barrett-sleeman", /Sleeman/],
      ["Dr. David Vogt", "david-vogt", /David Vogt/],
    ] as const) {
      const card = main.getByRole("link", { name: new RegExp(name) }).last();
      await expect(card, name).toHaveAttribute("href", `#${anchor}`);
      await expect(card.getByRole("img", { name }), name).toBeVisible();
      const section = page.locator(`#${anchor}`);
      await expect(section, anchor).toBeVisible();
      await expect(section.getByRole("heading", { name: full }), anchor).toBeVisible();
      // The portrait and the note that dates the title travelled with the
      // biography; a legacy title must never read as a newly confirmed one.
      await expect(section.getByRole("img", { name: full }), anchor).toBeVisible();
      await expect(section).toContainText("Current roles are confirmed through the company");
    }
    // The biography itself is here, not only the summary card.
    await expect(page.locator("#keith-dolo")).toContainText("Robert Half International");
    await expect(main.getByText(/Ben Hastibakhsh|Margaret Clarke|John Anderson/)).toHaveCount(0);
    // One h1 still, because four pages became four sections rather than four headings.
    await expect(page.locator("h1")).toHaveCount(1);

    for (const [slug, anchor] of [
      ["/abdul-ladha", "abdul-ladha"],
      ["/keith-dolo-2", "keith-dolo"],
      ["/barrett-e-g-sleeman", "barrett-sleeman"],
      ["/david-vogt", "david-vogt"],
    ] as const) {
      const moved = await page.request.get(slug, { maxRedirects: 0 });
      expect(moved.status(), slug).toBe(308);
      expect(moved.headers()["location"], slug).toBe(`/our-team#${anchor}`);
    }
    // The ten withdrawn addresses still land on the listing, unchanged.
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
    // Governed sections read the Command Center published endpoints. With nothing published
    // the section is left out; when the service is unreachable it says so and is never blank
    // (website improvement program, 2026-09-09).
    for (const [heading, unavailable] of [
      ["Company news", "Company news is temporarily unavailable"],
      ["Resources", "Resources are temporarily unavailable"],
    ] as const) {
      const section = main.getByRole("heading", { level: 2, name: heading });
      if ((await section.count()) > 0) {
        await expect(main.getByText(unavailable, { exact: false })).toBeVisible();
      }
    }
    await expect(
      main.getByText(/No company news has been published|No resources have been published/),
    ).toHaveCount(0);
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
    // A governed section that fetched cleanly and returned nothing is left out rather
    // than announcing itself as empty (website improvement program, 2026-09-09). With no
    // published records the page shows the round-three corporate overview, the investor
    // documents and the historical record.
    await expect(main.getByRole("heading", { level: 2 })).toHaveText([
      "What LifeSupply is, in one place.",
      "Investor documents",
      "Historical releases",
    ]);
    await expect(
      main.getByText(/has been published on this site|have been published yet/),
    ).toHaveCount(0);
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

  test("keeps the published document list fail-closed on the news page", async ({ page }) => {
    await page.goto("/news");
    const main = page.locator("main");
    // Fail-closed: with nothing published the list is left out entirely rather than
    // announcing itself as empty; an outage still says so, and neither state ever
    // links a file (website improvement program, 2026-09-09).
    const list = main.getByRole("heading", { name: "Published public documents" });
    if ((await list.count()) > 0) {
      await expect(
        main.getByText("The published document list is temporarily unavailable", { exact: false }),
      ).toBeVisible();
    }
    await expect(main.getByText("No public document has been published yet")).toHaveCount(0);
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

  test("shows no Related link row above the footer on the program, clinic, store, and pharmacy pages", async ({
    page,
  }) => {
    // Product owner, 2026-09-09: the "Related" rows are gone from every page.
    for (const route of [
      "/metabolic-health",
      "/medical-supply-solutions/lifesupply",
      "/clinic-solutions",
      "/pharmacy-solutions",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("region", { name: "Related" }), route).toHaveCount(0);
      await expect(page.locator("main").getByText("Related", { exact: true }), route).toHaveCount(
        0,
      );
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
      ["/investor-relations/documents", /\/news$/],
      ["/investor-relations/shareholder-services", /\/investor-relations$/],
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
    // 21 canonical URLs, the number the owner's instruction names: 41 before
    // the consolidation, less four in stage 1, eleven in stage 2, the Partners
    // hub in stage 3 and the four leadership profiles in stage 4. Each
    // redirects and is therefore absent from the map rather than dropped.
    expect(locs.length).toBe(21);
    for (const retired of [
      "/shop",
      "/clinic-solutions/equipment",
      "/clinic-solutions/ongoing-supplies",
      "/partners/clinics",
      "/partners/pharmacies",
      "/metabolic-health/care-kits",
      "/metabolic-health/care-kits/glp-1-support",
      "/metabolic-health/refills",
      "/partners",
      "/abdul-ladha",
      "/keith-dolo-2",
      "/barrett-e-g-sleeman",
      "/david-vogt",
    ]) {
      expect(locs, retired).not.toContain(`https://lifesupplyhealth.com${retired}`);
    }
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
      "/metabolic-health",
      "/pharmacy-solutions",
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

    // Round two removed staff login from the panel; it lives only in the footer now.
    await expect(menu.getByRole("link", { name: "Command Center login" })).toHaveCount(0);
    // The panel still carries the public utility links. Shop & Services left
    // the menu on 2026-09-10 when it merged into the Medical Supplies stores
    // section, so Contact is the utility link that remains.
    await expect(menu.getByRole("link", { name: "Shop & Services" })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: "Contact", exact: true })).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
