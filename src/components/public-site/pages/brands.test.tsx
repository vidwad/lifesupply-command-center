import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getGraphic } from "@/lib/public-site/graphics";

import { StoreCategoryVisual } from "./brands";

describe("Storefront category visuals", () => {
  it.each([
    ["lifesupply", "suppliesFlatlay"],
    ["wellmart", "equipment"],
    ["balkowitsch", "shipping"],
  ] as const)("renders %s with an approved decorative conceptual image", (brandKey, graphicKey) => {
    const markup = renderToStaticMarkup(<StoreCategoryVisual brandKey={brandKey} />);

    expect(markup).toContain(`data-storefront-category-visual="${brandKey}"`);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('alt=""');
    expect(markup).toContain(encodeURIComponent(getGraphic(graphicKey).src));
  });
});
