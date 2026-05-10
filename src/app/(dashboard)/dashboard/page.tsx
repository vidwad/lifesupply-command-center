import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  PackageCheck,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { AiBriefingPanel } from "@/components/ai/AiBriefingPanel";
import { CampaignSummary } from "@/components/data/CampaignSummary";
import { ChartCard } from "@/components/data/ChartCard";
import { ExceptionList } from "@/components/data/ExceptionList";
import { KpiCard } from "@/components/data/KpiCard";
import { OperationsSummary } from "@/components/data/OperationsSummary";
import { ProductLeaderboard } from "@/components/data/ProductLeaderboard";
import { TaskList } from "@/components/data/TaskList";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getDashboardData } from "@/server/services/dashboard";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const metadata = { title: "Executive Dashboard" };
// Always rebuild on request — the dashboard reads live operating counts.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  const data = await getDashboardData();
  const canRegenerateBriefing = userHasPermission(user, PERMISSIONS.AI_USE);

  const periodLabel = data.period?.name ?? "No open period";
  const compareCaption = data.previousPeriod
    ? `vs. ${data.previousPeriod.name}`
    : "no prior period";

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Consolidated view across LifeSupply Canada, Wellmart Medical, and U.S. operations."
        breadcrumb={`Period: ${periodLabel}`}
        actions={
          data.period && (
            <Badge variant={data.period.status === "open" ? "secondary" : "success"}>
              {data.period.status.replace("_", " ")}
            </Badge>
          )
        }
      />

      <div className="space-y-6 p-6">
        {/* Row 1 — KPI cards */}
        <section
          aria-label="Key performance indicators"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          <KpiCard
            label="Revenue"
            value={formatCurrency(data.revenue.current)}
            caption={compareCaption}
            deltaPct={data.revenue.deltaPct}
            icon={CircleDollarSign}
          />
          <KpiCard
            label="Gross Profit"
            value={formatCurrency(data.grossProfit.current)}
            caption={compareCaption}
            deltaPct={data.grossProfit.deltaPct}
            icon={TrendingUp}
          />
          <KpiCard
            label="Gross Margin"
            value={
              data.grossMargin.current != null ? formatPercent(data.grossMargin.current, 1) : "—"
            }
            caption={
              data.grossMargin.previous != null
                ? `prior: ${formatPercent(data.grossMargin.previous, 1)}`
                : compareCaption
            }
            deltaPct={
              data.grossMargin.current != null && data.grossMargin.previous != null
                ? data.grossMargin.current - data.grossMargin.previous
                : null
            }
            deltaPolarity="up_is_good"
            icon={Percent}
          />
          <KpiCard
            label="Open Orders"
            value={data.operations.openOrders.toString()}
            caption={`${data.operations.exceptionOrders} need attention`}
            icon={PackageCheck}
            tone={data.operations.exceptionOrders > 0 ? "warning" : "default"}
          />
          <KpiCard
            label="Cash"
            value={data.cash.current != null ? formatCurrency(data.cash.current) : "—"}
            caption={
              data.workingCapital.current != null
                ? `WC ${formatCurrency(data.workingCapital.current)}`
                : "no balance loaded"
            }
            icon={Wallet}
          />
          <KpiCard
            label="Operating Income"
            value={formatCurrency(data.operatingIncome.current)}
            caption={compareCaption}
            deltaPct={data.operatingIncome.deltaPct}
            icon={Banknote}
          />
        </section>

        {/* Row 2 — trend chart + AI briefing */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard
            title="Revenue & Gross Profit — last 6 periods"
            description="Consolidated across operating divisions"
            className="lg:col-span-2"
          >
            {data.trend.length > 0 ? (
              <RevenueTrendChart data={data.trend} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Run <code>pnpm db:seed</code> to populate financial periods.
              </p>
            )}
          </ChartCard>
          <AiBriefingPanel briefing={data.aiBriefing} canRegenerate={canRegenerateBriefing} />
        </section>

        {/* Row 3 — product leaderboards + campaigns */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ProductLeaderboard
            title="Top products"
            description="By revenue, last 90 days"
            products={data.topProducts}
            secondaryMetric="quantity"
          />
          <ProductLeaderboard
            title="Low-margin products"
            description="Margin below 35%, last 90 days"
            icon={AlertTriangle}
            products={data.lowMarginProducts}
            secondaryMetric="margin"
          />
          <CampaignSummary campaigns={data.campaigns} />
        </section>

        {/* Row 4 — priority tasks + exceptions + operations counts */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TaskList tasks={data.priorityTasks} />
          <ExceptionList exceptions={data.exceptions} />
          <OperationsSummary data={data.operations} />
        </section>
      </div>
    </div>
  );
}
