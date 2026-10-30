import { describe, expect, it } from "vitest";

import {
  createTtlCache,
  DASHBOARD_CACHE_TTL_MS,
  LEADERBOARD_SIZE,
  LOW_MARGIN_THRESHOLD,
  OPEN_ORDER_STATUSES,
  rankProductAggregates,
  type ProductAggregate,
} from "./index";

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

describe("createTtlCache", () => {
  it("serves one load to every caller until the time to live passes", async () => {
    let clock = 1_000;
    let loads = 0;
    const cache = createTtlCache<number>(60_000, () => clock);
    const load = async () => ++loads;

    await expect(cache.get(load)).resolves.toBe(1);
    await expect(cache.get(load)).resolves.toBe(1);
    clock += 59_999;
    await expect(cache.get(load)).resolves.toBe(1);
    clock += 1;
    await expect(cache.get(load)).resolves.toBe(2);
    expect(loads).toBe(2);
  });

  it("shares an in-flight load between concurrent callers", async () => {
    let loads = 0;
    let release!: (value: string) => void;
    const cache = createTtlCache<string>(60_000, () => 0);
    const load = () => {
      loads += 1;
      return new Promise<string>((resolve) => {
        release = resolve;
      });
    };

    const first = cache.get(load);
    const second = cache.get(load);
    release("ready");
    await expect(first).resolves.toBe("ready");
    await expect(second).resolves.toBe("ready");
    expect(loads).toBe(1);
  });

  it("does not keep a failed load", async () => {
    let loads = 0;
    const cache = createTtlCache<number>(60_000, () => 0);
    await expect(
      cache.get(async () => {
        loads += 1;
        throw new Error("database away");
      }),
    ).rejects.toThrow("database away");
    await expect(cache.get(async () => ++loads)).resolves.toBe(2);
  });

  it("clears on demand", async () => {
    let loads = 0;
    const cache = createTtlCache<number>(60_000, () => 0);
    await cache.get(async () => ++loads);
    cache.clear();
    await expect(cache.get(async () => ++loads)).resolves.toBe(2);
  });

  it("holds the dashboard for about a minute", () => {
    expect(DASHBOARD_CACHE_TTL_MS).toBe(60_000);
  });
});
