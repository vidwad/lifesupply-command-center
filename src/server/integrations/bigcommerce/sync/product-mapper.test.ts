import { describe, expect, it } from "vitest";

import {
  deriveDescriptionStatus,
  descriptionTextLength,
  storeImageCountOf,
  deriveImageStatus,
  deriveProductStatus,
  mapBcProductToUpsert,
  SOURCE_SYSTEM,
  type BcProduct,
} from "./product-mapper";

const base: BcProduct = {
  id: 100,
  name: "Nitrile Gloves",
  sku: "GLV-NIT",
  type: "physical",
  description: "<p>Powder-free nitrile examination gloves, box of 100.</p>",
  brand_id: 5,
  categories: [12, 34],
  is_visible: true,
  availability: "available",
  custom_url: { url: "/nitrile-gloves/" },
  images: [{ id: 1 }],
};

describe("deriveProductStatus", () => {
  it("disabled availability → inactive", () => {
    expect(deriveProductStatus({ ...base, availability: "disabled" })).toBe("inactive");
  });
  it("hidden but available → draft", () => {
    expect(deriveProductStatus({ ...base, is_visible: false })).toBe("draft");
  });
  it("visible + available → active", () => {
    expect(deriveProductStatus(base)).toBe("active");
  });
});

describe("deriveImageStatus", () => {
  it("present when images exist, missing otherwise", () => {
    expect(deriveImageStatus(base)).toBe("present");
    expect(deriveImageStatus({ ...base, images: [] })).toBe("missing");
    expect(deriveImageStatus({ ...base, images: null })).toBe("missing");
  });
});

describe("deriveDescriptionStatus", () => {
  it("missing when empty (after stripping tags)", () => {
    expect(deriveDescriptionStatus({ ...base, description: "<p></p>" })).toBe("missing");
    expect(deriveDescriptionStatus({ ...base, description: null })).toBe("missing");
  });
  it("needs_review when very short", () => {
    expect(deriveDescriptionStatus({ ...base, description: "Gloves" })).toBe("needs_review");
  });
  it("present for a substantial description", () => {
    expect(deriveDescriptionStatus(base)).toBe("present");
  });
});

describe("mapBcProductToUpsert", () => {
  const built = mapBcProductToUpsert(base, {
    storeId: "store_1",
    divisionId: "div_1",
    categoryId: "cat_12",
    brandName: "MedGlove",
  });

  it("keys the product + maps BC-owned fields", () => {
    expect(built.create.sourceSystem).toBe(SOURCE_SYSTEM);
    expect(built.create.sourceId).toBe("100");
    expect(built.create.name).toBe("Nitrile Gloves");
    expect(built.create.sku).toBe("GLV-NIT");
    expect(built.create.brand).toBe("MedGlove");
    expect(built.create.categoryId).toBe("cat_12");
    expect(built.create.imageStatus).toBe("present");
    expect(built.create.status).toBe("active");
  });

  it("sets CC-owned flags on create only", () => {
    expect(built.create.isFeatured).toBe(false);
    expect(built.create.isRockstarCandidate).toBe(false);
    expect(built.update).not.toHaveProperty("isFeatured");
    expect(built.update).not.toHaveProperty("isRockstarCandidate");
    expect(built.update).not.toHaveProperty("sourceSystem");
  });

  it("records all BC category ids + brand id in metadata", () => {
    const meta = built.create.metadata as Record<string, unknown>;
    expect(meta.bcCategories).toEqual([12, 34]);
    expect(meta.bcBrandId).toBe(5);
  });

  it("passes a null category/brand through", () => {
    const b = mapBcProductToUpsert(
      { ...base, categories: [], brand_id: null },
      { storeId: "s", divisionId: null, categoryId: null, brandName: null },
    );
    expect(b.create.categoryId).toBeNull();
    expect(b.create.brand).toBeNull();
  });
});

describe("the denormalised list columns (2026-10-27)", () => {
  it("measures description text with markup stripped", () => {
    expect(descriptionTextLength("<p>Sterile <b>gauze</b></p>")).toBe(13);
    expect(descriptionTextLength("  <p></p> ")).toBe(0);
    expect(descriptionTextLength(null)).toBe(0);
    expect(descriptionTextLength(undefined)).toBe(0);
  });
  it("counts the store images and reads zero for none", () => {
    expect(storeImageCountOf({ images: [{ id: 1 }, { id: 2 }] } as never)).toBe(2);
    expect(storeImageCountOf({ images: undefined } as never)).toBe(0);
  });
  it("writes both columns on create and on update so a sync keeps them current", () => {
    const { create, update } = mapBcProductToUpsert(
      {
        ...base,
        description: "<p>Twelve chars</p>",
        images: [{ id: 1 }, { id: 2 }, { id: 3 }],
      } as never,
      { storeId: "s", divisionId: null, categoryId: null, brandName: null },
    );
    expect(create.imageCount).toBe(3);
    expect(create.descriptionLength).toBe(12);
    expect(update.imageCount).toBe(3);
    expect(update.descriptionLength).toBe(12);
  });
});
