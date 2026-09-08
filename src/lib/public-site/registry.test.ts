/**
 * Registry contracts: the brand, route, and action registries are the only
 * places a public destination is resolved, and these tests keep them honest.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ACTIONS, actionHref, isExternalAction, type ActionKey } from "@/lib/public-site/actions";
import { BRANDS, OPERATING_BRANDS, brandGeography, getBrand } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import {
  BRAND_ROUTES,
  LIFE_SUPPLY_NAVIGATION,
  LIVE_ROUTES,
  ROUTES,
  STAGE_3_ROUTES,
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
      expect(existsSync(routeFile(route.path)), route.path).toBe(true);
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

  it("keeps the legacy-compatible routes live", () => {
    for (const path of [
      "/",
      "/about-us/",
      "/our-operations/",
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
      "Our Businesses",
      "Clinic Solutions",
      "Investors",
      "About",
    ]);
    const businesses = groups.find((group) => group.key === "businesses")!;
    expect(businesses.links.map((link) => link.href)).toEqual([
      BRAND_ROUTES.lifesupply,
      BRAND_ROUTES.wellmart,
      BRAND_ROUTES.clinics,
      BRAND_ROUTES.balkowitsch,
      STAGE_3_ROUTES.technology,
    ]);
    expect(businesses.links.every((link) => !link.external)).toBe(true);
    const clinic = groups.find((group) => group.key === "clinic")!;
    expect(clinic.href).toBe(STAGE_3_ROUTES.clinicSolutions);
    expect(clinic.links.map((link) => link.href)).toEqual([
      STAGE_3_ROUTES.designBuild,
      STAGE_3_ROUTES.equipment,
      STAGE_3_ROUTES.ongoingSupplies,
    ]);
    // A child never repeats the trigger's own destination.
    for (const group of groups) {
      expect(group.links.map((link) => link.href)).not.toContain(group.href);
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
    expect(actionHref("clinic_supply_review")).toBe("mailto:ben@lifesupply.com");
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
      ...businesses.technology.actions,
      ...clinics.brandPage.actions,
      ...clinics.designBuild.actions,
      ...clinics.equipment.actions,
      ...clinics.ongoingSupplies.actions,
      ...shop.choices.map((choice) => choice.action),
      ...contact.intents.map((intent) => intent.action),
    ];
    for (const key of declared) {
      expect(Object.keys(ACTIONS), key).toContain(key);
    }
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
