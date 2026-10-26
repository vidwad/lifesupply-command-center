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
  descriptionNeedsPublish,
  descriptionToHtml,
  latestGeneratedBySlot,
  liveImageIdForSlot,
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

describe("replacing what was published", () => {
  const published = asset({
    id: "r1",
    compositionSlot: 1,
    revision: 1,
    publishedAt: new Date("2026-10-20T10:00:00Z"),
    bigCommerceImageId: 501,
  });
  const revision = asset({ id: "r2", compositionSlot: 1, revision: 2 });

  it("finds the store image a slot currently has, by the latest published revision", () => {
    const older = asset({
      id: "r0",
      compositionSlot: 1,
      revision: 0,
      publishedAt: new Date("2026-10-01T10:00:00Z"),
      bigCommerceImageId: 400,
    });
    expect(liveImageIdForSlot([older, published, revision], 1)).toBe(501);
    expect(liveImageIdForSlot([revision], 1)).toBeNull();
    expect(liveImageIdForSlot([published], 2)).toBeNull();
  });

  it("marks a revision of a published image as a replacement, and a first publish as not", () => {
    const items = selectPublishItems({
      project: { ...project, descriptionUploadApprovedAt: null },
      assets: [published, revision, asset({ id: "fresh", compositionSlot: 2 })],
      compositions: [],
    });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ kind: "image", assetId: "r2", replacesImageId: 501 });
    expect(items[1]).toMatchObject({ kind: "image", assetId: "fresh", replacesImageId: null });
  });

  it("will not mark the published revision again; the revision carries the change", () => {
    expect(assetCanBeMarked(published, [published, revision]).ok).toBe(false);
    expect(assetCanBeMarked(revision, [published, revision])).toEqual({ ok: true });
  });

  it("resends an edited description, never an unchanged one", () => {
    const sent = descriptionToHtml(project.longDescription);
    const publishedAt = new Date("2026-10-20T10:00:00Z");
    expect(
      descriptionNeedsPublish({
        text: project.longDescription,
        descriptionPublishedAt: publishedAt,
        publishedDescriptionHtml: sent,
      }),
    ).toBe(false);
    expect(
      descriptionNeedsPublish({
        text: project.longDescription + "\n\nAn added paragraph.",
        descriptionPublishedAt: publishedAt,
        publishedDescriptionHtml: sent,
      }),
    ).toBe(true);
    expect(
      descriptionNeedsPublish({
        text: project.longDescription,
        descriptionPublishedAt: null,
        publishedDescriptionHtml: null,
      }),
    ).toBe(true);
    // Published with no record of what was sent: not resent.
    expect(
      descriptionNeedsPublish({
        text: project.longDescription,
        descriptionPublishedAt: publishedAt,
        publishedDescriptionHtml: null,
      }),
    ).toBe(false);
    const items = selectPublishItems({
      project: { ...project, descriptionPublishedAt: publishedAt },
      assets: [],
      compositions: [],
      publishedDescriptionHtml: "<p>something older</p>",
    });
    expect(items).toEqual([
      { kind: "description", text: expect.any(String) as string, replaces: true },
    ]);
  });
});

describe("the main image", () => {
  const first = asset({ id: "s1", compositionSlot: 1 });
  const second = asset({ id: "s2", compositionSlot: 2 });
  const published = asset({
    id: "s3",
    compositionSlot: 3,
    publishedAt: new Date("2026-10-20T10:00:00Z"),
    bigCommerceImageId: 700,
  });
  const noDescription = { ...project, descriptionUploadApprovedAt: null };
  const uploads = (items: ReturnType<typeof selectPublishItems>) =>
    items.filter((item) => item.kind === "image").map((item) => [item.assetId, item.isMainImage]);

  it("keeps the store's main image by default when the store has one", () => {
    const items = selectPublishItems({
      project: noDescription,
      assets: [first, second],
      compositions: [],
      store: { imageCount: 3, thumbnailImageId: 10 },
    });
    expect(uploads(items)).toEqual([
      ["s1", false],
      ["s2", false],
    ]);
  });

  it("makes the first upload the main image when the store has none", () => {
    const items = selectPublishItems({
      project: noDescription,
      assets: [first, second],
      compositions: [],
      store: { imageCount: 0, thumbnailImageId: null },
    });
    expect(uploads(items)).toEqual([
      ["s1", true],
      ["s2", false],
    ]);
  });

  it("honours a chosen upload over both defaults", () => {
    const items = selectPublishItems({
      project: noDescription,
      assets: [first, second],
      compositions: [],
      store: { imageCount: 3, thumbnailImageId: 10 },
      mainImageAssetId: "s2",
    });
    expect(uploads(items)).toEqual([
      ["s1", false],
      ["s2", true],
    ]);
  });

  it("promotes a chosen draft already on the store, unless it is the main image already", () => {
    const promote = selectPublishItems({
      project: noDescription,
      assets: [published],
      compositions: [],
      store: { imageCount: 3, thumbnailImageId: 10 },
      mainImageAssetId: "s3",
    });
    expect(promote).toEqual([
      { kind: "main_image", assetId: "s3", slot: 3, revision: 1, imageId: 700 },
    ]);
    const already = selectPublishItems({
      project: noDescription,
      assets: [published],
      compositions: [],
      store: { imageCount: 3, thumbnailImageId: 700 },
      mainImageAssetId: "s3",
    });
    expect(already).toEqual([]);
  });

  it("ignores a choice that is not a latest approved draft", () => {
    const items = selectPublishItems({
      project: noDescription,
      assets: [
        first,
        asset({ id: "s2r1", compositionSlot: 2, revision: 1 }),
        asset({
          id: "s2r2",
          compositionSlot: 2,
          revision: 2,
          status: "needs_review",
          uploadApprovedAt: null,
        }),
      ],
      compositions: [],
      store: { imageCount: 0, thumbnailImageId: null },
      mainImageAssetId: "s2r1",
    });
    expect(uploads(items)).toEqual([["s1", true]]);
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
