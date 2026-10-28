import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  firstStoreImageUrl,
  isStoreImageHost,
  runFormHrefForBatch,
  storeDescriptionToText,
} from "./bulk";
import { sourcePhotosLocked } from "./source-photos";

describe("picking the store image", () => {
  it("prefers the thumbnail, then the lowest sort order, at the largest size", () => {
    const metadata = {
      bcRaw: {
        images: [
          { sort_order: 1, url_standard: "https://cdn11.bigcommerce.com/s-x/images/b.jpg" },
          {
            sort_order: 2,
            is_thumbnail: true,
            url_zoom: "https://cdn11.bigcommerce.com/s-x/images/t-zoom.jpg",
            url_standard: "https://cdn11.bigcommerce.com/s-x/images/t.jpg",
          },
          { sort_order: 0, url_standard: "https://cdn11.bigcommerce.com/s-x/images/a.jpg" },
        ],
      },
    };
    expect(firstStoreImageUrl(metadata)).toBe(
      "https://cdn11.bigcommerce.com/s-x/images/t-zoom.jpg",
    );
    expect(
      firstStoreImageUrl({
        bcRaw: { images: metadata.bcRaw.images.filter((i) => !i.is_thumbnail) },
      }),
    ).toBe("https://cdn11.bigcommerce.com/s-x/images/a.jpg");
  });
  it("returns null without images and ignores images off the store's hosts", () => {
    expect(firstStoreImageUrl(null)).toBeNull();
    expect(firstStoreImageUrl({ bcRaw: {} })).toBeNull();
    expect(
      firstStoreImageUrl({ bcRaw: { images: [{ url_standard: "https://evil.example/x.jpg" }] } }),
    ).toBeNull();
    expect(isStoreImageHost("http://cdn11.bigcommerce.com/x.jpg")).toBe(false);
    expect(isStoreImageHost("https://store-abc.mybigcommerce.com/x.jpg")).toBe(true);
  });
});

describe("the store description as intake text", () => {
  it("strips tags and entities and keeps paragraph breaks", () => {
    expect(
      storeDescriptionToText("<p>One &amp; two</p><ul><li>Three</li></ul><br>Four", "Thing"),
    ).toBe("One & two\nThree\nFour");
  });
  it("falls back to a sentence when the store has nothing usable, and caps long text", () => {
    expect(storeDescriptionToText("<p></p>", "Digital thermometer")).toBe(
      "Imported from the store listing for Digital thermometer.",
    );
    expect(storeDescriptionToText("x".repeat(5000), "T").length).toBeLessThanOrEqual(4000);
  });
});

describe("the photograph lock", () => {
  it("unlocks only a draft or failed project with no compositions", () => {
    expect(sourcePhotosLocked({ status: "draft", compositionCount: 0 })).toBe(false);
    expect(sourcePhotosLocked({ status: "failed", compositionCount: 0 })).toBe(false);
    expect(sourcePhotosLocked({ status: "draft", compositionCount: 4 })).toBe(true);
    expect(sourcePhotosLocked({ status: "research_queued", compositionCount: 0 })).toBe(true);
    expect(sourcePhotosLocked({ status: "needs_review", compositionCount: 4 })).toBe(true);
  });
});

describe("the run form address for a batch", () => {
  it("carries the projects that already existed beside the batch id", () => {
    const href = runFormHrefForBatch({
      batchId: "batch-1",
      entries: [
        { productId: "p1", productName: "New", projectId: "proj-new", seeded: true, note: null },
        {
          productId: "p2",
          productName: "Old",
          projectId: "proj-old",
          seeded: false,
          note: "Already has a project; opened that one instead.",
        },
        {
          productId: "p3",
          productName: "p3",
          projectId: null,
          seeded: false,
          note: "Product not found.",
        },
        {
          productId: "p4",
          productName: "No image",
          projectId: "proj-noimg",
          seeded: false,
          note: "The store has no image; add a photo on the project page.",
        },
      ],
    });
    const url = new URL(href, "http://x");
    expect(url.pathname).toBe("/automation/product-studio/new");
    expect(url.searchParams.get("batch")).toBe("batch-1");
    // Only the pre-existing project is repeated: the new ones are found by the batch.
    expect(url.searchParams.getAll("id")).toEqual(["proj-old"]);
  });
  it("is the batch alone when every product was new", () => {
    expect(runFormHrefForBatch({ batchId: "b", entries: [] })).toBe(
      "/automation/product-studio/new?batch=b",
    );
  });
});

describe("bulk creation spends nothing", () => {
  const ROOT = join(__dirname, "..", "..", "..", "..");
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
  const stripComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("never sends an event, queues research, or touches a provider", () => {
    const code = stripComments(read("src/server/services/product-studio/bulk.ts"));
    expect(code).not.toMatch(/inngest|\.send\(|research\.requested|image\.requested|openai/i);
    expect(code).not.toMatch(/queueProductStudio/);
    // The one outbound fetch is the store image, host-bounded.
    expect(code.match(/fetch\(/g)?.length).toBe(1);
    expect(code).toContain("if (!isStoreImageHost(url))");
  });
  it("the bulk action redirects to the batch and queues nothing", () => {
    const actions = stripComments(read("src/app/(dashboard)/products/studio/actions.ts"));
    const bulk = actions.slice(
      actions.indexOf("export async function bulkCreateProjectsAction"),
      actions.indexOf("export async function updateSourcePhotosAction"),
    );
    expect(bulk).toContain("createProductStudioBatch({");
    expect(bulk).toContain("redirect(`/products/studio?batch=${batchId}`)");
    expect(bulk).not.toMatch(/queue|Generation|Research/);
  });
  it("the unattended-run action sends the whole selection to the run form", () => {
    const actions = stripComments(read("src/app/(dashboard)/products/studio/actions.ts"));
    const run = actions.slice(
      actions.indexOf("export async function bulkAutopilotAction"),
      actions.indexOf("export async function updateSourcePhotosAction"),
    );
    expect(run).toContain("createProductStudioBatch({");
    expect(run).toContain("redirect(runFormHrefForBatch(batch))");
    expect(run).not.toMatch(/queue|Generation|Research/);
  });
});
