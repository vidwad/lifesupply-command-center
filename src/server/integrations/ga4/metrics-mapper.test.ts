import { describe, expect, it } from "vitest";

import { mapAttributionReport, mapDailyReport, parseGa4Date } from "./metrics-mapper";

describe("parseGa4Date", () => {
  it("converts GA4 YYYYMMDD to ISO date", () => {
    expect(parseGa4Date("20260801")).toBe("2026-08-01");
  });
  it("rejects malformed values", () => {
    expect(parseGa4Date("2026-08-01")).toBeNull();
    expect(parseGa4Date("")).toBeNull();
    expect(parseGa4Date(undefined)).toBeNull();
  });
});

describe("mapDailyReport", () => {
  it("maps a runReport response row into a WebsiteMetric-shaped record", () => {
    const rows = mapDailyReport({
      rows: [
        {
          dimensionValues: [{ value: "20260801" }],
          metricValues: [
            { value: "1200" }, // totalUsers
            { value: "1500" }, // sessions
            { value: "900" }, // engagedSessions
            { value: "5000" }, // screenPageViews
            { value: "800" }, // itemsViewed
            { value: "120" }, // addToCarts
            { value: "60" }, // checkouts
            { value: "45" }, // ecommercePurchases
            { value: "5123.456" }, // purchaseRevenue
          ],
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      date: "2026-08-01",
      users: 1200,
      sessions: 1500,
      engagedSessions: 900,
      pageViews: 5000,
      productViews: 800,
      addToCarts: 120,
      checkouts: 60,
      purchases: 45,
      revenue: 5123.46,
      conversionRate: 0.03, // 45 / 1500
    });
  });

  it("null conversion rate when sessions are zero and skips malformed dates", () => {
    const rows = mapDailyReport({
      rows: [
        {
          dimensionValues: [{ value: "20260802" }],
          metricValues: Array.from({ length: 9 }, () => ({ value: "0" })),
        },
        { dimensionValues: [{ value: "bogus" }], metricValues: [] },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.conversionRate).toBeNull();
  });

  it("returns empty for a rowless response", () => {
    expect(mapDailyReport({})).toEqual([]);
  });
});

describe("mapAttributionReport", () => {
  it("maps source/medium rows with sessions + revenue", () => {
    const rows = mapAttributionReport({
      rows: [
        {
          dimensionValues: [{ value: "google" }, { value: "organic" }],
          metricValues: [{ value: "800" }, { value: "2100.554" }],
        },
      ],
    });
    expect(rows).toEqual([
      { source: "google", medium: "organic", sessions: 800, revenue: 2100.55 },
    ]);
  });
});
