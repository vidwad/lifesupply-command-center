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
  LIFE_SUPPLY_NAVIGATION,
  LIVE_ROUTES,
  METABOLIC_ROUTES,
  ROUTES,
  STAGE_3_ROUTES,
  WITHDRAWN_ROUTES,
  STAGE_5_ROUTES,
  buildLegalNavigation,
  kitRoute,
  profileRoute,
  buildPrimaryNavigation,
  buildUtilityNavigation,
  isLiveRoute,
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
    expect(getBrand("corporate").legalEntity).toBe("LifeSupply Health Supplies Inc.");
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
    for (const path of [
      "/",
      "/about-us/",
      "/medical-supply-solutions/",
      "/our-team/",
      "/investor-relations/",
      "/news/",
      "/contact/",
      "/shop/",
    ]) {
      expect(isLiveRoute(path), path).toBe(true);
    }
  });

  it("makes the Stage 3 pages live under their groups", () => {
    for (const path of [...Object.values(BRAND_ROUTES), ...Object.values(STAGE_3_ROUTES)]) {
      expect(isLiveRoute(path), path).toBe(true);
    }
    const groups = buildPrimaryNavigation();
    expect(groups.map((group) => group.label)).toEqual([
      "Home",
      "Medical Supply Solutions",
      "Clinic Solutions",
      "Metabolic Health",
      "Pharmacy Solutions",
      "Partners",
      "Investors",
      "About",
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
    const clinic = groups.find((group) => group.key === "clinic")!;
    expect(clinic.href).toBe(STAGE_3_ROUTES.clinicSolutions);
    expect(clinic.links.map((link) => link.href)).toEqual([
      STAGE_3_ROUTES.equipment,
      STAGE_3_ROUTES.ongoingSupplies,
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

  it("makes the Stage 4 pages live under the Metabolic Health group, kit pages out of the menu", () => {
    for (const path of [...Object.values(METABOLIC_ROUTES), ...KIT_SLUGS.map(kitRoute)]) {
      expect(isLiveRoute(path), path).toBe(true);
    }
    const group = buildPrimaryNavigation().find((entry) => entry.key === "metabolic")!;
    expect(group.href).toBe(METABOLIC_ROUTES.hub);
    expect(group.links.map((link) => link.href)).toEqual([
      METABOLIC_ROUTES.careKits,
      METABOLIC_ROUTES.refills,
    ]);
    expect(KIT_SLUGS).toHaveLength(8);
  });

  it("makes the Stage 5 pages live: Partners with four children, Investors with five, three policy pages", () => {
    for (const path of Object.values(STAGE_5_ROUTES)) expect(isLiveRoute(path), path).toBe(true);
    const groups = buildPrimaryNavigation();
    expect(groups.find((g) => g.key === "partners")!.links.map((l) => l.href)).toEqual([
      STAGE_5_ROUTES.partnerClinics,
      STAGE_5_ROUTES.partnerPharmacies,
      STAGE_5_ROUTES.partnerSuppliers,
      STAGE_5_ROUTES.partnerAcquisitions,
    ]);
    expect(groups.find((g) => g.key === "investors")!.links.map((l) => l.href)).toEqual([
      STAGE_5_ROUTES.growthStrategy,
      STAGE_5_ROUTES.advancedTherapeutics,
      STAGE_5_ROUTES.investorDocuments,
      STAGE_5_ROUTES.shareholderServices,
      STAGE_5_ROUTES.disclosures,
    ]);
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

  it("lists only the confirmed leader, resolves the title through the dated profile, and redirects the withdrawn profiles", () => {
    expect(team.management.map((member) => member.name)).toEqual(["Abdul Ladha"]);
    for (const member of team.management)
      expect(legacyTitle(member.slug), member.slug).toBeTruthy();
    expect(team.legacyProfiles.map((p) => p.slug)).toEqual(["abdul-ladha"]);
    expect(profileRoute("abdul-ladha")).toBe("/abdul-ladha/");
    expect("board" in team).toBe(false);
    // The withdrawn addresses stay reachable on the public host and redirect (next.config.ts).
    expect(team.withdrawnProfileSlugs).toContain("john-anderson-2");
    expect(team.withdrawnProfileSlugs).toContain("ben-hastibakhsh");
    expect(team.withdrawnProfileSlugs).not.toContain("abdul-ladha");
    expect(() => legacyTitle("nobody")).toThrow();
  });

  it("keeps investor documents at a request step with no hosted file, and every figure scoped", () => {
    for (const record of investorRelations.documents.records) {
      expect(record.href, record.title).toBeNull();
      expect(record.date, record.title).toBeTruthy();
      expect(["Public", "Restricted, on request", "Historical"]).toContain(record.category);
    }
    expect(investorRelations.currentReport.entity).toContain("LifeSupply Health Supplies Inc.");
    expect(investorRelations.currentReport.status).toMatch(/unaudited/i);
    for (const theme of investorRelations.advancedTherapeutics.themes) {
      expect(theme.status, theme.title).toBe("Under evaluation");
      expect(theme.dependencies.length, theme.title).toBeGreaterThan(0);
    }
  });

  it("keeps Shop & Services and Contact as utility links", () => {
    expect(buildUtilityNavigation().map((link) => link.href)).toEqual(["/shop/", "/contact/"]);
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

  it("resolves every internal action to a live route", () => {
    for (const action of Object.values(ACTIONS)) {
      if (action.destination.kind === "internal") {
        expect(isLiveRoute(action.destination.path), action.key).toBe(true);
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
    expect(actionHref("clinic_supply_review")).toBe("mailto:info@lifesupply.com");
    expect(actionHref("explore_businesses")).toBe("/medical-supply-solutions/");
    expect(actionHref("pharmacy_hub")).toBe("/pharmacy-solutions/");
    expect(actionHref("plan_clinic")).toBe("https://www.lifesupplyclinics.com/contact-us/");
    expect(actionHref("brand_clinics")).toBe(BRAND_ROUTES.clinics);
    expect(isExternalAction("plan_clinic")).toBe(true);
    expect(isExternalAction("explore_businesses")).toBe(false);
  });

  it("backs every action the content model declares", () => {
    const { clinics, businesses, shop, contact, homepage } = LIFE_SUPPLY_CONTENT;
    const declared: string[] = [
      ...homepage.clinicLifecycle.steps.map((step) => step.action),
      homepage.metabolic.action,
      ...homepage.paths.map((path) => path.action),
      ...Object.values(businesses.pages).flatMap((page) => [...page.actions]),
      ...clinics.hub.actions,
      ...clinics.hub.needs.map((need) => need.action),
      LIFE_SUPPLY_CONTENT.pharmacy.hub.actions[0],
      LIFE_SUPPLY_CONTENT.pharmacy.hub.actions[1],
      LIFE_SUPPLY_CONTENT.businesses.hub.clinics.action,
      LIFE_SUPPLY_CONTENT.businesses.hub.services.action,
      ...clinics.equipment.actions,
      ...clinics.ongoingSupplies.actions,
      ...shop.choices.map((choice) => choice.action),
      ...contact.intents.map((intent) => intent.action),
      ...metabolic.hub.actions,
      ...metabolic.kitsHub.actions,
      ...metabolic.refills.actions,
      ...partners.hub.relationships.map((r) => r.action),
      partners.hub.procurement.action,
      ...partners.clinics.actions,
      ...partners.pharmacies.actions,
      ...partners.suppliers.actions,
      ...partners.acquisitions.actions,
      ...investorRelations.hub.actions,
      ...investorRelations.growthStrategy.actions,
      ...investorRelations.advancedTherapeutics.actions,
      ...investorRelations.documents.actions,
      ...investorRelations.shareholderServices.actions,
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
