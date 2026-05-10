import Link from "next/link";
import {
  Activity,
  CircleDollarSign,
  Eye,
  LineChart as LineChartIcon,
  ShoppingCart,
  Users,
} from "lucide-react";

import { TrafficChart } from "@/components/charts/TrafficChart";
import { ChartCard } from "@/components/data/ChartCard";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { KpiCard } from "@/components/data/KpiCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getAnalyticsDashboard, type AnalyticsRange } from "@/server/services/analytics";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

type SearchParams = { range?: string; store?: string };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.ANALYTICS_VIEW);
  const params = await searchParams;

  const range = (RANGES.find((r) => r.value === params.range)?.value ?? "30d") as AnalyticsRange;

  const data = await getAnalyticsDashboard({
    range,
    storeId: params.store || undefined,
  });

  const deltaPct = (current: number, previous: number) => {
    if (previous === 0) return null;
    return (current - previous) / previous;
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Website traffic, engagement, conversion, and campaign attribution from GA4."
        breadcrumb={`${data.range.toUpperCase()} • ${data.store?.name ?? "All stores"}`}
      />

      <div className="space-y-6 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => {
            const isActive = data.range === r.value;
            const next = new URLSearchParams();
            if (r.value !== "30d") next.set("range", r.value);
            if (params.store) next.set("store", params.store);
            const href = `/analytics${next.toString() ? `?${next}` : ""}`;
            return (
              <Link
                key={r.value}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {r.label}
              </Link>
            );
          })}

          <div className="ml-2 h-5 w-px bg-border" />

          {[{ id: "", name: "All stores" }, ...data.storeOptions].map((s) => {
            const isActive = (params.store ?? "") === s.id;
            const next = new URLSearchParams();
            if (range !== "30d") next.set("range", range);
            if (s.id) next.set("store", s.id);
            const href = `/analytics${next.toString() ? `?${next}` : ""}`;
            return (
              <Link
                key={s.id || "all"}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {s.name}
              </Link>
            );
          })}
        </div>

        {/* KPI row */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <KpiCard
            label="Users"
            value={data.totals.users.toLocaleString()}
            caption={`prior ${data.prevTotals.users.toLocaleString()}`}
            deltaPct={deltaPct(data.totals.users, data.prevTotals.users)}
            icon={Users}
          />
          <KpiCard
            label="Sessions"
            value={data.totals.sessions.toLocaleString()}
            caption={`prior ${data.prevTotals.sessions.toLocaleString()}`}
            deltaPct={deltaPct(data.totals.sessions, data.prevTotals.sessions)}
            icon={Activity}
          />
          <KpiCard
            label="Page views"
            value={data.totals.pageViews.toLocaleString()}
            caption={`${data.totals.productViews.toLocaleString()} product views`}
            icon={Eye}
          />
          <KpiCard
            label="Purchases"
            value={data.totals.purchases.toLocaleString()}
            caption={`prior ${data.prevTotals.purchases.toLocaleString()}`}
            deltaPct={deltaPct(data.totals.purchases, data.prevTotals.purchases)}
            icon={ShoppingCart}
          />
          <KpiCard
            label="Revenue"
            value={formatCurrency(data.totals.revenue)}
            caption={`prior ${formatCurrency(data.prevTotals.revenue)}`}
            deltaPct={deltaPct(data.totals.revenue, data.prevTotals.revenue)}
            icon={CircleDollarSign}
          />
          <KpiCard
            label="Conversion rate"
            value={
              data.totals.avgConversionRate != null
                ? formatPercent(data.totals.avgConversionRate, 2)
                : "—"
            }
            caption="avg of daily rates"
            icon={LineChartIcon}
          />
        </section>

        {/* Trend chart */}
        <ChartCard
          title="Daily sessions"
          description={`${data.range.toUpperCase()} sessions${data.store ? ` for ${data.store.name}` : " across all stores"}`}
        >
          {data.daily.length > 0 ? (
            <TrafficChart data={data.daily} primaryMetric="sessions" />
          ) : (
            <EmptyState
              icon={LineChartIcon}
              title="No analytics data for this range"
              description="Configure GA4 in Admin Settings or run pnpm db:seed to populate sample metrics."
            />
          )}
        </ChartCard>

        {/* Per-store breakdown */}
        {!data.store && data.perStore.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              By store
            </h2>
            <DataTable>
              <THead>
                <tr>
                  <TH>Store</TH>
                  <TH align="right">Users</TH>
                  <TH align="right">Sessions</TH>
                  <TH align="right">Purchases</TH>
                  <TH align="right">Revenue</TH>
                </tr>
              </THead>
              <TBody>
                {data.perStore.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-medium">{s.name}</TD>
                    <TD align="right" className="tabular-nums">
                      {s.users.toLocaleString()}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {s.sessions.toLocaleString()}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {s.purchases.toLocaleString()}
                    </TD>
                    <TD align="right" className="font-medium tabular-nums">
                      {formatCurrency(s.revenue)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
          </section>
        )}
      </div>
    </div>
  );
}
