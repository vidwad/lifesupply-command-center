import { readFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { summarizeProjectAssets } from "./index";
import { summarizeProject } from "./report";
import { REPORT_IMAGE_EDGE, shrinkForReport } from "./report-images";

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
    variants: [{ sku: "OM-246", price: 18, costPrice: 0 }],
    supplierProducts: [{ cost: 9 }],
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
    // The store's own listing: price from the variant, cost from the
    // preferred supplier since the variant's cost is zero (unknown).
    expect(snapshot.market.store).toMatchObject({
      storeName: "LifeSupply",
      price: 18,
      cost: 9,
      margin: 0.5,
      position: "within",
      vsMedian: 0.2,
      cheaperSellers: 1,
      observedSellers: 2,
    });
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

describe("report images", () => {
  it("shrinks a large PNG to a report-sized JPEG and converts WebP", async () => {
    const big = await sharp({
      create: { width: 2048, height: 1536, channels: 4, background: "#c0392b" },
    })
      .png()
      .toBuffer();
    const shrunk = await shrinkForReport({ contentType: "image/png", data: new Uint8Array(big) });
    expect(shrunk?.format).toBe("jpg");
    const meta = await sharp(Buffer.from(shrunk!.data)).metadata();
    expect(meta.format).toBe("jpeg");
    expect(Math.max(meta.width!, meta.height!)).toBe(REPORT_IMAGE_EDGE);
    expect(shrunk!.data.byteLength).toBeLessThan(big.byteLength / 10);

    const webp = await sharp({
      create: { width: 300, height: 200, channels: 3, background: "#fff" },
    })
      .webp()
      .toBuffer();
    const converted = await shrinkForReport({
      contentType: "image/webp",
      data: new Uint8Array(webp),
    });
    expect(converted?.format).toBe("jpg");
    // A small image is not enlarged.
    expect((await sharp(Buffer.from(converted!.data)).metadata()).width).toBe(300);
  });
  it("returns null for a missing asset or bytes that are not an image", async () => {
    expect(await shrinkForReport(null)).toBeNull();
    expect(
      await shrinkForReport({ contentType: "image/png", data: new Uint8Array([1, 2, 3]) }),
    ).toBeNull();
    expect(
      await shrinkForReport({ contentType: "text/plain", data: new Uint8Array(10) }),
    ).toBeNull();
  });
  it("the report builder reads stored thumbnails and never a full image itself", () => {
    const code = readFileSync(join(__dirname, "report.ts"), "utf8");
    expect(code).toContain("reportImageForAsset(asset.id, budget)");
    expect(code).toContain("MAX_LAZY_THUMBNAILS_PER_REPORT");
    expect(code).not.toMatch(/getProductStudioAsset|data: true|format: "png"/);
    // The web service reads a full image only inside the budgeted lazy fill.
    const thumbs = readFileSync(join(__dirname, "report-thumbnails.ts"), "utf8");
    expect(thumbs).toContain("if (budget.remaining <= 0) return { image: null, pending: true };");
    expect(thumbs).toContain('AND "reportThumbnail" IS NULL');
    // A cache fill is not audited and does not go through Prisma's update.
    expect(thumbs).not.toMatch(/writeAudit|productStudioAsset\.update\(/);
  });
  it("every asset creation stores a thumbnail, and the worker backfills the rest", () => {
    const studio = (name: string) => readFileSync(join(__dirname, name), "utf8");
    expect(studio("index.ts")).toContain(
      "reportThumbnail: await reportThumbnailFor(data, file.type)",
    );
    expect(studio("bulk.ts")).toContain(
      "reportThumbnail: await reportThumbnailFor(seed.data, seed.contentType)",
    );
    expect(studio("jobs.ts")).toContain(
      "reportThumbnailFor(generated.data, generated.contentType)",
    );
    const worker = readFileSync(join(__dirname, "..", "..", "..", "worker.ts"), "utf8");
    expect(worker).toContain("void backfillReportThumbnails().catch(");
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
