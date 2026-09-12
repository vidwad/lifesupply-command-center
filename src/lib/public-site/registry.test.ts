/**
 * Registry contracts: the brand, route, and action registries are the only
 * places a public destination is resolved, and these tests keep them honest.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ACTIONS, actionHref, isExternalAction, type ActionKey } from "@/lib/public-site/actions";
import {
  BRANDS,
  OPERATING_BRANDS,
  brandGeography,
  getBrand,
  getBrandCategory,
} from "@/lib/public-site/brands";
import { investorRelations } from "@/lib/public-site/content/investors";
import { KIT_SLUGS, metabolic } from "@/lib/public-site/content/metabolic";
import { news } from "@/lib/public-site/content/news";
import { partners } from "@/lib/public-site/content/partners";
import { policies } from "@/lib/public-site/content/policies";
import { legacyTitle, team } from "@/lib/public-site/content/team";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import {
  BRAND_ROUTES,
  CONSOLIDATED_ROUTES,
  LIFE_SUPPLY_NAVIGATION,
  LIFE_SUPPLY_ROUTES,
  LIVE_ROUTES,
  METABOLIC_ROUTES,
  PHARMACY_ROUTES,
  ROUTES,
  SECTION_ANCHORS,
  STAGE_3_ROUTES,
  WITHDRAWN_ROUTES,
  STAGE_5_ROUTES,
  buildLegalNavigation,
  kitRoute,
  profileRoute,
  buildPrimaryNavigation,
  buildUtilityNavigation,
  isLiveRoute,
  isLiveSection,
  sectionRoute,
  splitSection,
} from "@/lib/public-site/routes";

const ROOT = join(__dirname, "..", "..", "..");

const sameHost = (url: string, canonical: string) => new URL(url).host === new URL(canonical).host;

describe("brand registry", () => {
  it("names the corporate surface and the four operating brands, in the guide's order", () => {
    expect(BRANDS.map((record) => record.key)).toEqual([
      "corporate",
      "lifesupply",
      "wellmart",
      "clinics",
      "balkowitsch",
    ]);
    expect(OPERATING_BRANDS.map((record) => record.name)).toEqual([
      "LifeSupply",
      "Wellmart Medical",
      "LifeSupply Clinics",
      "Balkowitsch Worldwide",
    ]);
  });

  it("links only to HTTPS canonical URLs with no query, fragment, or tracking parameter", () => {
    for (const record of BRANDS) {
      const url = new URL(record.canonicalUrl);
      expect(url.protocol, record.key).toBe("https:");
      expect(url.search, record.key).toBe("");
      expect(url.hash, record.key).toBe("");
      expect(record.canonicalUrl.endsWith("/"), record.key).toBe(true);
      if (record.supportUrl) {
        expect(sameHost(record.supportUrl, record.canonicalUrl), record.key).toBe(true);
      }
    }
  });

  it("lists category and store links only on the brand's own host, over HTTPS, without duplicates", () => {
    for (const record of BRANDS) {
      const links = [...record.categories, ...record.storeLinks];
      const urls = links.map((link) => link.url);
      expect(new Set(urls).size, record.key).toBe(urls.length);
      for (const link of links) {
        const url = new URL(link.url);
        expect(url.protocol, link.url).toBe("https:");
        expect(url.search, link.url).toBe("");
        expect(sameHost(link.url, record.canonicalUrl), link.url).toBe(true);
        expect(link.label.trim().length, link.url).toBeGreaterThan(0);
      }
    }
    // The three stores each publish categories; the Clinics site is a service site.
    expect(getBrand("lifesupply").categories.length).toBeGreaterThan(0);
    expect(getBrand("wellmart").categories.length).toBeGreaterThan(0);
    expect(getBrand("balkowitsch").categories.length).toBeGreaterThan(0);
    expect(getBrand("clinics").categories).toEqual([]);
  });

  it("asserts no legal relationship that the owner has not confirmed", () => {
    // Only the corporate entity is confirmed (S-13). Every operating brand
    // stays null until WEB-01 records the relationship.
    for (const record of OPERATING_BRANDS) {
      expect(record.legalEntity, record.key).toBeNull();
      expect(record.relationship, record.key).toBeNull();
    }
    // The parent named in the consolidated financial statements and the
    // corporate-structure page of the August 25, 2026 materials.
    expect(getBrand("corporate").legalEntity).toBe("LifeSupply Health Inc.");
  });

  it("carries a verification date and a register reference on every record", () => {
    for (const record of BRANDS) {
      expect(record.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(record.source).toMatch(/S-\d+/);
    }
  });

  it("describes geography and currency without a legal claim", () => {
    expect(brandGeography(getBrand("balkowitsch"))).toBe("United States · USD");
    expect(brandGeography(getBrand("lifesupply"))).toBe("Canada · CAD");
    expect(brandGeography(getBrand("corporate"))).toBe("Canada");
  });

  it("points bundled assets at files that exist", () => {
    for (const record of BRANDS) {
      if (record.asset) {
        expect(existsSync(join(ROOT, "public", record.asset.src)), record.key).toBe(true);
      }
    }
  });
});

describe("route registry", () => {
  const routeFile = (path: string) =>
    join(ROOT, "src/app", path === "/" ? "" : path.replace(/\/$/, ""), "page.tsx");

  it("keeps every live route backed by a route file and every planned route out of the menus", () => {
    for (const route of LIVE_ROUTES) {
      const file = route.routeFile ? join(ROOT, route.routeFile) : routeFile(route.path);
      expect(existsSync(file), route.path).toBe(true);
    }
    const menuHrefs = [
      ...buildPrimaryNavigation().flatMap((group) => [
        group.href,
        ...group.links.map((l) => l.href),
      ]),
      ...buildUtilityNavigation().map((link) => link.href),
      ...LIFE_SUPPLY_NAVIGATION.map((link) => link.href),
    ];
    for (const route of ROUTES.filter((entry) => entry.status !== "live")) {
      expect(menuHrefs, route.path).not.toContain(route.path);
    }
  });

  it("keeps the legacy-compatible routes live, and the renamed hub as a redirect", () => {
    expect(isLiveRoute("/our-operations/")).toBe(false);
    expect(ROUTES.find((route) => route.path === "/our-operations/")?.status).toBe("redirect");
    // About absorbed the team on 2026-09-11; the address stays in the
    // table as a redirect row so the sitemap keeps being derived.
    expect(isLiveRoute("/our-team/")).toBe(false);
    expect(ROUTES.find((route) => route.path === "/our-team/")?.status).toBe("redirect");
    for (const path of [
      "/",
      "/about-us/",
      "/medical-supply-solutions/",
      "/investor-relations/",
      "/news/",
      "/contact/",
    ]) {
      expect(isLiveRoute(path), path).toBe(true);
    }
  });

  it("retires each consolidated address as a redirect row that leads somewhere real", () => {
    // Website consolidation, stage 1 (2026-09-10). Four addresses were
    // retired only after their content moved. Each must be gone from the
    // live set, present as a redirect row so the sitemap and menus stay
    // derived, and the fragment it redirects to must be a declared anchor
    // on a live page — otherwise a redirect would land on nothing.
    const destinations: Record<string, string> = {
      [CONSOLIDATED_ROUTES.shop]: sectionRoute(LIFE_SUPPLY_ROUTES.operations, "stores"),
      [CONSOLIDATED_ROUTES.equipment]: sectionRoute(STAGE_3_ROUTES.clinicSolutions, "equipment"),
      [CONSOLIDATED_ROUTES.ongoingSupplies]: sectionRoute(
        STAGE_3_ROUTES.clinicSolutions,
        "ongoing-supplies",
      ),
      [CONSOLIDATED_ROUTES.partnerClinics]: sectionRoute(
        STAGE_3_ROUTES.clinicSolutions,
        "collaboration",
      ),
    };
    for (const [from, to] of Object.entries(destinations)) {
      expect(isLiveRoute(from), from).toBe(false);
      expect(ROUTES.find((route) => route.path === from)?.status, from).toBe("redirect");
      expect(isLiveSection(to), to).toBe(true);
    }
    // Stage 2's retired addresses, on the same rule.
    const stageTwo: Record<string, string> = {
      [CONSOLIDATED_ROUTES.partnerPharmacies]: sectionRoute(PHARMACY_ROUTES.hub, "partner-program"),
      [CONSOLIDATED_ROUTES.careKits]: sectionRoute(METABOLIC_ROUTES.hub, "pathways"),
      [CONSOLIDATED_ROUTES.refills]: sectionRoute(METABOLIC_ROUTES.hub, "replenishment"),
      ...Object.fromEntries(
        KIT_SLUGS.map((slug) => [kitRoute(slug), sectionRoute(METABOLIC_ROUTES.hub, slug)]),
      ),
    };
    for (const [from, to] of Object.entries(stageTwo)) {
      expect(isLiveRoute(from), from).toBe(false);
      expect(ROUTES.find((route) => route.path === from)?.status, from).toBe("redirect");
      expect(isLiveSection(to), to).toBe(true);
    }
    // The `/partners` hazard: retiring the clinic child must never take its
    // siblings with it. Both are retained pages and must stay live.
    expect(isLiveRoute(STAGE_5_ROUTES.partnerSuppliers)).toBe(true);
    expect(isLiveRoute(STAGE_5_ROUTES.partnerAcquisitions)).toBe(true);
  });

  it("accepts only section anchors a page actually declares", () => {
    expect(isLiveSection(STAGE_3_ROUTES.clinicSolutions)).toBe(true);
    expect(isLiveSection(sectionRoute(STAGE_3_ROUTES.clinicSolutions, "planning"))).toBe(true);
    // A fragment no page declares, and a fragment on a page that declares none.
    expect(isLiveSection(sectionRoute(STAGE_3_ROUTES.clinicSolutions, "design-build"))).toBe(false);
    expect(isLiveSection(sectionRoute("/contact/", "stores"))).toBe(false);
    // A fragment on a retired page resolves to nothing, however plausible.
    expect(isLiveSection(sectionRoute(CONSOLIDATED_ROUTES.shop, "stores"))).toBe(false);
    expect(splitSection("/clinic-solutions/#equipment")).toEqual({
      path: "/clinic-solutions/",
      anchor: "equipment",
    });
  });

  it("makes the Stage 3 pages live under their groups", () => {
    for (const path of [...Object.values(BRAND_ROUTES), ...Object.values(STAGE_3_ROUTES)]) {
      expect(isLiveRoute(path), path).toBe(true);
    }
    const groups = buildPrimaryNavigation();
    expect(groups.map((group) => group.label)).toEqual([
      "Home",
      "About",
      "Medical Supplies",
      "Solutions",
      "Investors",
      "Contact",
    ]);
    const businesses = groups.find((group) => group.key === "businesses")!;
    expect(businesses.links.map((link) => link.href)).toEqual([
      BRAND_ROUTES.lifesupply,
      BRAND_ROUTES.wellmart,
      BRAND_ROUTES.balkowitsch,
    ]);
    expect(businesses.links.every((link) => !link.external)).toBe(true);
    // The LifeSupply Clinics brand is the Clinic Solutions section itself.
    expect(BRAND_ROUTES.clinics).toBe(STAGE_3_ROUTES.clinicSolutions);
    expect(SECTION_ANCHORS[STAGE_3_ROUTES.clinicSolutions]).toEqual([
      "planning",
      "equipment",
      "ongoing-supplies",
      "collaboration",
    ]);
    // Every withdrawn address is a redirect row, so the allowlist and sitemap stay derived.
    for (const path of Object.values(WITHDRAWN_ROUTES)) {
      expect(ROUTES.find((route) => route.path === path)?.status, path).toBe("redirect");
    }
    // A child never repeats the trigger's own destination.
    for (const group of groups) {
      expect(group.links.map((link) => link.href)).not.toContain(group.href);
    }
  });

  it("builds the navigation the owner set, with Solutions as a menu and no page", () => {
    // `Home | About | Medical Supplies | Solutions | Investors | Contact`
    // (website consolidation stage 3, 2026-09-10; Home restored 2026-09-11 at
    // the owner's direction, alongside the logo rather than instead of it).
    const groups = buildPrimaryNavigation();
    expect(groups.map((group) => group.label)).toEqual([
      "Home",
      "About",
      "Medical Supplies",
      "Solutions",
      "Investors",
      "Contact",
    ]);
    // Home is a direct link with no dropdown.
    const home = groups[0]!;
    expect(home.href).toBe(LIFE_SUPPLY_ROUTES.home);
    expect(home.links).toEqual([]);

    // Solutions is a menu of exactly three, and no `/solutions` page exists.
    const solutions = groups.find((group) => group.key === "solutions")!;
    expect(solutions.href).toBeNull();
    expect(solutions.links.map((link) => link.href)).toEqual([
      STAGE_3_ROUTES.clinicSolutions,
      PHARMACY_ROUTES.hub,
      METABOLIC_ROUTES.hub,
    ]);
    expect(solutions.links.map((link) => link.label)).toEqual([
      "Clinic Solutions",
      "Pharmacy Solutions",
      "Metabolic Health Solutions",
    ]);
    expect(isLiveRoute("/solutions/")).toBe(false);
    expect(ROUTES.some((route) => route.path.startsWith("/solutions"))).toBe(false);

    // Contact is last, a direct link, and has no dropdown to grow one later.
    const contact = groups.at(-1)!;
    expect(contact.href).toBe(LIFE_SUPPLY_ROUTES.contact);
    expect(contact.links).toEqual([]);

    // Clinic, Pharmacy and Metabolic are no longer top-level categories.
    for (const key of ["clinic", "pharmacy", "metabolic", "partners"]) {
      expect(
        groups.some((group) => group.key === key),
        key,
      ).toBe(false);
    }

    // Shop Stores is the only utility link; Contact left the strip, where it
    // was a second control to the same destination.
    expect(buildUtilityNavigation()).toEqual([
      { label: "Shop Stores", href: sectionRoute(LIFE_SUPPLY_ROUTES.operations, "stores") },
    ]);
    expect(isLiveSection(buildUtilityNavigation()[0]!.href)).toBe(true);
  });

  it("retires the Partners hub while its two retained children stay live", () => {
    expect(isLiveRoute(CONSOLIDATED_ROUTES.partners)).toBe(false);
    expect(ROUTES.find((route) => route.path === CONSOLIDATED_ROUTES.partners)?.status).toBe(
      "redirect",
    );
    expect(isLiveSection(sectionRoute(LIFE_SUPPLY_ROUTES.contact, "business-inquiries"))).toBe(
      true,
    );
    // The hazard the plan names: retiring the hub must not take its children.
    for (const path of [STAGE_5_ROUTES.partnerSuppliers, STAGE_5_ROUTES.partnerAcquisitions]) {
      expect(isLiveRoute(path), path).toBe(true);
    }
    // Suppliers keeps its page and loses its category; Acquisitions moved to
    // the Investors menu, where a reader who wants it already is.
    expect(ROUTES.find((r) => r.path === STAGE_5_ROUTES.partnerSuppliers)?.navGroup).toBeNull();
    expect(ROUTES.find((r) => r.path === STAGE_5_ROUTES.partnerAcquisitions)?.navGroup).toBe(
      "investors",
    );
    // And Suppliers stays reachable without a menu: the footer carries it.
    expect(LIFE_SUPPLY_NAVIGATION.map((link) => link.href)).toContain(
      STAGE_5_ROUTES.partnerSuppliers,
    );
  });

  it("makes Metabolic Health one live page, its pathways sections of it", () => {
    // The care-kits hub, its eight pathway pages and refills became sections
    // on 2026-09-10, so the hub is the only live route left in this family.
    for (const path of Object.values(METABOLIC_ROUTES)) {
      expect(isLiveRoute(path), path).toBe(true);
    }
    // Metabolic Health is an entry in the Solutions menu since stage 3, not a
    // group of its own, and it has no child pages: the pathways,
    // replenishment and collaboration are sections of it.
    const solutions = buildPrimaryNavigation().find((entry) => entry.key === "solutions")!;
    expect(solutions.links.map((link) => link.href)).toContain(METABOLIC_ROUTES.hub);
    expect(KIT_SLUGS).toHaveLength(8);
    // Every pathway publishes an anchor, and it is the slug its page used.
    for (const slug of KIT_SLUGS) {
      expect(isLiveSection(sectionRoute(METABOLIC_ROUTES.hub, slug)), slug).toBe(true);
      expect(isLiveRoute(kitRoute(slug)), slug).toBe(false);
    }
  });

  it("makes the Stage 5 pages live: Investors with five entries, three policy pages", () => {
    for (const path of Object.values(STAGE_5_ROUTES)) expect(isLiveRoute(path), path).toBe(true);
    const groups = buildPrimaryNavigation();
    // Acquisitions joined the Investors menu when Partners was retired, and
    // moved directly below Growth strategy on 2026-09-12 at the product
    // owner's instruction: it is how that strategy is executed.
    expect(groups.find((g) => g.key === "investors")!.links.map((l) => l.href)).toEqual([
      STAGE_5_ROUTES.growthStrategy,
      STAGE_5_ROUTES.partnerAcquisitions,
      STAGE_5_ROUTES.advancedTherapeutics,
      LIFE_SUPPLY_ROUTES.news,
      STAGE_5_ROUTES.disclosures,
    ]);
    // 2026-09-09: News & resources moved from the About group into Investors, replacing the
    // documents index; Shareholder services withdrawn. Both old addresses are redirect rows.
    // The About group's one child was Our team, which became sections of
    // About itself on 2026-09-11, so the item is now a plain link.
    expect(groups.find((g) => g.key === "about")!.links).toEqual([]);
    expect(groups.find((g) => g.key === "about")!.href).toBe("/about-us/");
    for (const path of [WITHDRAWN_ROUTES.investorDocuments, WITHDRAWN_ROUTES.shareholderServices]) {
      expect(isLiveRoute(path), path).toBe(false);
    }
    expect(LIFE_SUPPLY_NAVIGATION.map((l) => l.href)).toContain(LIFE_SUPPLY_ROUTES.news);
    expect(actionHref("news_resources")).toBe(LIFE_SUPPLY_ROUTES.news);
    expect(Object.keys(ACTIONS)).not.toContain("shareholder_services");
    expect(buildLegalNavigation().map((l) => l.href)).toEqual([
      STAGE_5_ROUTES.privacy,
      STAGE_5_ROUTES.terms,
      STAGE_5_ROUTES.accessibility,
    ]);
    // Stage 6: the item templates are live, served from the published read model, never in a menu.
    for (const path of ["/news/[slug]/", "/resources/[slug]/"]) {
      expect(isLiveRoute(path), path).toBe(true);
      expect(ROUTES.find((route) => route.path === path)?.navGroup).toBeNull();
    }
    expect(news.historical).toHaveLength(4);
  });

  it("lists the confirmed leader and the prior site's board with portraits, and redirects the withdrawn profiles", () => {
    expect(team.management.map((member) => member.name)).toEqual(["Abdul Ladha"]);
    expect(team.board.map((director) => director.name)).toEqual([
      "Abdul Ladha",
      "Keith Dolo",
      // The card carries his full professional name since 2026-09-12, the
      // same form his profile has always used.
      "Barrett E.G. Sleeman, P.Eng.",
      "Dr. David Vogt",
    ]);
    expect(team.legacyProfiles.map((p) => p.slug)).toEqual([
      "abdul-ladha",
      "keith-dolo-2",
      "barrett-e-g-sleeman",
      "david-vogt",
    ]);
    // His full title since 2026-09-12 (product owner), on the one card he
    // now appears on.
    expect(legacyTitle("abdul-ladha")).toBe("Chairman & Chief Executive Officer");
    for (const person of [...team.management, ...team.board]) {
      expect(legacyTitle(person.slug), person.slug).toBeTruthy();
      expect(existsSync(join(ROOT, `public${person.image}`)), person.image).toBe(true);
    }
    for (const profile of team.legacyProfiles) {
      expect(profile.bio.length, profile.slug).toBeGreaterThan(0);
      expect(existsSync(join(ROOT, `public${profile.image}`)), profile.image).toBe(true);
    }
    expect(profileRoute("abdul-ladha")).toBe("/abdul-ladha/");
    // The withdrawn addresses stay reachable on the public host and redirect (next.config.ts);
    // a restored director is never also withdrawn.
    expect(team.withdrawnProfileSlugs).toContain("john-anderson-2");
    expect(team.withdrawnProfileSlugs).toContain("ben-hastibakhsh");
    for (const profile of team.legacyProfiles) {
      expect(team.withdrawnProfileSlugs).not.toContain(profile.slug);
    }
    expect(() => legacyTitle("nobody")).toThrow();
  });

  it("keeps investor documents at a request step with no hosted file, and every figure scoped", () => {
    for (const record of news.documents.records) {
      expect(record.href, record.title).toBeNull();
      expect(record.date, record.title).toBeTruthy();
      expect(["Public", "Restricted, on request", "Historical"]).toContain(record.category);
    }
    expect(investorRelations.currentReport.entity).toContain("LifeSupply Health Inc.");
    expect(investorRelations.currentReport.status).toMatch(/unaudited/i);
    // Currency, and every figure carrying it.
    expect(investorRelations.currentReport.currency).toBe("Canadian dollars");
    for (const highlight of investorRelations.currentReport.highlights) {
      expect(highlight.value, highlight.label).toMatch(/^C\$/);
    }
    for (const option of investorRelations.advancedTherapeutics.options) {
      expect(option.status, option.title).toBe("Under evaluation");
      expect(option.dependencies.length, option.title).toBeGreaterThan(0);
    }
  });

  it("leaves Shop Stores as the only utility link once Contact becomes primary", () => {
    // Contact moved into the primary menu as its last item on 2026-09-10, so
    // keeping it in the utility strip would be a second control to the same
    // destination.
    expect(buildUtilityNavigation().map((link) => link.label)).toEqual(["Shop Stores"]);
  });

  it("uses trailing-slash paths throughout", () => {
    for (const route of ROUTES) {
      expect(route.path === "/" || route.path.endsWith("/"), route.path).toBe(true);
    }
  });
});

describe("action registry", () => {
  const approvedEmails = LIFE_SUPPLY_CONTENT.contact.channels.map((channel) => channel.email);
  const brandHosts = BRANDS.map((record) => new URL(record.canonicalUrl).host);

  it("resolves every internal action to a live route, and every fragment to a declared section", () => {
    for (const action of Object.values(ACTIONS)) {
      if (action.destination.kind === "internal") {
        // `isLiveSection` is `isLiveRoute` plus the anchor check, so an
        // action that names a section it invented fails here rather than
        // shipping as a link that scrolls nowhere.
        expect(isLiveSection(action.destination.path), action.key).toBe(true);
      }
    }
  });

  it("mails only approved directory channels", () => {
    for (const action of Object.values(ACTIONS)) {
      if (action.destination.kind === "mailto") {
        expect(approvedEmails, action.key).toContain(action.destination.value);
      }
    }
  });

  it("sends external actions only to registered brand hosts, over HTTPS, with a verification date", () => {
    for (const action of Object.values(ACTIONS)) {
      if (action.destination.kind === "external") {
        const url = new URL(action.destination.url);
        expect(url.protocol, action.key).toBe("https:");
        expect(brandHosts, action.key).toContain(url.host);
        expect(url.search, action.key).toBe("");
        expect(action.verifiedAt, action.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("never resolves the Command Center login", () => {
    expect(Object.keys(ACTIONS)).not.toContain("command_center_login");
    for (const key of Object.keys(ACTIONS) as ActionKey[]) {
      expect(actionHref(key)).not.toMatch(/onrender\.com|\/login|\/dashboard/);
    }
  });

  it("renders hrefs by destination kind", () => {
    expect(actionHref("investor_information")).toBe("/investor-relations/");
    expect(actionHref("clinic_supply_review")).toBe(
      "mailto:info@lifesupply.com?subject=Clinic%20supply%20review",
    );
    // Every inquiry channel arrives with a subject a recipient can route on;
    // navigation and commerce actions carry none.
    for (const key of [
      "discuss_program",
      "supplier_inquiry",
      "acquisition_inquiry",
      "general_inquiry",
      "investor_materials",
    ] as const) {
      expect(actionHref(key), key).toMatch(/^mailto:[^?]+\?subject=[A-Za-z0-9%]/);
    }
    expect(actionHref("shop_lifesupply")).not.toContain("subject=");
    expect(actionHref("explore_businesses")).toBe("/medical-supply-solutions/");
    // Consolidated destinations name a section, and every one of them resolves.
    for (const key of [
      "medical_supply_stores",
      "clinic_equipment",
      "clinic_ongoing_supplies",
      "partner_clinics",
    ] as const) {
      expect(actionHref(key), key).toContain("#");
      expect(isLiveSection(actionHref(key)), key).toBe(true);
    }
    expect(Object.keys(ACTIONS)).not.toContain("shop_services");
    expect(actionHref("pharmacy_hub")).toBe("/pharmacy-solutions/");
    expect(actionHref("plan_clinic")).toBe("https://www.lifesupplyclinics.com/contact-us/");
    expect(actionHref("brand_clinics")).toBe(BRAND_ROUTES.clinics);
    expect(isExternalAction("plan_clinic")).toBe(true);
    expect(isExternalAction("explore_businesses")).toBe(false);
  });

  it("backs every action the content model declares", () => {
    const { clinics, businesses, contact } = LIFE_SUPPLY_CONTENT;
    const declared: string[] = [
      ...Object.values(businesses.pages).flatMap((page) => [...page.actions]),
      ...clinics.hub.actions,
      LIFE_SUPPLY_CONTENT.pharmacy.hub.actions[0],
      LIFE_SUPPLY_CONTENT.pharmacy.hub.actions[1],
      LIFE_SUPPLY_CONTENT.businesses.hub.clinics.action,
      LIFE_SUPPLY_CONTENT.businesses.hub.suppliers.action,
      ...LIFE_SUPPLY_CONTENT.businesses.hub.procurement.actions,
      ...clinics.equipment.actions,
      ...clinics.ongoingSupplies.actions,
      ...clinics.collaboration.actions,
      ...contact.intents.map((intent) => intent.action),
      ...metabolic.hub.actions,
      ...metabolic.kitsHub.actions,
      ...metabolic.refills.actions,
      ...LIFE_SUPPLY_CONTENT.pharmacy.partnerProgram.actions,
      ...metabolic.collaboration.actions,
      ...partners.suppliers.actions,
      ...partners.acquisitions.actions,
      ...investorRelations.hub.actions,
      ...investorRelations.growthStrategy.actions,
      ...investorRelations.advancedTherapeutics.actions,
      ...news.documents.actions,
      ...investorRelations.disclosures.actions,
      ...Object.values(policies).map((p) => p.action),
    ];
    for (const key of declared) {
      expect(Object.keys(ACTIONS), key).toContain(key);
    }
  });

  it("resolves every kit browse reference to a registered category, and states why when there is none", () => {
    for (const kit of metabolic.kits) {
      for (const ref of kit.browse) {
        expect(
          () => getBrandCategory(ref.brand, ref.category),
          `${kit.id} ${ref.category}`,
        ).not.toThrow();
      }
      if (kit.browse.length === 0) expect(kit.browseNote, kit.id).toBeTruthy();
      expect(kit.availability, kit.id).toBe("in_development");
      expect(kit.approvedContents, kit.id).toBeNull();
      expect(
        kit.exclusions.some((rule) => /medication/i.test(rule)),
        kit.id,
      ).toBe(true);
    }
    // K03 has no store destination (S-89).
    expect(metabolic.kits.find((kit) => kit.id === "K03")!.browse).toEqual([]);
    expect(() => getBrandCategory("lifesupply", "Sharps containers")).toThrow();
  });

  it("keeps the published Clinics project links on the Clinics host", () => {
    for (const project of LIFE_SUPPLY_CONTENT.clinics.projects.items) {
      expect(
        project.href.startsWith("https://www.lifesupplyclinics.com/portfolio/"),
        project.title,
      ).toBe(true);
    }
  });
});
