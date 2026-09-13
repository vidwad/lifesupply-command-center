import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getBrand, type OperatingBrandKey } from "@/lib/public-site/brands";
import { getGraphic } from "@/lib/public-site/graphics";

import { StoreProfile } from "./operations";

/**
 * The three store profiles on the consolidated Medical Supply Solutions page.
 *
 * This file used to cover the decorative category visuals on the three
 * standalone brand pages. Those pages became sections of one page on
 * 2026-09-12 (product owner), so it covers the profiles that replaced them:
 * each store's own shop link, its verified category URLs and its own support
 * address, and the product still life that stands in for the Balkowitsch
 * warehouse photograph on this page.
 */
describe("Store profiles on Medical Supply Solutions", () => {
  it.each(["lifesupply", "wellmart", "balkowitsch"] as const)(
    "gives %s its own anchor, shop link, categories and support address",
    (brandKey: OperatingBrandKey) => {
      const record = getBrand(brandKey);
      const markup = renderToStaticMarkup(<StoreProfile record={record} />);

      expect(markup).toContain(record.name);
      expect(markup).toContain(record.profile?.positioning ?? "");
      // Every category link is in the document, open or shut, so the list is
      // never something only a script can reveal.
      for (const category of record.categories) {
        expect(markup, category.url).toContain(category.url);
        expect(markup, category.label).toContain(category.displayLabel ?? category.label);
      }
      expect(record.supportUrl).not.toBeNull();
      expect(markup).toContain(record.supportUrl ?? "");
      expect(markup).toContain(record.canonicalUrl);
      // A native disclosure: it works without JavaScript and several may be
      // open at once, which an accordion with one open panel cannot do.
      expect(markup).toContain("<details");
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
