import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DASHBOARD_CACHE_TTL_MS,
  LEADERBOARD_SIZE,
  LOW_MARGIN_THRESHOLD,
  OPEN_ORDER_STATUSES,
  rankProductAggregates,
  type ProductAggregate,
} from "./index";

const service = readFileSync(join(__dirname, "index.ts"), "utf8").replace(/\r\n/g, "\n");

const agg = (productId: string, revenue: number, grossProfit: number): ProductAggregate => ({
  productId,
  revenue,
  quantity: 1,
  grossProfit,
});

describe("OPEN_ORDER_STATUSES", () => {
  it("counts orders still to be fulfilled and leaves shipped history out", () => {
    expect(OPEN_ORDER_STATUSES).toEqual([
      "received",
      "processing",
      "awaiting_supplier",
      "in_supplier_queue",
      "awaiting_human_review",
    ]);
    expect(OPEN_ORDER_STATUSES).not.toContain("shipped");
    expect(OPEN_ORDER_STATUSES).not.toContain("completed");
  });
});

describe("rankProductAggregates", () => {
  it("takes the top sellers by revenue from one aggregate", () => {
    const rows = [agg("a", 10, 5), agg("b", 50, 40), agg("c", 30, 20), agg("d", 20, 1)];
    const { top } = rankProductAggregates(rows);
    expect(top.map((r) => r.productId)).toEqual(["b", "c", "d", "a"]);
    expect(rows.map((r) => r.productId)).toEqual(["a", "b", "c", "d"]); // input untouched
  });

  it("limits both boards to the leaderboard size", () => {
    const rows = Array.from({ length: LEADERBOARD_SIZE + 3 }, (_, i) => agg(`p${i}`, 100 + i, 1));
    const { top, lowMargin } = rankProductAggregates(rows);
    expect(top).toHaveLength(LEADERBOARD_SIZE);
    expect(lowMargin).toHaveLength(LEADERBOARD_SIZE);
  });

  it("lists products below the margin threshold, lowest margin first, with the margin", () => {
    const rows = [
      agg("healthy", 100, 60), // 60%
      agg("thin", 100, 10), // 10%
      agg("edge", 100, 35), // exactly the threshold is not low
      agg("mid", 200, 50), // 25%
      agg("none", 0, 0), // no revenue: no margin to judge
    ];
    const { lowMargin } = rankProductAggregates(rows);
    expect(lowMargin.map((r) => r.productId)).toEqual(["thin", "mid"]);
    expect(lowMargin[0]!.marginPct).toBeCloseTo(0.1);
    expect(lowMargin[1]!.marginPct).toBeCloseTo(0.25);
    expect(lowMargin.every((r) => r.marginPct < LOW_MARGIN_THRESHOLD)).toBe(true);
  });
});

describe("dashboard cache", () => {
  it("holds the dashboard for about a minute and serves it stale while the next load runs", () => {
    expect(DASHBOARD_CACHE_TTL_MS).toBe(60_000);
    expect(service).toContain('import { createTtlCache } from "@/server/cache/ttl-cache";');
    expect(service).toContain("staleWhileRevalidate: true");
  });
});
