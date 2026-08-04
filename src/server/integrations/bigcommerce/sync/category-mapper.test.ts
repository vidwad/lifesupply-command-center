import { describe, expect, it } from "vitest";

import { mapBcCategoryToUpsert, SOURCE_SYSTEM } from "./category-mapper";

describe("mapBcCategoryToUpsert", () => {
  it("maps a category and keys it on (bigcommerce, id)", () => {
    const { create } = mapBcCategoryToUpsert(
      {
        id: 7,
        parent_id: 3,
        name: "Wound Care",
        sort_order: 2,
        is_visible: true,
        custom_url: { url: "/wound-care/" },
      },
      { storeId: "store_1", parentCategoryId: "cat_parent" },
    );
    expect(create.sourceSystem).toBe(SOURCE_SYSTEM);
    expect(create.sourceId).toBe("7");
    expect(create.storeId).toBe("store_1");
    expect(create.name).toBe("Wound Care");
    expect(create.path).toBe("/wound-care/");
    expect(create.sortOrder).toBe(2);
    expect(create.isActive).toBe(true);
    expect(create.parentCategoryId).toBe("cat_parent");
  });

  it("overwrites BC-owned fields (incl. parent) on update", () => {
    const { update } = mapBcCategoryToUpsert(
      { id: 7, name: "Renamed", is_visible: false },
      { storeId: "store_1", parentCategoryId: null },
    );
    expect(update.name).toBe("Renamed");
    expect(update.isActive).toBe(false);
    expect(update.parentCategoryId).toBeNull();
  });

  it("falls back for a missing name and defaults visibility to active", () => {
    const { create } = mapBcCategoryToUpsert(
      { id: 9, name: null },
      { storeId: "s", parentCategoryId: null },
    );
    expect(create.name).toBe("(unnamed category)");
    expect(create.isActive).toBe(true);
    expect(create.sortOrder).toBe(0);
  });
});
