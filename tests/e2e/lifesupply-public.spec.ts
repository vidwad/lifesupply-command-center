import { expect, test } from "@playwright/test";

import { about } from "@/lib/public-site/content/about";

import { architecture } from "@/lib/public-site/content/architecture";

import { clinics } from "@/lib/public-site/content/clinics";

import { homepage } from "@/lib/public-site/content/home";

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

    await expect(page.getByRole("heading", { name: homepage.title })).toBeVisible();

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

    // The direction listener attaches at hydration, so a single scroll fired
    // before that is lost rather than late. Repeat the stimulus inside the
    // poll: every step is past the 96px "always show" zone and carries a
    // downward delta, so the first one to land after hydration hides it.
    await expect
      .poll(
        async () => {
          await page.evaluate(() => window.scrollBy(0, 400));
          return (await header.boundingBox())?.y ?? 0;
        },
        { timeout: 8000 },
      )
      .toBeLessThan(0);

    // Any upward movement returns it immediately. One step, not a loop: the
    // listener is provably attached by now, and scrolling all the way to the
    // top would put the header back under the utility strip rather than at 0.
    //
    // Let the last downward frame settle first. The hook coalesces scrolls
    // onto an animation frame, so an immediate upward scroll would be folded
    // into the same frame as the last downward one and still read as down.
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.evaluate(() => window.scrollBy(0, -300));
    await expect.poll(async () => (await header.boundingBox())?.y ?? -1, { timeout: 8000 }).toBe(0);
  });

  test("carries a decorative photograph in the hero, decoded, with no footage and no control", async ({
    page,
  }) => {
    await page.goto("/");
    // The background footage was replaced by the photograph on 2026-09-12
    // (product owner): it reads as a picture rather than as a dark field.
    // The company video still plays on About, where it is introduced.
    await expect(page.locator("video")).toHaveCount(0);
    const backdrop = page.locator('[data-hero-band="data"]');
    await expect(backdrop).toHaveCount(1);
    // Decorative: hidden from assistive technology, and no alt text.
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");
    const image = backdrop.locator("img");
    await expect(image).toHaveAttribute("alt", "");
    // It actually decoded; a hero that silently 404s still lays out right.
    await expect
      .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: /background video/ })).toHaveCount(0);
  });

  test("counts the reported figures up to exactly the approved text", async ({ page }) => {
    await page.goto("/");
    const glance = page.getByRole("heading", {
      name: "The scale of our operating businesses.",
    });
    await glance.scrollIntoViewIfNeeded();
    // The figures band became a definition list in the 2026-09-10 design pass:
    // the figure is the description, its label the term.
    const stats = page.locator('main [data-stat="figure"]');
    await expect(stats).toHaveCount(3);
    await expect(stats.nth(0)).toHaveText("25+", { timeout: 8_000 });
    await expect(stats.nth(1)).toHaveText("50,000+");
    await expect(stats.nth(2)).toHaveText("1M+");
    // The source and the cumulative qualification moved under the three
    // figures on 2026-09-12, so the caveat sits with them rather than above.
    const band = page.locator("section", { has: glance });
    await expect(band).toContainText("2025 Annual Report");
    await expect(band).toContainText(/cumulative and do not represent current active customers/i);
  });

  test("opens the homepage after the hero with Experienced, Growing, and Connected", async ({
    page,
  }) => {
    await page.goto("/");
    const main = page.locator("main");
    // The three-panel statement opens the page. The program architecture
    // stood second until 2026-09-12, when the product owner moved it to
    // About; the reported figures follow the panels now.
    const headings = main.getByRole("heading", { level: 2 });
    // "Who are we and what we do" opens the page above the panels since
    // 2026-09-12, so the panels are second and the figures third.
    await expect(headings.nth(0)).toHaveText(homepage.whoWeDo.title);
    await expect(headings.nth(1)).toHaveText(homepage.whoWeAre.title);
    await expect(headings.nth(2)).toHaveText(homepage.glance.title);
    await expect(main.getByRole("heading", { name: architecture.title })).toHaveCount(0);
    await expect(main.getByRole("heading", { level: 3, name: "Experienced" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 3, name: "Growing" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 3, name: "Connected" })).toBeVisible();
    // Exact: the third panel's own text now opens with "Our ambition" too.
    await expect(
      main.getByText(homepage.whoWeAre.panels[2].eyebrow, { exact: true }),
    ).toBeVisible();
    // The About sections that now close the page, in order.
    const order = await headings.evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? ""),
    );
    const at = (text: string) => order.findIndex((h) => h.includes(text));
    expect(at("Acquisitions, appointments")).toBeGreaterThan(at(homepage.glance.title));
    expect(at("Build deeper relationships")).toBeGreaterThan(at("Canada and the United States"));
    expect(at("New supply programs")).toBeGreaterThan(at("Build deeper relationships"));
    expect(order[order.length - 1]).toBe(homepage.closing.title);
    // Nothing the owner removed is back.
    await expect(main.getByRole("heading", { name: "Where to start" })).toHaveCount(0);
    await expect(main.getByRole("heading", { name: /A clinic project can start/ })).toHaveCount(0);
    await expect(main.getByText("Explore partner relationships")).toHaveCount(0);
  });

  test("sends each developing card to its own page under Solutions", async ({ page }) => {
    for (const [title, path] of [
      ["Metabolic Health Solutions", "/metabolic-health"],
      ["Pharmacy Solutions", "/pharmacy-solutions"],
    ] as const) {
      await page.goto("/");
      const card = page.locator("main").getByRole("link", { name: title, exact: true });
      await expect(card, title).toHaveCount(1);
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await expect(page, title).toHaveURL(new RegExp(`${path}/?$`));
      // It landed on the real page, not a redirect stub or an empty shell.
      await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("keeps the hero heading one accessible sentence while its words animate", async ({
    page,
  }) => {
    await page.goto("/about-us");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: about.hero.title })).toBeVisible();
  });

  test("divides About with two decorative legacy photographs that drift on scroll and hold still under reduced motion, behind a photographic hero", async ({
    page,
  }) => {
    await page.goto("/about-us");
    const main = page.locator("main");
    // About's hero is a commissioned conceptual image since 2026-09-12; the
    // legacy photograph that stood here is now the homepage hero.
    await expect(main.locator('[data-hero-graphic="aboutMedtech"] img')).toHaveCount(1);
    await expect(main.locator('[data-hero-band="data"]')).toHaveCount(0);
    const bands = main.locator("[data-band]");
    // One on About since 2026-09-11: the warehouse band went to the homepage
    // with the operating-base section, and is checked there.
    await expect(bands).toHaveCount(1);
    await page.goto("/");
    await expect(page.locator("main").locator('[data-band="warehouse"]')).toHaveCount(1);
    await page.goto("/about-us");
    for (const index of [0]) {
      const band = bands.nth(index);
      // The photograph's layer is decorative; the band's one line is real text.
      await expect(band.locator('[aria-hidden="true"] img')).toHaveCount(1);
      await band.scrollIntoViewIfNeeded();
      await expect
        .poll(() => band.locator("img").evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
    await expect(bands.nth(0)).toContainText("More than 25 years of operations");
    // The removed sections are gone, and About closes on the board since
    // 2026-09-11, with nothing after it but the footer.
    await expect(main.getByText(/Shared capabilities|Published entities/)).toHaveCount(0);
    const headings = main.getByRole("heading", { level: 2 });
    // About closes on the contact section since 2026-09-12 (product owner).
    await expect(headings.last()).toHaveText(about.connect.title);
    // The approved growth-strategy paragraph left the page on 2026-09-12
    // when the section was rewritten as Solutions development. It is kept
    // in the content model, unpublished, so it must not be on any page.
    await page.goto("/");
    await expect(
      page.locator("main").getByText(/The growth strategy is to acquire profitable operations/),
    ).toHaveCount(0);
    // What replaced it says plainly that neither programme can be bought.
    await expect(
      page.locator("main").getByText("These programs are not yet available."),
    ).toBeVisible();
    await expect(page.locator("main").locator('[data-band="warehouse"]')).toContainText(
      "Four operating websites",
    );
    // Retitled "Solutions development" on 2026-09-12 (product owner), with
    // the card details and a plain unavailability line published again. Each
    // card carries its own status, and the section may never read as an offer.
    const developing = page.locator("main").getByRole("heading", {
      name: about.developing.title,
    });
    await expect(developing).toBeVisible();
    for (const item of about.developing.items) {
      await expect(page.locator("main").getByText(item.detail)).toBeVisible();
      await expect(page.locator("main").getByRole("heading", { name: item.title })).toBeVisible();
      await expect(page.locator("main").getByText(item.cta, { exact: true })).toBeVisible();
    }
    await expect(page.locator("main").getByText(about.developing.note)).toBeVisible();
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: about.developing.title }),
    });
    // Counted in the section's own text, so a wrapper element that happens
    // to contain a badge cannot inflate the number.
    const badges = await section.evaluate(
      (el) => (el.textContent?.match(/In development/g) ?? []).length,
    );
    expect(badges).toBe(2);
    await expect(section).not.toContainText(/available now|order now|buy now|coming soon/i);
    // The tiers block renders nowhere since the About rewrite on 2026-09-12
    // (product owner). About tells the same three states as prose, and the
    // two clarifying notes went with the block, so what they drew has to be
    // drawn by the sections themselves: what runs today, what is being built
    // and cannot be bought, and what is only being assessed.
    await expect(
      page.locator("main").getByRole("heading", { name: architecture.title }),
    ).toHaveCount(0);
    await page.goto("/about-us");
    await expect(main.getByRole("heading", { name: architecture.title })).toHaveCount(0);
    await expect(main.getByText(/The two meanings of pharmacy/i)).toHaveCount(0);
    await expect(main.getByText(/How participation works/i)).toHaveCount(0);
    await expect(main.getByRole("heading", { name: about.operations.title })).toBeVisible();
    await expect(main.getByRole("heading", { name: about.priorities.title })).toBeVisible();
    await expect(main.getByRole("heading", { name: about.longerTerm.title })).toBeVisible();
    await expect(main.getByText(about.priorities.note)).toBeVisible();
    await expect(main.getByText(about.longerTerm.note)).toBeVisible();
    // The two pharmacy businesses stay apart: one being built, one only
    // assessed, each said where it belongs.
    await expect(main.getByRole("heading", { name: "Pharmacy Solutions" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Licensed pharmacy operations" })).toBeVisible();
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
    // The hero is a still photograph for everyone since 2026-09-12, so there
    // is nothing left here for reduced motion to turn off.
    await expect(page.locator('[data-hero-band="data"] img')).toHaveCount(1);
    // Reveal animations collapse too: a section far below the fold is fully
    // opaque without scrolling to it. The nearest ancestor carrying an inline
    // style is the motion wrapper; with reduced motion there is none.
    const heading = page.getByRole("heading", { name: homepage.closing.title });
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
    for (const name of ["Home", "About", "Medical Supplies", "Investors", "Contact"]) {
      await expect(panel.getByRole("link", { name, exact: true })).toBeVisible();
    }
    // Solutions has no page, so its label is a button rather than a link. It
    // keeps the same bordered chevron beside it as every other group, so the
    // rows all read the same way (product owner, 2026-09-11).
    await expect(panel.getByRole("button", { name: "Solutions", exact: true })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Solutions", exact: true })).toHaveCount(0);
    const chevrons = panel.locator('button[aria-label^="Expand"], button[aria-label^="Collapse"]');
    // One per group that has children: Medical Supplies, Solutions, Investors.
    // About lost its only child on 2026-09-11, when it absorbed the team, so
    // it is a plain link with no chevron.
    await expect(chevrons).toHaveCount(3);
    const sizes = await chevrons.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return `${Math.round(r.width)}x${Math.round(r.height)}:${getComputedStyle(el).borderTopWidth}`;
      }),
    );
    expect(new Set(sizes).size, sizes.join(" ")).toBe(1);
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
        // Two controls open a group whose label is itself a button, so the
        // chevron is targeted by its label rather than by the list it controls.
        await panel.locator(`button[aria-controls="${id}"][aria-label]`).click();
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
    const play = page.getByRole("button", { name: /Watch the company introduction/i });
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

  test("gives the homepage hero and brand cards verified destinations", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    // The clinic, metabolic and partner routes left the homepage on
    // 2026-09-11; the hero's two actions and the brand cards remain.
    for (const link of await main
      .getByRole("link", { name: "Investor information", exact: true })
      .all()) {
      await expect(link).toHaveAttribute("href", /^\/investor-relations\/?$/);
    } // next/link drops the trailing slash
    await expect(main.getByRole("link", { name: "Book a consultation" })).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Explore partner relationships" })).toHaveCount(0);
    // Four brand cards, all external, all verified hosts. Each carries its
    // own call to action since 2026-09-12, so they are matched by destination
    // rather than by a shared "Visit" label.
    const cards = main.locator(
      'a[href^="https://lifesupply.ca"], a[href^="https://wellmartmedical.com"], a[href^="https://www.lifesupplyclinics.com"], a[href^="https://balkowitsch.com"]',
    );
    await expect(cards).toHaveCount(4);
    for (const [cta, host] of [
      ["Shop LifeSupply", "lifesupply.ca"],
      ["Shop Wellmart Medical", "wellmartmedical.com"],
      ["Explore LifeSupply Clinics", "www.lifesupplyclinics.com"],
      ["Shop Balkowitsch", "balkowitsch.com"],
    ] as const) {
      const card = main.locator("a", { hasText: cta });
      await expect(card, cta).toHaveCount(1);
      await expect(card, cta).toHaveAttribute("href", new RegExp(`^https://${host}`));
    }
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
    // The collaboration section says buying needs none of it, and every item
    // shows whether it is proposed or available.
    const collaboration = page.locator("#collaboration");
    await expect(collaboration).toContainText(/(Neither|None of it) is needed to order supplies/);
    await expect(collaboration).toContainText("Proposed");
    await expect(collaboration).toContainText(/no pilot is running today/);
  });

  test("stays readable on Clinic Solutions with JavaScript disabled", async ({ browser }) => {
    // Scroll-revealed sections used to start at opacity 0, and framer-motion
    // writes the initial variant into the server-rendered HTML, so the whole
    // page body was invisible until a script ran. Entrances animate transform
    // only now (page redesign, 2026-09-10).
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/clinic-solutions");
    // The probes come from the content model rather than being copied into
    // this file. A hardcoded copy of a heading silently stops matching when
    // the heading is edited, and CI does not run Playwright, so nothing
    // catches it — which is exactly what happened to this test once.
    for (const probe of [
      clinics.hub.router.title,
      clinics.hub.planning.title,
      clinics.projects.title,
      clinics.equipment.title,
      clinics.ongoingSupplies.title,
      clinics.collaboration.title,
      clinics.hub.close.title,
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
    // The "Geography and currency" and "Support boundary" blocks came off on
    // 2026-09-12 (product owner). Every card still shows its own country and
    // currency, asserted above, and the section still says this site sells
    // nothing, so the facts survive without the two blocks.
    await expect(stores).not.toContainText("Geography and currency");
    await expect(stores).not.toContainText("Support boundary");
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
      main.getByRole("link", { name: "Discuss your supply needs" }).first(),
    ).toHaveAttribute("href", /^mailto:info@lifesupply\.com\?subject=/);
  });

  test("says K03 has no store destination and keeps browse links on registered store hosts", async ({
    page,
  }) => {
    await page.goto("/metabolic-health");
    // K03 says plainly that no store carries the category, rather than
    // offering a link that goes nowhere.
    await page
      .locator("#sharps-supplies details, #diabetes-supplies details")
      .evaluateAll((els) => els.forEach((el) => ((el as HTMLDetailsElement).open = true)));
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

  test("explains replenishment without ever offering a subscription", async ({ page }) => {
    await page.goto("/metabolic-health");
    const replenishment = page.locator("#replenishment");
    await expect(replenishment).toContainText(/starter items are not refills/i);
    // The "Today / In development" pair that spelled this out was removed on
    // 2026-09-12 at the product owner's instruction. The section must
    // therefore never read as an offer on its own: no subscription, no
    // automatic shipment, and nothing to buy here.
    await expect(replenishment).not.toContainText(/subscription|auto-?ship|reminder service/i);
    await expect(replenishment).not.toContainText(/add to cart|buy now|order now/i);
    await expect(replenishment).toContainText(/Starter equipment/);
    await expect(replenishment).toContainText(/Consumables/);
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
      // The name, purpose and audience are always visible; the rest is folded
      // and is opened before it is judged (round four method rule).
      await section
        .locator("details")
        .evaluateAll((els) => els.forEach((el) => ((el as HTMLDetailsElement).open = true)));
      for (const label of [
        "Who it is for",
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

  test("shows the leader and the board on About, each profile as a dialog, and redirects the withdrawn ones", async ({
    page,
  }) => {
    await page.goto("/about-us");
    const main = page.locator("main");
    // Round three replaced the provenance note with the title itself, and the
    // internal biography-preservation note came off the page on 2026-09-12.
    await expect(main.getByText(/as published on the prior LifeSupply website/)).toHaveCount(0);
    await expect(main.getByText(/This preserved biography and title/)).toHaveCount(0);
    // One leadership section since 2026-09-12, with his full title, and Abdul
    // Ladha named once on the page rather than as both leader and director.
    await expect(
      main.getByText("Chairman & Chief Executive Officer", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "The people guiding LifeSupply." }),
    ).toBeVisible();
    await expect(main.getByRole("heading", { name: "Our Board of Directors" })).toHaveCount(0);
    await expect(main.getByRole("heading", { level: 3, name: "Abdul Ladha" })).toHaveCount(1);
    // A card opens that person's dialog. The board cards use the short name;
    // the biography keeps the full legacy name it was published under
    // ("Barrett E.G. Sleeman, P.Eng."), so each is matched on a pattern.
    for (const [name, anchor, full] of [
      ["Abdul Ladha", "abdul-ladha", /Abdul Ladha/],
      ["Keith Dolo", "keith-dolo", /Keith Dolo/],
      ["Barrett E.G. Sleeman, P.Eng.", "barrett-sleeman", /Sleeman/],
      ["Dr. David Vogt", "david-vogt", /David Vogt/],
    ] as const) {
      const card = main.getByRole("link", { name: new RegExp(name) }).last();
      await expect(card, name).toHaveAttribute("href", `#${anchor}`);
      await expect(card.getByRole("img", { name }), name).toBeVisible();
      // Closed until its anchor is the target.
      await expect(page.locator(`#${anchor}`), anchor).toBeHidden();
      await page.goto(`/about-us#${anchor}`);
      const dialog = page.locator(`#${anchor}`);
      await expect(dialog, anchor).toBeVisible();
      await expect(dialog.getByRole("heading", { name: full }), anchor).toBeVisible();
      // The portrait and the note that dates the title travelled with the
      // biography; a legacy title must never read as a newly confirmed one.
      await expect(dialog.getByRole("img", { name: full }), anchor).toBeVisible();
      // The internal preservation note came off the page on 2026-09-12. The
      // rewritten biographies state career history in the past tense and
      // claim no role held today, so nothing is left for it to qualify.
      await expect(dialog).not.toContainText("Current roles are confirmed through the company");
      const close = dialog.getByRole("link", { name: /^Close$/ });
      await expect(close, `${anchor}: one close control`).toHaveCount(1);
      await expect(close, `${anchor}: close is in view`).toBeInViewport();
      await close.click();
      await expect(dialog, `${anchor}: closes`).toBeHidden();
      await page.goto("/about-us");
    }
    // The biography itself is in the dialog, not only the summary card.
    await page.goto("/about-us#keith-dolo");
    await expect(page.locator("#keith-dolo")).toContainText("Robert Half International");
    await page.goto("/about-us");
    await expect(main.getByText(/Ben Hastibakhsh|Margaret Clarke|John Anderson/)).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);

    for (const [slug, anchor] of [
      ["/abdul-ladha", "abdul-ladha"],
      ["/keith-dolo-2", "keith-dolo"],
      ["/barrett-e-g-sleeman", "barrett-sleeman"],
      ["/david-vogt", "david-vogt"],
    ] as const) {
      const moved = await page.request.get(slug, { maxRedirects: 0 });
      expect(moved.status(), slug).toBe(308);
      expect(moved.headers()["location"], slug).toBe(`/about-us#${anchor}`);
    }
    // The ten withdrawn addresses land on About, and so does the team address.
    for (const slug of ["/john-anderson-2", "/ben-hastibakhsh", "/ross-jelveh", "/our-team"]) {
      const withdrawn = await page.request.get(slug, { maxRedirects: 0 });
      expect(withdrawn.status(), slug).toBe(308);
      expect(withdrawn.headers()["location"], slug).toMatch(/\/about-us$/);
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
    // 20 canonical URLs: 41 before the consolidation, less four in stage 1,
    // eleven in stage 2, the Partners hub in stage 3, the four leadership
    // profiles in stage 4, and the team page in stage 5, which About
    // absorbed on 2026-09-11. Each
    // redirects and is therefore absent from the map rather than dropped.
    expect(locs.length).toBe(20);
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
