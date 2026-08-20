import { describe, expect, it } from "vitest";

import { prepareProductStudioIntake, ProductStudioInputError } from "./index";
import { collectWebSearchEvidenceUrls, findUnsupportedCitedDomains } from "./openai";
import { compileProductImagePrompt } from "./prompts";
import { planGenerationRevision } from "./revisions";
import { productStudioQaSchema, productStudioResearchSchema } from "./types";

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
        includedAccessories: "Hood, case",
        notes: "Recently observed active listing.",
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
    purpose: "Hero image establishing the complete product",
    sourceSeller: "Example Camera",
    sourceUrl: "https://example.com/product",
    referenceImageUrl: "https://example.com/product.jpg",
    whyEffective: "Clear product assessment.",
    layout: "Centered complete product",
    background: "Warm white",
    lighting: "Large diffused key",
    cameraAngle: "Three-quarter",
    productOrientation: "Upright, mount facing down",
    productPlacement: "Centered with negative space",
    shadowTreatment: "Soft grounded contact shadow",
    cropAndNegativeSpace: "Complete product with 12% margin on every side",
    depthOfField: "Deep — entire barrel in focus",
    props: [],
    accessoriesExclude: ["tripod collar"],
    conditionMustShow: ["barrel wear near the zoom ring"],
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

  it("rejects a missing composition slot", () => {
    const result = productStudioResearchSchema.safeParse({
      ...base,
      compositions: base.compositions.slice(0, 3),
    });
    expect(result.success).toBe(false);
  });
});

describe("Product Studio QA contract", () => {
  const qa = {
    identityScore: 0.95,
    conditionFidelityScore: 0.9,
    compositionScore: 0.85,
    textIntegrity: "pass" as const,
    verdict: "pass" as const,
    differences: [],
    requiredCorrections: [],
    warnings: [],
    confidence: 0.9,
  };

  it("accepts a complete QA result", () => {
    expect(productStudioQaSchema.parse(qa).verdict).toBe("pass");
  });

  it("requires corrections and confidence fields", () => {
    const { requiredCorrections: _corrections, confidence: _confidence, ...incomplete } = qa;
    expect(productStudioQaSchema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects an out-of-range confidence", () => {
    expect(productStudioQaSchema.safeParse({ ...qa, confidence: 1.4 }).success).toBe(false);
  });
});

describe("Product Studio source verification", () => {
  const research = productStudioResearchSchema.parse(base);

  it("collects URLs only from web-search tool evidence and citation annotations", () => {
    const output = [
      {
        type: "web_search_call",
        id: "ws_1",
        status: "completed",
        action: {
          type: "search",
          query: "nikon vr ii",
          sources: [{ type: "url", url: "https://example.com/product" }],
        },
      },
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: '{"benchmark": "https://invented-shop.example.net/listing"}',
            annotations: [{ type: "url_citation", url: "https://cited.example.org/page" }],
          },
        ],
      },
    ];
    const urls = collectWebSearchEvidenceUrls(output);
    expect(urls).toContain("https://example.com/product");
    expect(urls).toContain("https://cited.example.org/page");
    // A URL the model merely wrote in its own message text is NOT evidence.
    expect(urls.join(" ")).not.toContain("invented-shop.example.net");
  });

  it("accepts research whose cited domains are backed by evidence", () => {
    expect(findUnsupportedCitedDomains(research, ["https://www.example.com/product"])).toEqual([]);
  });

  it("flags invented seller domains that the web search never returned", () => {
    expect(
      findUnsupportedCitedDomains(research, ["https://different-seller.example.io/x"]),
    ).toEqual(["example.com"]);
  });
});

describe("Product Studio prompt compiler", () => {
  const prompt = compileProductImagePrompt({
    title: base.optimizedListing.title,
    shortDescription: base.optimizedListing.shortDescription,
    identity: base.identifiedProduct,
    composition: base.compositions[0]!,
  });

  it("locks identity to user photographs and forbids invented condition", () => {
    expect(prompt).toContain("sole authoritative visual reference");
    expect(prompt).toContain("AF-S NIKKOR 70-200mm f/2.8G ED VR II");
    expect(prompt).toContain("Do not add invented accessories");
    expect(prompt).toContain("do not reproduce retailer-specific text");
  });

  it("carries the composition's condition and accessory constraints", () => {
    expect(prompt).toContain("barrel wear near the zoom ring");
    expect(prompt).toContain("tripod collar");
    expect(prompt).toContain("Depth of field");
    expect(prompt).toContain("Shadow / reflection");
  });

  it("never feeds competitor imagery or URLs into image generation", () => {
    // The brief's sourceUrl/referenceImageUrl are research traceability only:
    // no URL of any kind may reach the image model's prompt.
    expect(prompt).not.toContain("http://");
    expect(prompt).not.toContain("https://");
    expect(prompt).not.toContain("example.com");
  });
});

describe("Product Studio generation revisions", () => {
  it("starts at revision 1 when no image exists", () => {
    expect(planGenerationRevision(null)).toEqual({ action: "create", revision: 1 });
  });

  it("creates the next revision only after a human rejection", () => {
    expect(planGenerationRevision({ revision: 2, status: "rejected" })).toEqual({
      action: "create",
      revision: 3,
    });
  });

  it("refuses to regenerate over an image that is still under or past review", () => {
    for (const status of ["needs_review", "approved"]) {
      expect(planGenerationRevision({ revision: 1, status })).toEqual({ action: "reuse" });
    }
  });
});

describe("Product Studio intake validation (server-side)", () => {
  const png = (name: string, bytes: number, type = "image/png") =>
    new File([Buffer.alloc(Math.max(bytes, 0), 1)], name, { type });
  const valid = { title: "Nikon 70-200mm lens", shortDescription: "Used telephoto zoom lens." };

  it("accepts 1–4 well-formed images and hashes each one", async () => {
    const result = await prepareProductStudioIntake({
      ...valid,
      files: [png("front.png", 2048), png("back.png", 2048, "image/webp")],
    });
    expect(result.prepared).toHaveLength(2);
    expect(result.prepared[0]!.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects unsupported MIME types", async () => {
    await expect(
      prepareProductStudioIntake({ ...valid, files: [png("clip.gif", 2048, "image/gif")] }),
    ).rejects.toBeInstanceOf(ProductStudioInputError);
  });

  it("rejects empty files", async () => {
    await expect(
      prepareProductStudioIntake({ ...valid, files: [png("empty.png", 0)] }),
    ).rejects.toBeInstanceOf(ProductStudioInputError);
  });

  it("rejects oversized files", async () => {
    await expect(
      prepareProductStudioIntake({ ...valid, files: [png("big.png", 8 * 1024 * 1024 + 1)] }),
    ).rejects.toBeInstanceOf(ProductStudioInputError);
  });

  it("rejects zero or more than four images", async () => {
    await expect(prepareProductStudioIntake({ ...valid, files: [] })).rejects.toBeInstanceOf(
      ProductStudioInputError,
    );
    await expect(
      prepareProductStudioIntake({
        ...valid,
        files: [1, 2, 3, 4, 5].map((n) => png(`p${n}.png`, 128)),
      }),
    ).rejects.toBeInstanceOf(ProductStudioInputError);
  });

  it("rejects out-of-bounds text fields", async () => {
    await expect(
      prepareProductStudioIntake({
        title: "ab",
        shortDescription: valid.shortDescription,
        files: [png("a.png", 128)],
      }),
    ).rejects.toBeInstanceOf(ProductStudioInputError);
    await expect(
      prepareProductStudioIntake({
        title: valid.title,
        shortDescription: "short",
        files: [png("a.png", 128)],
      }),
    ).rejects.toBeInstanceOf(ProductStudioInputError);
  });
});
