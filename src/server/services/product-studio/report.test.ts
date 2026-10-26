import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { summarizeProjectAssets } from "./index";
import { summarizeProject } from "./report";

const now = new Date("2026-10-26T12:00:00Z");

const asset = (over: Record<string, unknown>) => ({
  id: "a",
  kind: "generated",
  compositionSlot: 1,
  revision: 1,
  fileName: "composition-1-r1.jpg",
  contentType: "image/jpeg",
  bytes: 10,
  contentHash: "h",
  width: null,
  height: null,
  prompt: null,
  modelName: null,
  status: "approved",
  qaResult: { verdict: "pass", confidence: 0.91, requiredCorrections: [] },
  uploadApprovedAt: null,
  publishedAt: null,
  bigCommerceImageId: null,
  createdAt: now,
  ...over,
});

const project = {
  id: "p1",
  productId: "prod1",
  createdById: "u1",
  title: "Thermometer",
  shortDescription: "A thermometer ([x](https://x.y)).",
  confirmedTitle: "Digital Thermometer, Oral",
  finalDescription: "Oral digital thermometer.",
  longDescription: "Intro.\n\nSpecifications:\n- 60 second reading\n- Fahrenheit and Celsius",
  status: "approved",
  currency: "CAD",
  marketLow: 12,
  marketHigh: 20,
  marketMedian: 15,
  researchSummary: {
    identifiedProduct: {
      brand: "Omron",
      model: "MC-246",
      confidence: 0.9,
      productMode: "new_sealed",
      modelIdentifiers: ["MC-246"],
      conditionNotes: [],
    },
    keyDetails: ["60 second reading ([src](https://a.b))"],
    marketBasis: "New, boxed, CAD asking prices.",
  },
  warnings: ["Shelf life varies by document."],
  errorMessage: null,
  descriptionUploadApprovedAt: now,
  descriptionUploadApprovedById: "u1",
  descriptionPublishedAt: null,
  mainImageAssetId: "s2",
  batchId: null,
  createdAt: now,
  updatedAt: now,
  product: {
    id: "prod1",
    name: "Omron MC-246",
    sku: "OM-246",
    storeId: "st",
    sourceSystem: "bigcommerce",
    sourceId: "4411",
    metadata: null,
    store: { name: "LifeSupply" },
  },
  createdBy: { id: "u1", name: "Vid", email: "v@example.com" },
  assets: [
    asset({ id: "src", kind: "source", compositionSlot: null, status: "uploaded", qaResult: null }),
    asset({ id: "s1", compositionSlot: 1, publishedAt: now, bigCommerceImageId: 501 }),
    asset({ id: "s2old", compositionSlot: 2, revision: 1, status: "rejected" }),
    asset({ id: "s2", compositionSlot: 2, revision: 2, uploadApprovedAt: now }),
  ],
  researchSources: [
    {
      id: "r1",
      projectId: "p1",
      sellerName: "Shop A",
      pageTitle: "MC-246",
      url: "https://a.example/p",
      heroImageUrl: null,
      sourceType: "retailer",
      notes: null,
      capturedAt: now,
    },
  ],
  priceObservations: [
    {
      id: "o1",
      projectId: "p1",
      sellerName: "Shop A",
      url: "https://a.example/p",
      price: 20,
      currency: "CAD",
      condition: "New",
      includedAccessories: null,
      notes: null,
      observedAt: now,
    },
    {
      id: "o2",
      projectId: "p1",
      sellerName: "Shop B",
      url: "https://b.example/p",
      price: 12,
      currency: "CAD",
      condition: null,
      includedAccessories: null,
      notes: null,
      observedAt: now,
    },
  ],
  compositions: [
    {
      id: "c1",
      projectId: "p1",
      slot: 1,
      name: "Hero",
      sourceSeller: null,
      sourceUrl: null,
      referenceImageUrl: null,
      rationale: "",
      attributes: { purpose: "Hero image" },
      prompt: "",
      status: "generated",
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "c2",
      projectId: "p1",
      slot: 2,
      name: "Detail",
      sourceSeller: null,
      sourceUrl: null,
      referenceImageUrl: null,
      rationale: "",
      attributes: {},
      prompt: "",
      status: "generated",
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

const logs = [
  {
    id: "l1",
    kind: "image" as const,
    status: "succeeded" as const,
    assetId: "s1",
    bigCommerceImageId: 501,
    errorMessage: null,
    writtenAt: now,
    createdAt: now,
    writtenBy: { id: "u1", name: "Vid", email: "v@example.com" },
    asset: { compositionSlot: 1, revision: 1, fileName: "composition-1-r1.jpg" },
  },
];

describe("summarising a project for the report", () => {
  // The loader's exact type is wider than this fixture; the shape used is covered.
  const snapshot = summarizeProject(project as never, logs as never);

  it("carries the material facts, with links stripped from the copy", () => {
    expect(snapshot.title).toBe("Digital Thermometer, Oral");
    expect(snapshot.shortDescription).toBe("Oral digital thermometer.");
    expect(snapshot.product).toEqual({
      name: "Omron MC-246",
      sku: "OM-246",
      store: "LifeSupply",
      bigCommerceId: "4411",
    });
    expect(snapshot.identity).toMatchObject({
      brand: "Omron",
      model: "MC-246",
      mode: "new_sealed",
    });
    expect(snapshot.keyDetails).toEqual(["60 second reading"]);
    expect(snapshot.description.map((block) => block.type)).toEqual(["paragraph", "title", "list"]);
  });

  it("describes each composition from its latest revision, with review, QA and publishing state", () => {
    expect(snapshot.compositions).toHaveLength(2);
    expect(snapshot.compositions[0]).toMatchObject({
      slot: 1,
      name: "Hero",
      purpose: "Hero image",
      reviewStatus: "approved",
      qaVerdict: "pass",
      qaConfidence: 0.91,
      publishedAt: now,
      bigCommerceImageId: 501,
      isMainImage: false,
    });
    expect(snapshot.compositions[1]).toMatchObject({
      slot: 2,
      revision: 2,
      reviewStatus: "approved",
      uploadApproved: true,
      publishedAt: null,
      isMainImage: true,
    });
  });

  it("orders price observations lowest first and summarises publishing history", () => {
    expect(snapshot.market.observations.map((o) => o.price)).toEqual([12, 20]);
    expect(snapshot.market).toMatchObject({ low: 12, high: 20, median: 15, observationCount: 2 });
    expect(snapshot.publishing.history[0]).toMatchObject({
      label: "Composition 1 → image #501",
      status: "succeeded",
    });
    expect(snapshot.counts).toEqual({ sourceCount: 1, approvedSlots: 2, publishedSlots: 1 });
  });
});

describe("the list's asset counts", () => {
  it("counts photographs, approved latest revisions and published slots", () => {
    expect(
      summarizeProjectAssets([
        {
          kind: "source",
          status: "uploaded",
          compositionSlot: null,
          revision: 1,
          publishedAt: null,
        },
        {
          kind: "generated",
          status: "approved",
          compositionSlot: 1,
          revision: 1,
          publishedAt: now,
        },
        {
          kind: "generated",
          status: "approved",
          compositionSlot: 2,
          revision: 1,
          publishedAt: null,
        },
        {
          kind: "generated",
          status: "needs_review",
          compositionSlot: 2,
          revision: 2,
          publishedAt: null,
        },
      ]),
    ).toEqual({ sourceCount: 1, approvedSlots: 1, publishedSlots: 1 });
  });
});

describe("the report route", () => {
  it("requires both Studio permissions, is read-only, and audits the export", () => {
    const code = readFileSync(
      join(__dirname, "..", "..", "..", "app", "api", "product-studio", "report", "route.ts"),
      "utf8",
    );
    expect(code).toContain("requirePermission(PERMISSIONS.PRODUCTS_UPDATE)");
    expect(code).toContain("requirePermission(PERMISSIONS.AI_USE)");
    expect(code).toContain('action: "export.product_studio.report"');
    expect(code).not.toMatch(/prisma\.\w+\.(create|update|delete|upsert)/);
  });
});
