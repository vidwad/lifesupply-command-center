import { describe, expect, it } from "vitest";

import { compileProductImagePrompt } from "./prompts";
import { productStudioResearchSchema } from "./types";

const base = {
  identifiedProduct: {
    brand: "Nikon",
    model: "AF-S NIKKOR 70-200mm f/2.8G ED VR II",
    canonicalTitle: "Nikon AF-S NIKKOR 70-200mm f/2.8G ED VR II Lens",
    modelIdentifiers: ["2185", "HB-48"],
    conditionNotes: ["normal visible handling wear"],
    confidence: 0.98,
  },
  optimizedListing: {
    title: "Nikon AF-S NIKKOR 70-200mm f/2.8G ED VR II Lens",
    shortDescription: "Used F-mount professional telephoto zoom with original box, case, and hood.",
    keyDetails: ["F-mount", "VR II"],
  },
  benchmarkListing: {
    sellerName: "Example Camera",
    url: "https://example.com/product",
    heroImageUrl: "https://example.com/product.jpg",
    whyStrongDescription: "Clear exact-model identification and condition disclosure.",
    whyStrongHero: "Complete product, neutral background, and readable controls.",
  },
  market: {
    currency: "CAD",
    low: 700,
    high: 1100,
    median: 900,
    basis: "Current used asking prices for the exact VR II generation.",
    observations: [
      {
        sellerName: "Example Camera",
        url: "https://example.com/product",
        price: 899,
        currency: "CAD",
        condition: "Used",
      },
    ],
  },
  sources: [
    {
      sellerName: "Example Camera",
      pageTitle: "Exact product",
      url: "https://example.com/product",
      heroImageUrl: "https://example.com/product.jpg",
      sourceType: "used_specialist" as const,
      notes: "Exact generation and condition-specific listing.",
    },
  ],
  compositions: [1, 2, 3, 4].map((slot) => ({
    slot,
    name: `Composition ${slot}`,
    sourceSeller: "Example Camera",
    sourceUrl: "https://example.com/product",
    referenceImageUrl: "https://example.com/product.jpg",
    whyEffective: "Clear product assessment.",
    layout: "Centered complete product",
    background: "Warm white",
    lighting: "Large diffused key",
    cameraAngle: "Three-quarter",
    productPlacement: "Centered with negative space",
    props: [],
    negativeConstraints: ["Do not change the lens generation"],
  })),
  methodology: "Retail prevalence and condition-assessment proxy, not private conversion data.",
  warnings: [],
};

describe("Product Studio research contract", () => {
  it("accepts exactly four uniquely numbered compositions", () => {
    expect(productStudioResearchSchema.parse(base).compositions).toHaveLength(4);
  });

  it("rejects an inverted market range", () => {
    const result = productStudioResearchSchema.safeParse({
      ...base,
      market: { ...base.market, low: 1200, high: 800 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate composition slots", () => {
    const result = productStudioResearchSchema.safeParse({
      ...base,
      compositions: base.compositions.map((item) => ({ ...item, slot: 1 })),
    });
    expect(result.success).toBe(false);
  });
});

describe("Product Studio prompt compiler", () => {
  it("locks identity to user photographs and forbids invented condition", () => {
    const prompt = compileProductImagePrompt({
      title: base.optimizedListing.title,
      shortDescription: base.optimizedListing.shortDescription,
      identity: base.identifiedProduct,
      composition: base.compositions[0]!,
    });
    expect(prompt).toContain("sole authoritative visual reference");
    expect(prompt).toContain("AF-S NIKKOR 70-200mm f/2.8G ED VR II");
    expect(prompt).toContain("Do not add invented accessories");
    expect(prompt).toContain("do not reproduce retailer-specific text");
  });
});
