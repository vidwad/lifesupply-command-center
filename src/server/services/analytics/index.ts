import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

export type AnalyticsRange = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<AnalyticsRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

export type AnalyticsDashboard = {
  range: AnalyticsRange;
  store: { id: string; name: string } | null;
  storeOptions: { id: string; name: string }[];

  totals: {
    users: number;
    sessions: number;
    engagedSessions: number;
    pageViews: number;
    productViews: number;
    addToCarts: number;
    checkouts: number;
    purchases: number;
    revenue: number;
    avgConversionRate: number | null;
  };
  prevTotals: {
    users: number;
    sessions: number;
    purchases: number;
    revenue: number;
  };

  daily: { date: string; users: number; sessions: number; revenue: number; purchases: number }[];

  perStore: {
    id: string;
    name: string;
    users: number;
    sessions: number;
    revenue: number;
    purchases: number;
  }[];
};

export async function getAnalyticsDashboard(args: {
  range?: AnalyticsRange;
  storeId?: string;
}): Promise<AnalyticsDashboard> {
  const range = args.range ?? "30d";
  const days = RANGE_DAYS[range];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);

  const stores = await prisma.store.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const selectedStore = args.storeId ? (stores.find((s) => s.id === args.storeId) ?? null) : null;

  const where: Prisma.WebsiteMetricWhereInput = {
    date: { gte: start },
    ...(selectedStore ? { storeId: selectedStore.id } : {}),
  };
  const prevWhere: Prisma.WebsiteMetricWhereInput = {
    date: { gte: prevStart, lt: start },
    ...(selectedStore ? { storeId: selectedStore.id } : {}),
  };

  const [rows, prevRows, perStoreRows] = await Promise.all([
    prisma.websiteMetric.findMany({
      where,
      orderBy: { date: "asc" },
    }),
    prisma.websiteMetric.findMany({ where: prevWhere }),
    prisma.websiteMetric.groupBy({
      by: ["storeId"],
      where,
      _sum: { users: true, sessions: true, revenue: true, purchases: true },
    }),
  ]);

  const totals = rows.reduce(
    (acc, r) => ({
      users: acc.users + r.users,
      sessions: acc.sessions + r.sessions,
      engagedSessions: acc.engagedSessions + r.engagedSessions,
      pageViews: acc.pageViews + r.pageViews,
      productViews: acc.productViews + r.productViews,
      addToCarts: acc.addToCarts + r.addToCarts,
      checkouts: acc.checkouts + r.checkouts,
      purchases: acc.purchases + r.purchases,
      revenue: acc.revenue + num(r.revenue),
      conversionSum: acc.conversionSum + (r.conversionRate != null ? Number(r.conversionRate) : 0),
      conversionCount: acc.conversionCount + (r.conversionRate != null ? 1 : 0),
    }),
    {
      users: 0,
      sessions: 0,
      engagedSessions: 0,
      pageViews: 0,
      productViews: 0,
      addToCarts: 0,
      checkouts: 0,
      purchases: 0,
      revenue: 0,
      conversionSum: 0,
      conversionCount: 0,
    },
  );

  const prevTotals = prevRows.reduce(
    (acc, r) => ({
      users: acc.users + r.users,
      sessions: acc.sessions + r.sessions,
      purchases: acc.purchases + r.purchases,
      revenue: acc.revenue + num(r.revenue),
    }),
    { users: 0, sessions: 0, purchases: 0, revenue: 0 },
  );

  const storeMap = new Map(stores.map((s) => [s.id, s]));
  const perStore = perStoreRows
    .map((r) => {
      const store = storeMap.get(r.storeId);
      if (!store) return null;
      return {
        id: store.id,
        name: store.name,
        users: r._sum.users ?? 0,
        sessions: r._sum.sessions ?? 0,
        revenue: num(r._sum.revenue),
        purchases: r._sum.purchases ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.revenue - a.revenue);

  // Daily series — when no store filter, sum across stores per date.
  const dailyMap = new Map<
    string,
    { users: number; sessions: number; revenue: number; purchases: number }
  >();
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    const existing = dailyMap.get(key) ?? { users: 0, sessions: 0, revenue: 0, purchases: 0 };
    existing.users += r.users;
    existing.sessions += r.sessions;
    existing.revenue += num(r.revenue);
    existing.purchases += r.purchases;
    dailyMap.set(key, existing);
  }
  const daily = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    range,
    store: selectedStore,
    storeOptions: stores,
    totals: {
      users: totals.users,
      sessions: totals.sessions,
      engagedSessions: totals.engagedSessions,
      pageViews: totals.pageViews,
      productViews: totals.productViews,
      addToCarts: totals.addToCarts,
      checkouts: totals.checkouts,
      purchases: totals.purchases,
      revenue: totals.revenue,
      avgConversionRate:
        totals.conversionCount > 0 ? totals.conversionSum / totals.conversionCount : null,
    },
    prevTotals,
    daily,
    perStore,
  };
}
