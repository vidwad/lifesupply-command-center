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
  LIFE_SUPPLY_NAVIGATION,
  LIVE_ROUTES,
  ROUTES,
  buildPrimaryNavigation,
  buildUtilityNavigation,
  isLiveRoute,
} from "@/lib/public-site/routes";

const ROOT = join(__dirname, "..", "..", "..");

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
        expect(new URL(record.supportUrl).host, record.key).toBe(url.host);
      }
    }
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
  it("keeps every legacy-compatible route live and every planned route out of the menus", () => {
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
      expect(existsSync(join(ROOT, "src/app", path === "/" ? "" : path, "page.tsx")), path).toBe(
        true,
      );
    }
    for (const route of ROUTES.filter((entry) => entry.status !== "live")) {
      const menuHrefs = [
        ...buildPrimaryNavigation().flatMap((group) => [
          group.href,
          ...group.links.map((l) => l.href),
        ]),
        ...buildUtilityNavigation().map((link) => link.href),
        ...LIFE_SUPPLY_NAVIGATION.map((link) => link.href),
      ];
      expect(menuHrefs, route.path).not.toContain(route.path);
    }
  });

  it("derives the primary groups from live hubs only", () => {
    const groups = buildPrimaryNavigation();
    expect(groups.map((group) => group.label)).toEqual(["Our Businesses", "Investors", "About"]);
    const businesses = groups.find((group) => group.key === "businesses")!;
    expect(businesses.links.filter((link) => link.external).map((link) => link.href)).toEqual(
      OPERATING_BRANDS.map((record) => record.canonicalUrl),
    );
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
    expect(isExternalAction("plan_clinic")).toBe(true);
    expect(isExternalAction("explore_businesses")).toBe(false);
  });

  it("is the only registry the live routes' primary actions need", () => {
    for (const route of LIVE_ROUTES) {
      expect(route.path === "/" || route.path.endsWith("/")).toBe(true);
    }
  });
});
