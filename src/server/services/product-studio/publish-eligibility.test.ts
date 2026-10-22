/**
 * Product Studio publish rules. Pure functions, so these are plain unit
 * tests: what counts as a publishable target, which drafts are selected, and
 * how the plain-prose description becomes safe HTML.
 */
import { describe, expect, it } from "vitest";

import { FEATURE_FLAGS } from "@/lib/feature-flags";

import {
  assetCanBeMarked,
  buildImageAltText,
  canPublish,
  descriptionToHtml,
  latestGeneratedBySlot,
  REQUIRED_PUBLISH_FLAGS,
  resolvePublishTarget,
  selectPublishItems,
  type PublishableAsset,
} from "./publish-eligibility";

const product = {
  id: "p1",
  name: "Digital thermometer",
  sku: "DT-100",
  storeId: "store-1",
  sourceSystem: "bigcommerce",
  sourceId: "4411",
  store: { name: "LifeSupply" },
};

const asset = (over: Partial<PublishableAsset>): PublishableAsset => ({
  id: "a1",
  kind: "generated",
  compositionSlot: 1,
  revision: 1,
  status: "approved",
  fileName: "composition-1-r1.jpg",
  contentType: "image/jpeg",
  bytes: 1000,
  contentHash: "abc",
  uploadApprovedAt: new Date("2026-10-22T10:00:00Z"),
  publishedAt: null,
  ...over,
});

const project = {
  title: "Thermometer",
  confirmedTitle: "Digital Thermometer, Oral",
  longDescription: "First paragraph.\n\nSecond <b>paragraph</b> & more.\nSame paragraph.",
  descriptionUploadApprovedAt: new Date("2026-10-22T10:00:00Z"),
  descriptionPublishedAt: null,
};

describe("the three flags", () => {
  it("requires the module flag, its own flag and the platform write-back flag", () => {
    expect([...REQUIRED_PUBLISH_FLAGS]).toEqual([
      FEATURE_FLAGS.PRODUCT_STUDIO,
      FEATURE_FLAGS.PRODUCT_STUDIO_PUBLISH,
      FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
    ]);
  });
});

describe("resolving the store product", () => {
  it("resolves a synced BigCommerce product with a store", () => {
    const { target, reason } = resolvePublishTarget(product);
    expect(reason).toBeNull();
    expect(target).toMatchObject({ storeId: "store-1", sourceProductId: "4411", sku: "DT-100" });
  });
  it("refuses an unlinked project, a product without a store, and a non-BigCommerce mapping", () => {
    expect(resolvePublishTarget(null).target).toBeNull();
    expect(resolvePublishTarget({ ...product, storeId: null }).reason).toMatch(/no store/);
    expect(resolvePublishTarget({ ...product, sourceSystem: "amazon" }).reason).toMatch(
      /not mapped to a BigCommerce/,
    );
    expect(resolvePublishTarget({ ...product, sourceId: " " }).target).toBeNull();
  });
});

describe("selecting what to send", () => {
  it("sends only the latest, approved, upload-marked, unpublished draft per slot, then the description", () => {
    const items = selectPublishItems({
      project,
      assets: [
        asset({ id: "old", slot: 1, revision: 1 } as never),
        asset({ id: "new", compositionSlot: 1, revision: 2 }),
        asset({ id: "unmarked", compositionSlot: 2, uploadApprovedAt: null }),
        asset({ id: "notApproved", compositionSlot: 3, status: "needs_review" }),
        asset({ id: "done", compositionSlot: 4, publishedAt: new Date() }),
        asset({ id: "src", kind: "source", compositionSlot: null }),
      ],
      compositions: [{ slot: 1, name: "Hero on white" }],
    });
    expect(items.map((item) => (item.kind === "image" ? item.assetId : "description"))).toEqual([
      "new",
      "description",
    ]);
    expect(items[0]).toMatchObject({ altText: "Digital Thermometer, Oral — Hero on white" });
  });
  it("skips the description when it is absent, unmarked or already published", () => {
    const assets: PublishableAsset[] = [];
    expect(
      selectPublishItems({
        project: { ...project, longDescription: null },
        assets,
        compositions: [],
      }),
    ).toEqual([]);
    expect(
      selectPublishItems({
        project: { ...project, descriptionUploadApprovedAt: null },
        assets,
        compositions: [],
      }),
    ).toEqual([]);
    expect(
      selectPublishItems({
        project: { ...project, descriptionPublishedAt: new Date() },
        assets,
        compositions: [],
      }),
    ).toEqual([]);
  });
  it("keeps the latest revision of each slot in slot order", () => {
    const latest = latestGeneratedBySlot([
      asset({ id: "b2", compositionSlot: 2, revision: 2 }),
      asset({ id: "a1", compositionSlot: 1, revision: 1 }),
      asset({ id: "b1", compositionSlot: 2, revision: 1 }),
    ]);
    expect(latest.map((item) => item.id)).toEqual(["a1", "b2"]);
  });
});

describe("marking a draft", () => {
  it("allows only an approved, latest, unpublished generated draft", () => {
    const a1 = asset({ id: "a1", revision: 1 });
    const a2 = asset({ id: "a2", revision: 2 });
    expect(assetCanBeMarked(a2, [a1, a2])).toEqual({ ok: true });
    expect(assetCanBeMarked(a1, [a1, a2]).ok).toBe(false);
    expect(assetCanBeMarked(asset({ status: "rejected" }), []).ok).toBe(false);
    expect(assetCanBeMarked(asset({ kind: "source", compositionSlot: null }), []).ok).toBe(false);
    expect(assetCanBeMarked(asset({ publishedAt: new Date() }), []).ok).toBe(false);
  });
});

describe("the verdict", () => {
  const target = resolvePublishTarget(product).target!;
  const item = selectPublishItems({ project, assets: [], compositions: [] });
  it("refuses without a target, while busy, or with nothing marked", () => {
    expect(canPublish({ target: null, targetReason: "x", items: item, busy: false })).toMatchObject(
      {
        allowed: false,
        reason: "missing_target",
      },
    );
    expect(canPublish({ target, targetReason: null, items: item, busy: true })).toMatchObject({
      allowed: false,
      reason: "project_busy",
    });
    expect(canPublish({ target, targetReason: null, items: [], busy: false })).toMatchObject({
      allowed: false,
      reason: "nothing_marked",
    });
    expect(canPublish({ target, targetReason: null, items: item, busy: false }).allowed).toBe(true);
  });
});

describe("the description as HTML", () => {
  it("wraps paragraphs, escapes markup and keeps single line breaks", () => {
    expect(descriptionToHtml(project.longDescription)).toBe(
      "<p>First paragraph.</p>\n<p>Second &lt;b&gt;paragraph&lt;/b&gt; &amp; more.<br>Same paragraph.</p>",
    );
  });
  it("caps alt text at BigCommerce's limit", () => {
    const alt = buildImageAltText({ title: "x".repeat(300), compositionName: "y" });
    expect(alt.length).toBeLessThanOrEqual(255);
  });
});
