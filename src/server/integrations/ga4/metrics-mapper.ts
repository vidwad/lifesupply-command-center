/**
 * Maps GA4 runReport responses onto WebsiteMetric upserts (Phase 6). Pure,
 * so the response-shape handling is unit-tested.
 */
import type { Ga4RunReportResponse } from "./client";

/** The daily report's metric order — must match DAILY_METRICS below. */
export const DAILY_METRICS = [
  "totalUsers",
  "sessions",
  "engagedSessions",
  "screenPageViews",
  "itemsViewed",
  "addToCarts",
  "checkouts",
  "ecommercePurchases",
  "purchaseRevenue",
] as const;

export type DailyMetricRow = {
  /** YYYY-MM-DD */
  date: string;
  users: number;
  sessions: number;
  engagedSessions: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;
  revenue: number;
  conversionRate: number | null;
};

function num(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** GA4 "20260801" → "2026-08-01"; returns null for anything malformed. */
export function parseGa4Date(raw: string | undefined): string | null {
  if (!raw || !/^\d{8}$/.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export function mapDailyReport(response: Ga4RunReportResponse): DailyMetricRow[] {
  const rows: DailyMetricRow[] = [];
  for (const row of response.rows ?? []) {
    const date = parseGa4Date(row.dimensionValues?.[0]?.value);
    if (!date) continue;
    const m = (i: number) => num(row.metricValues?.[i]?.value);
    const sessions = m(1);
    const purchases = m(7);
    rows.push({
      date,
      users: m(0),
      sessions,
      engagedSessions: m(2),
      pageViews: m(3),
      productViews: m(4),
      addToCarts: m(5),
      checkouts: m(6),
      purchases,
      revenue: Math.round(m(8) * 100) / 100,
      conversionRate: sessions > 0 ? Math.round((purchases / sessions) * 10_000) / 10_000 : null,
    });
  }
  return rows;
}

export type AttributionRow = {
  source: string;
  medium: string;
  sessions: number;
  revenue: number;
};

/** Attribution report: dimensions [sessionSource, sessionMedium], metrics [sessions, purchaseRevenue]. */
export function mapAttributionReport(response: Ga4RunReportResponse): AttributionRow[] {
  return (response.rows ?? []).map((row) => ({
    source: row.dimensionValues?.[0]?.value ?? "(unknown)",
    medium: row.dimensionValues?.[1]?.value ?? "(unknown)",
    sessions: num(row.metricValues?.[0]?.value),
    revenue: Math.round(num(row.metricValues?.[1]?.value) * 100) / 100,
  }));
}
