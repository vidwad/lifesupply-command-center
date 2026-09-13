import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getBrand, getBrandCategory, type OperatingBrandKey } from "@/lib/public-site/brands";
import { getGraphic } from "@/lib/public-site/graphics";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

import { StoreProfile } from "./operations";

/**
 * The three store profiles on the consolidated Medical Supply Solutions page,
 * and the category explorer that carries their category links.
 *
 * This file used to cover the decorative category visuals on the three
 * standalone brand pages. Those pages became sections of one page on
 * 2026-09-12 (product owner), and on 2026-09-13 the category links left the
 * profiles for the explorer above them. So it covers the profiles that
 * remain — each store's own shop link and support address, and the product
 * still life that stands in for the Balkowitsch warehouse photograph — and
 * that the explorer reaches every verified category page the registry holds.
 */
describe("Store profiles on Medical Supply Solutions", () => {
  it.each(["lifesupply", "wellmart", "balkowitsch"] as const)(
    "gives %s its own anchor, shop link and support address, and no category list",
    (brandKey: OperatingBrandKey) => {
      const record = getBrand(brandKey);
      const markup = renderToStaticMarkup(<StoreProfile record={record} />);

      expect(markup).toContain(record.name);
      expect(markup).toContain(record.profile?.positioning ?? "");
      expect(record.supportUrl).not.toBeNull();
      expect(markup).toContain(record.supportUrl ?? "");
      expect(markup).toContain(record.canonicalUrl);
      // The category list moved to the explorer on 2026-09-13, so the
      // profile carries no disclosure and no category page of its own.
      expect(markup).not.toContain("<details");
      for (const category of record.categories) {
        expect(markup, category.url).not.toContain(category.url);
      }
    },
  );

  it("uses the product still life for Balkowitsch, not the warehouse photograph", () => {
    const markup = renderToStaticMarkup(<StoreProfile record={getBrand("balkowitsch")} />);
    const replacement = getGraphic("balkowitschProducts");

    expect(markup).toContain(encodeURIComponent(replacement.src));
    expect(markup).toContain(replacement.alt);
    // The shared brand asset is untouched and still serves other pages; it
    // just does not appear on this one, because it shows a person packing in
    // a warehouse and could be read as an employee or an operating site.
    expect(markup).not.toContain("balkowitsch-greyscale");
  });

  it("keeps the two Canadian stores on their own photographs", () => {
    for (const brandKey of ["lifesupply", "wellmart"] as const) {
      const markup = renderToStaticMarkup(<StoreProfile record={getBrand(brandKey)} />);
      expect(markup, brandKey).not.toContain("balkowitsch-products");
    }
  });
});

describe("Category explorer coverage", () => {
  /**
   * Store categories that are a parent of others rather than a need in
   * themselves, and so have no tile: Balkowitsch's "Health" holds its
   * measuring-device and wound-care ranges, which have their own tiles.
   */
  const PARENT_CATEGORIES: Record<OperatingBrandKey, readonly string[]> = {
    lifesupply: [],
    wellmart: [],
    clinics: [],
    balkowitsch: ["Health"],
  };

  it("reaches every verified category page on every store", () => {
    const reached = new Set<string>();
    for (const item of LIFE_SUPPLY_CONTENT.businesses.hub.categories.items) {
      for (const entry of item.stores) {
        for (const label of entry.categories) reached.add(getBrandCategory(entry.brand, label).url);
      }
    }
    for (const brandKey of ["lifesupply", "wellmart", "balkowitsch"] as const) {
      for (const category of getBrand(brandKey).categories) {
        if (PARENT_CATEGORIES[brandKey].includes(category.label)) continue;
        expect(reached.has(category.url), `${brandKey}: ${category.label}`).toBe(true);
      }
    }
  });
});
