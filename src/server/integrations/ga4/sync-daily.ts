/**
 * GA4 → WebsiteMetric daily read sync for one property/store (Phase 6).
 * Pulls the last N days of core e-commerce metrics plus a source/medium
 * attribution summary (stored in the sync log + latest day's metadata).
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

import { getGa4AccessToken, parseServiceAccountJson, runGa4Report } from "./client";
import { DAILY_METRICS, mapAttributionReport, mapDailyReport } from "./metrics-mapper";

export type SyncGa4Input = {
  serviceAccountJson: string;
  propertyId: string;
  storeId: string;
  days?: number;
};

export type SyncGa4Counts = {
  daysReturned: number;
  metricsCreated: number;
  metricsUpdated: number;
  attributionRows: number;
  errorMessages: string[];
};

export async function syncGa4Daily(input: SyncGa4Input): Promise<SyncGa4Counts> {
  const counts: SyncGa4Counts = {
    daysReturned: 0,
    metricsCreated: 0,
    metricsUpdated: 0,
    attributionRows: 0,
    errorMessages: [],
  };

  const days = Math.min(Math.max(input.days ?? 30, 1), 90);
  const key = parseServiceAccountJson(input.serviceAccountJson);
  const token = await getGa4AccessToken(key);

  const [daily, attribution] = await Promise.all([
    runGa4Report(token, input.propertyId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: DAILY_METRICS.map((name) => ({ name })),
      limit: "100",
    }),
    runGa4Report(token, input.propertyId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }, { name: "purchaseRevenue" }],
      limit: "20",
    }).catch((err) => {
      counts.errorMessages.push(
        `Attribution report: ${err instanceof Error ? err.message : "failed"}`,
      );
      return null;
    }),
  ]);

  const rows = mapDailyReport(daily);
  counts.daysReturned = rows.length;
  const attributionRows = attribution ? mapAttributionReport(attribution) : [];
  counts.attributionRows = attributionRows.length;
  const latestDate = rows.reduce((max, r) => (r.date > max ? r.date : max), "");

  for (const row of rows) {
    try {
      const date = new Date(`${row.date}T00:00:00.000Z`);
      const metadata =
        row.date === latestDate && attributionRows.length > 0
          ? ({ attribution: attributionRows, windowDays: days } as Prisma.InputJsonValue)
          : undefined;
      const data = {
        sourceSystem: "ga4",
        users: row.users,
        sessions: row.sessions,
        engagedSessions: row.engagedSessions,
        pageViews: row.pageViews,
        productViews: row.productViews,
        addToCarts: row.addToCarts,
        checkouts: row.checkouts,
        purchases: row.purchases,
        revenue: row.revenue,
        conversionRate: row.conversionRate,
        ...(metadata ? { metadata } : {}),
      };
      const result = await prisma.websiteMetric.upsert({
        where: { storeId_date: { storeId: input.storeId, date } },
        create: { storeId: input.storeId, date, ...data },
        update: data,
      });
      if (result.createdAt.getTime() >= Date.now() - 5_000) counts.metricsCreated++;
      else counts.metricsUpdated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      if (counts.errorMessages.length < 20) counts.errorMessages.push(`${row.date}: ${msg}`);
    }
  }

  return counts;
}
