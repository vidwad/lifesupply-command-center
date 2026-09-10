import { expect, test } from "@playwright/test";

const RENDER_ORIGIN = "https://lifesupply-cc-web.onrender.com";

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
    const order = await main
      .getByRole("heading", { level: 2 })
      .evaluateAll((nodes) => nodes.slice(0, 3).map((node) => node.textContent?.trim()));
    expect(order[2]).toBe("Commerce, clinic development, equipment, and ongoing supply.");
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
      /^mailto:info@lifesupply\.com\?subject=/,
    );
    await expect(main.getByRole("link", { name: "Metabolic Health", exact: true })).toHaveAttribute(
      "href",
      /^\/metabolic-health\/?$/,
    );
    // The audience routes under the hero reuse these actions, so every match must agree.
    for (const link of await main
      .getByRole("link", { name: "Explore partner relationships" })
      .all()) {
      await expect(link).toHaveAttribute("href", /^\/partners\/?$/);
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
    ).toHaveAttribute("href", /^mailto:info@lifesupply\.com\?subject=/);
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
    await page.goto("/metabolic-health/care-kits");
    const main = page.locator("main");
    // One catalogue, rendered as a table from `lg` up and as cards below it, so
    // every pathway has two link elements and eight distinct destinations
    // (round three, outcome 5).
    const kitLinks = main.locator('a[href^="/metabolic-health/care-kits/"]');
    const allHrefs = await kitLinks.evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")!),
    );
    const hrefs = [...new Set(allHrefs)];
    expect(hrefs).toHaveLength(8);
    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(response.ok(), href).toBe(true);
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
        .getByText(
          /no automatic shipment, no reminder service, and no subscription on this site today/,
        ),
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
    // Boundaries blocks were internal guidance and left every page on 2026-09-09.
    await expect(page.locator("main").getByRole("heading", { name: "Boundaries" })).toHaveCount(0);
    await expect(
      page.locator("main").getByRole("link", { name: "Acquisition or strategic inquiry" }).first(),
    ).toHaveAttribute("href", /^mailto:abdul@lifesupply\.com\?subject=/);
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

  test("shows the confirmed leader and the board with portraits, keeps their profiles, and redirects the withdrawn ones", async ({
    page,
  }) => {
    await page.goto("/our-team");
    const main = page.locator("main");
    // Round three replaced the provenance note with the title itself.
    await expect(main.getByText(/as published on the prior LifeSupply website/)).toHaveCount(0);
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
      "/metabolic-health/care-kits/glp-1-support",
      "/medical-supply-solutions/lifesupply",
      "/clinic-solutions",
      "/clinic-solutions/ongoing-supplies",
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

    // Round two removed staff login from the panel; it lives only in the footer now.
    await expect(menu.getByRole("link", { name: "Command Center login" })).toHaveCount(0);
    // The panel still carries the public utility links.
    await expect(menu.getByRole("link", { name: "Shop & Services" })).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
