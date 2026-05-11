import { describe, expect, it } from "vitest";

import { filterDashboardForAi } from "./index";

// Minimal stand-in for the real DashboardData. We only need fields the
// filter touches; everything else is filled with safe defaults so the cast
// stays narrow.
function makeDashboard() {
  return {
    period: { id: "p1", name: "2026-04", status: "open" },
    previousPeriod: { id: "p0", name: "2026-03" },
    revenue: { current: 1000, previous: 800, deltaPct: 0.25 },
    grossProfit: { current: 400, previous: 320, deltaPct: 0.25 },
    grossMargin: { current: 0.4, previous: 0.4 },
    operatingIncome: { current: 100, previous: 80, deltaPct: 0.25 },
    cash: { current: 50_000 },
    workingCapital: { current: 75_000 },
    operations: {
      openOrders: 3,
      exceptionOrders: 1,
      awaitingSupplier: 2,
      awaitingHumanReview: 0,
      completedThisPeriod: 12,
      cancelledThisPeriod: 1,
    },
    trend: [],
    topProducts: [
      { id: "p", name: "Walker", sku: "WK-1", revenue: 500, quantity: 5 },
    ],
    lowMarginProducts: [
      { id: "lm", name: "Cane", sku: "CN-1", revenue: 100, marginPct: 0.2 },
    ],
    exceptions: [],
    priorityTasks: [],
    aiBriefing: null,
    campaigns: [
      {
        id: "c1",
        name: "Spring",
        status: "sent",
        sentCount: 200,
        openRate: 0.3,
        attributedRevenue: 800,
      },
    ],
    reactivation: { candidateCount: 12, activeSegmentCount: 2, topSegmentName: "Lapsed" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("filterDashboardForAi", () => {
  it("does not redact when user holds both ai context permissions", () => {
    const data = makeDashboard();
    const result = filterDashboardForAi(data, [
      "ai.use_financial_context",
      "ai.use_customer_context",
    ]);
    expect(result.redactedSections).toEqual([]);
    expect(result.data.revenue.current).toBe(1000);
    expect(result.data.topProducts.length).toBe(1);
    expect(result.data.campaigns.length).toBe(1);
  });

  it("redacts financial KPIs when user lacks ai.use_financial_context", () => {
    const data = makeDashboard();
    const result = filterDashboardForAi(data, ["ai.use_customer_context"]);
    expect(result.redactedSections).toContain("financial KPIs");
    expect(result.data.revenue.current).toBe(0);
    expect(result.data.revenue.previous).toBeNull();
    expect(result.data.revenue.deltaPct).toBeNull();
    expect(result.data.grossMargin.current).toBeNull();
    expect(result.data.cash.current).toBeNull();
    expect(result.data.workingCapital.current).toBeNull();
    // Operations + period are not financial — must remain visible.
    expect(result.data.operations.openOrders).toBe(3);
    expect(result.data.period?.name).toBe("2026-04");
  });

  it("redacts customer/product/campaign sections when user lacks ai.use_customer_context", () => {
    const data = makeDashboard();
    const result = filterDashboardForAi(data, ["ai.use_financial_context"]);
    expect(result.redactedSections).toContain("customer / product / campaign data");
    expect(result.data.topProducts.length).toBe(0);
    expect(result.data.lowMarginProducts.length).toBe(0);
    expect(result.data.campaigns.length).toBe(0);
    expect(result.data.reactivation.candidateCount).toBe(0);
    // Financials must remain visible.
    expect(result.data.revenue.current).toBe(1000);
  });

  it("redacts everything when user holds no AI context permissions", () => {
    const data = makeDashboard();
    const result = filterDashboardForAi(data, []);
    expect(result.redactedSections).toHaveLength(2);
    expect(result.data.revenue.current).toBe(0);
    expect(result.data.topProducts.length).toBe(0);
  });

  it("does not mutate the input dashboard object", () => {
    const data = makeDashboard();
    const original = JSON.parse(JSON.stringify(data));
    filterDashboardForAi(data, []);
    expect(data).toEqual(original);
  });
});
