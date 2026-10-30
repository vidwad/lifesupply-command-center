import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { summarizeProductCounts, type ProductPopulationRow } from "./index";
import { classifyProducts, type ProductSales } from "./performance";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

const sales = (over: Partial<ProductSales>): ProductSales => ({
  unitsLifetime: 0,
  units90: 0,
  revenue90: 0,
  units30: 0,
  unitsPrior30: 0,
  ...over,
});

const now = new Date("2026-10-30T12:00:00Z");

// hot: sold recently and is the top seller. cold: sold once, long ago.
// never: no sales at all. hidden: sold but is not in the population (another
// division, say), so it must not be counted anywhere.
const index = classifyProducts(
  new Map([
    ["hot", sales({ unitsLifetime: 10, units90: 10, revenue90: 500, units30: 6, unitsPrior30: 4 })],
    ["cold", sales({ unitsLifetime: 1 })],
    ["hidden", sales({ unitsLifetime: 3, units90: 3, revenue90: 90 })],
  ]),
  now,
);

const population: ProductPopulationRow[] = [
  { id: "hot", imageStatus: "ok" },
  { id: "cold", imageStatus: "missing" },
  { id: "never", imageStatus: "needs_review" },
  { id: "never2", imageStatus: "missing" },
];

describe("summarizeProductCounts", () => {
  it("with no quality or segment filter, counts the whole population", () => {
    const counts = summarizeProductCounts(population, {}, index);
    expect(counts.total).toBe(4);
    expect(counts.quality).toEqual({ all: 4, missingImage: 2, needsReview: 1 });
    expect(counts.performance).toEqual({ top: 1, promising: 1, cold: 1, non_seller: 2 });
  });

  it("applies the quality filter to the total and the segment pills, not to the quality pills", () => {
    const counts = summarizeProductCounts(population, { imageStatus: "missing" }, index);
    expect(counts.total).toBe(2);
    // The quality pills read "what you would get if you clicked this".
    expect(counts.quality).toEqual({ all: 4, missingImage: 2, needsReview: 1 });
    // Only the two products missing images are considered for the segments.
    expect(counts.performance).toEqual({ top: 0, promising: 0, cold: 1, non_seller: 1 });
  });

  it("applies the segment filter to the total and the quality pills, not to the segment pills", () => {
    const counts = summarizeProductCounts(population, { performance: "non_seller" }, index);
    expect(counts.total).toBe(2);
    expect(counts.quality).toEqual({ all: 2, missingImage: 1, needsReview: 1 });
    expect(counts.performance).toEqual({ top: 1, promising: 1, cold: 1, non_seller: 2 });
  });

  it("applies both filters to the total", () => {
    const counts = summarizeProductCounts(
      population,
      { imageStatus: "needs_review", performance: "non_seller" },
      index,
    );
    expect(counts.total).toBe(1);
  });

  it("ignores sellers outside the population", () => {
    const counts = summarizeProductCounts(population, { performance: "top" }, index);
    expect(counts.total).toBe(1); // "hidden" sold but is not listed here
  });
});

describe("the products page reads one scan and shared sales figures", () => {
  const page = read("src/app/(dashboard)/products/page.tsx");
  const service = read("src/server/services/products/index.ts");
  const performance = read("src/server/services/products/performance.ts");
  const instrumentation = read("src/instrumentation.ts");

  it("derives the total and every pill from one population query", () => {
    expect(page).toContain("loadProductPopulation(filters)");
    expect(page).toContain("summarizeProductCounts(population, filters, performanceIndex)");
    expect(page).not.toContain("countProductsByPerformance");
    expect(page).not.toContain("countProductsByQuality");
    expect(service).toContain("select: { id: true, imageStatus: true }");
  });

  it("loads the sales figures in one filtered aggregate and shares them for ten minutes", () => {
    expect(performance.match(/FILTER \(WHERE/g)).toHaveLength(4);
    expect(performance).toContain(`AND o."status" NOT IN ('cancelled', 'refunded')`);
    expect(performance).toContain("PRODUCT_SALES_TTL_MS = 10 * 60_000");
    expect(performance).toContain("staleWhileRevalidate: true");
    expect(performance).not.toContain("prisma.orderItem.groupBy");
  });

  it("warms the figures when the web process starts", () => {
    expect(instrumentation).toContain("warmProductSales");
  });
});
