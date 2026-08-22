import { describe, expect, it } from "vitest";

import { extractCompetitorPrice, extractPageTitle } from "./extraction";

const page = (body: string, title = "SureComfort Insulin Syringes 31G") =>
  "<html><head><title>" + title + "</title>" + body + "</head><body></body></html>";

const jsonLd = (offer: Record<string, unknown>) =>
  '<script type="application/ld+json">' +
  JSON.stringify({ "@type": "Product", name: "Widget", offers: { "@type": "Offer", ...offer } }) +
  "</script>";

const base = { url: "https://competitor.example/p/123", urlVerified: true };

describe("extractPageTitle", () => {
  it("reads and collapses the title", () => {
    expect(extractPageTitle(page("", "  Spaced   Title  "))).toBe("Spaced Title");
  });

  it("returns null when absent", () => {
    expect(extractPageTitle("<html><body>no title</body></html>")).toBeNull();
  });
});

describe("JSON-LD extraction", () => {
  it("reads a standard offer", () => {
    const result = extractCompetitorPrice({
      ...base,
      html: page(jsonLd({ price: "19.99", priceCurrency: "CAD", availability: "InStock" })),
      sku: "22-6504",
      productName: null,
    });
    expect(result.source).toBe("json_ld");
    expect(result.effectivePrice).toBe(19.99);
    expect(result.currency).toBe("CAD");
  });

  it("strips currency symbols and thousands separators", () => {
    const result = extractCompetitorPrice({
      ...base,
      html: page(jsonLd({ price: "$1,299.00", priceCurrency: "USD" })),
      sku: null,
      productName: null,
    });
    expect(result.effectivePrice).toBe(1299);
  });

  it("survives a malformed block alongside a good one", () => {
    const html = page(
      '<script type="application/ld+json">{ not json </script>' +
        jsonLd({ price: "10.00", priceCurrency: "CAD" }),
    );
    expect(
      extractCompetitorPrice({ ...base, html, sku: null, productName: null }).effectivePrice,
    ).toBe(10);
  });
});

describe("meta tag extraction", () => {
  it("reads OpenGraph product price tags", () => {
    const html = page(
      '<meta property="product:price:amount" content="24.50">' +
        '<meta property="product:price:currency" content="CAD">',
    );
    const result = extractCompetitorPrice({ ...base, html, sku: null, productName: null });
    expect(result.effectivePrice).toBe(24.5);
    expect(result.currency).toBe("CAD");
  });
});

describe("conservative refusals", () => {
  it("fails when there is no structured price at all", () => {
    // No DOM guessing: a page with "$19.99" in prose is not a price signal.
    const result = extractCompetitorPrice({
      ...base,
      html: page("<p>Only $19.99 today!</p>"),
      sku: null,
      productName: null,
    });
    expect(result.status).toBe("failed");
    expect(result.effectivePrice).toBeNull();
    expect(result.notes.join(" ")).toMatch(/No structured price/);
  });

  it("is low confidence when the currency cannot be determined", () => {
    const result = extractCompetitorPrice({
      ...base,
      html: page(jsonLd({ price: "9.99" })),
      sku: null,
      productName: null,
      fallbackCurrency: null,
    });
    expect(result.status).toBe("low_confidence");
  });

  it("uses the competitor's configured currency as a documented fallback", () => {
    const result = extractCompetitorPrice({
      ...base,
      html: page(jsonLd({ price: "9.99" })),
      sku: "22-6504",
      productName: null,
      fallbackCurrency: "CAD",
    });
    expect(result.currency).toBe("CAD");
    expect(result.notes.join(" ")).toMatch(/assumed CAD/);
  });

  it("is low confidence when the page mentions neither SKU nor product name", () => {
    const result = extractCompetitorPrice({
      ...base,
      html: page(jsonLd({ price: "9.99", priceCurrency: "CAD" })),
      sku: "NOT-ON-PAGE",
      productName: "Nothing Matching Here",
    });
    expect(result.status).toBe("low_confidence");
    expect(result.notes.join(" ")).toMatch(/Neither SKU nor product name/);
  });

  it("is low confidence on a search or category page", () => {
    for (const url of [
      "https://competitor.example/search?q=syringes",
      "https://competitor.example/category/diabetes",
      "https://competitor.example/cart",
    ]) {
      const result = extractCompetitorPrice({
        html: page(jsonLd({ price: "9.99", priceCurrency: "CAD" }), "Search results"),
        url,
        urlVerified: true,
        sku: "22-6504",
        productName: null,
      });
      expect(result.status, url).toBe("low_confidence");
    }
  });

  it("marks an out-of-stock offer unavailable rather than valid", () => {
    const result = extractCompetitorPrice({
      ...base,
      html: page(
        jsonLd({
          price: "9.99",
          priceCurrency: "CAD",
          availability: "https://schema.org/OutOfStock",
        }),
      ),
      sku: "22-6504",
      productName: null,
    });
    expect(result.status).toBe("unavailable");
  });

  it("only reaches valid with corroboration", () => {
    const html = page(jsonLd({ price: "19.99", priceCurrency: "CAD" }) + "<p>SKU 22-6504</p>");
    const verified = extractCompetitorPrice({ ...base, html, sku: "22-6504", productName: null });
    expect(verified.status).toBe("valid");
    expect(verified.confidence).toBeGreaterThanOrEqual(0.7);

    // Same page, unverified URL and no SKU on the page: not valid.
    const weak = extractCompetitorPrice({
      html: page(jsonLd({ price: "19.99", priceCurrency: "CAD" })),
      url: base.url,
      urlVerified: false,
      sku: "MISSING",
      productName: null,
    });
    expect(weak.status).toBe("low_confidence");
  });

  it("never stores the whole page as evidence", () => {
    const big = page(jsonLd({ price: "9.99", priceCurrency: "CAD" }) + "x".repeat(50_000));
    const result = extractCompetitorPrice({ ...base, html: big, sku: null, productName: null });
    expect((result.evidenceText ?? "").length).toBeLessThan(1200);
  });
});
