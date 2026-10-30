/**
 * Revenue sort and the catalogue thresholds (product owner, 2026-10-27).
 *
 * The product list sorts by 90-day revenue across the whole matching set,
 * and filters by store image count and description length. The filters are
 * database columns the sync maintains; the revenue order is computed from
 * the sales index and then paged. These hold both in place.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { ProductSales } from "./performance";
import { parseNonNegativeInt, PRODUCT_SORT_KEYS, rankIdsByRevenue } from "./index";

const service = readFileSync(join(__dirname, "index.ts"), "utf8").replace(/\r\n/g, "\n");
const page = readFileSync(
  join(__dirname, "..", "..", "..", "app", "(dashboard)", "products", "page.tsx"),
  "utf8",
).replace(/\r\n/g, "\n");

const sales = (revenueRange: number, unitsRange = 1): ProductSales => ({
  unitsLifetime: unitsRange,
  unitsRange,
  revenueRange,
  unitsRecent: 0,
  unitsEarlier: 0,
});

describe("ranking products by revenue", () => {
  it("lists sellers highest first, ties by units then id, and leaves out zero revenue", () => {
    const stats = new Map<string, ProductSales>([
      ["b", sales(100, 2)],
      ["a", sales(100, 2)],
      ["c", sales(250)],
      ["d", sales(0, 3)],
      ["e", sales(100, 5)],
    ]);
    expect(rankIdsByRevenue(stats, "desc")).toEqual(["c", "e", "a", "b"]);
    expect(rankIdsByRevenue(stats, "asc")).toEqual(["b", "a", "e", "c"]);
  });

  it("is a supported sort key, with images, and the page orders the whole set", () => {
    expect(PRODUCT_SORT_KEYS).toContain("revenue");
    expect(PRODUCT_SORT_KEYS).toContain("images");
    expect(service).toContain('filters.sort === "revenue" && filters.performanceIndex');
    // The seller ids are intersected with the active filters in the database,
    // and the non-sellers are paged there too; nothing fetches the catalogue.
    expect(service).toContain("AND: [where, { id: { in: ranked } }]");
    expect(service).toContain("AND: [where, { id: { notIn: ranked } }]");
    expect(page).toContain('sortKey="revenue"');
    expect(page).toContain('defaultDir="desc"');
  });
});

describe("the catalogue thresholds", () => {
  it("reads whole numbers only", () => {
    expect(parseNonNegativeInt("0")).toBe(0);
    expect(parseNonNegativeInt("12")).toBe(12);
    expect(parseNonNegativeInt(" 7 ")).toBe(7);
    expect(parseNonNegativeInt("-1")).toBeUndefined();
    expect(parseNonNegativeInt("1.5")).toBeUndefined();
    expect(parseNonNegativeInt("ten")).toBeUndefined();
    expect(parseNonNegativeInt("")).toBeUndefined();
    expect(parseNonNegativeInt(undefined)).toBeUndefined();
  });

  it("filter in the database on the sync-maintained columns", () => {
    expect(service).toContain("where.imageCount = { lte: filters.maxImages }");
    expect(service).toContain("where.descriptionLength = { lt: filters.maxDescriptionChars }");
    expect(service).toContain('case "images":');
    // The list reads the columns rather than re-deriving from the payload.
    expect(service).toContain("imageCount: p.imageCount,");
  });

  it("survive the pills, the pagination and the search form", () => {
    expect(page).toContain('qs.set("img", String(maxImages))');
    expect(page).toContain('qs.set("desc", String(maxDescriptionChars))');
    expect(page).toContain("img: maxImages != null ? String(maxImages) : undefined");
    expect(page).toContain('name="img"');
    expect(page).toContain('name="desc"');
  });
});
