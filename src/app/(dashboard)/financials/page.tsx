import Link from "next/link";
import { Bot, Clock } from "lucide-react";

import { DivisionComparisonChart } from "@/components/charts/DivisionComparisonChart";
import { FinancialTrendChart } from "@/components/charts/FinancialTrendChart";
import { ChartCard } from "@/components/data/ChartCard";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { ExportButton } from "@/components/data/ExportButton";
import { KpiCard } from "@/components/data/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { CircleDollarSign } from "lucide-react";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getFinancialDashboardData, listFinancialSelectors } from "@/server/services/financials";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const metadata = { title: "Financials" };
export const dynamic = "force-dynamic";

const APPROVAL_BADGE: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
  withdrawn: "outline",
  not_required: "outline",
};

type SearchParams = { period?: string; division?: string };

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.FINANCIALS_VIEW_SUMMARY);
  const params = await searchParams;
  const canExport = userHasPermission(user, PERMISSIONS.FINANCIALS_EXPORT);

  const selectors = await listFinancialSelectors();

  if (selectors.periods.length === 0) {
    return (
      <div>
        <PageHeader
          title="Financials"
          description="Management-level financial reporting across consolidated and divisional operations."
        />
        <div className="p-6">
          <EmptyState
            icon={CircleDollarSign}
            title="No financial periods are available"
            description="Run pnpm db:seed to populate sample financial periods, or import a QuickBooks export. QuickBooks remains the accounting source of truth — this view is for management reporting only."
          />
        </div>
      </div>
    );
  }

  const data = await getFinancialDashboardData({
    periodId: params.period,
    divisionCode: params.division,
  });

  if (!data) {
    return (
      <div>
        <PageHeader title="Financials" />
        <div className="p-6">
          <EmptyState
            icon={CircleDollarSign}
            title="No data for this selection"
            description="Choose a different period or division."
          />
        </div>
      </div>
    );
  }

  const compareCaption = data.previousPeriod
    ? `vs. ${data.previousPeriod.name}`
    : "no prior period";

  return (
    <div>
      <PageHeader
        title="Financials"
        description={`${data.division.name} • ${data.period.name}`}
        breadcrumb="Source of truth: QuickBooks. Command Center reports management view only."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={APPROVAL_BADGE[data.approvalStatus] ?? "outline"}>
              {data.approvalStatus.replace("_", " ")}
            </Badge>
            <Badge variant={data.period.status === "open" ? "secondary" : "success"}>
              {data.period.status.replace("_", " ")}
            </Badge>
            <Link
              href="/financials/close"
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Monthly close
            </Link>
            <Link
              href="/financials/adjustments"
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Adjustments
            </Link>
            <Link
              href="/financials/budgets"
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Budgets
            </Link>
            {canExport && (
              <>
                <ExportButton
                  href={`/api/exports/financials${params.period ? `?period=${params.period}` : ""}`}
                  label="Export CSV"
                />
                <ExportButton
                  href={`/api/exports/financials/xlsx${params.period ? `?period=${params.period}` : ""}`}
                  label="Export XLSX"
                />
              </>
            )}
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* Selectors */}
        <form
          action="/financials"
          className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="period"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Period
            </label>
            <select
              id="period"
              name="period"
              defaultValue={data.period.id}
              className="h-9 min-w-[180px] rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {selectors.periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="division"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Division
            </label>
            <select
              id="division"
              name="division"
              defaultValue={data.division.code}
              className="h-9 min-w-[180px] rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {selectors.divisions.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
          {data.notes && (
            <p className="ml-auto max-w-md text-xs italic text-muted-foreground">{data.notes}</p>
          )}
        </form>

        {/* P&L KPIs */}
        <section
          aria-label="Profit and loss"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          <KpiCard
            label="Revenue"
            value={formatCurrency(data.revenue.current, data.currency)}
            caption={compareCaption}
            deltaPct={data.revenue.deltaPct}
          />
          <KpiCard
            label="COGS"
            value={formatCurrency(data.cogs.current, data.currency)}
            caption={compareCaption}
            deltaPct={data.cogs.deltaPct}
            deltaPolarity="down_is_good"
          />
          <KpiCard
            label="Gross Profit"
            value={formatCurrency(data.grossProfit.current, data.currency)}
            caption={compareCaption}
            deltaPct={data.grossProfit.deltaPct}
          />
          <KpiCard
            label="Gross Margin"
            value={
              data.grossMargin.current != null ? formatPercent(data.grossMargin.current, 1) : "—"
            }
            caption={
              data.grossMargin.previous != null
                ? `prior ${formatPercent(data.grossMargin.previous, 1)}`
                : compareCaption
            }
            deltaPct={
              data.grossMargin.current != null && data.grossMargin.previous != null
                ? data.grossMargin.current - data.grossMargin.previous
                : null
            }
          />
          <KpiCard
            label="Operating Expenses"
            value={formatCurrency(data.operatingExpenses.current, data.currency)}
            caption={compareCaption}
            deltaPct={data.operatingExpenses.deltaPct}
            deltaPolarity="down_is_good"
          />
          <KpiCard
            label="Operating Income"
            value={formatCurrency(data.operatingIncome.current, data.currency)}
            caption={compareCaption}
            deltaPct={data.operatingIncome.deltaPct}
          />
        </section>

        {/* Cash flow / balance sheet KPIs */}
        <section
          aria-label="Balance sheet"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
        >
          <KpiCard
            label="EBITDA"
            value={
              data.ebitda.current != null ? formatCurrency(data.ebitda.current, data.currency) : "—"
            }
            caption={compareCaption}
            deltaPct={data.ebitda.deltaPct}
          />
          <KpiCard
            label="Adjusted EBITDA"
            value={
              data.adjustedEbitda.current != null
                ? formatCurrency(data.adjustedEbitda.current, data.currency)
                : "—"
            }
            caption={compareCaption}
            deltaPct={data.adjustedEbitda.deltaPct}
          />
          <KpiCard
            label="Cash"
            value={
              data.cash.current != null ? formatCurrency(data.cash.current, data.currency) : "—"
            }
            caption={compareCaption}
            deltaPct={data.cash.deltaPct}
          />
          <KpiCard
            label="Accounts Receivable"
            value={
              data.accountsReceivable.current != null
                ? formatCurrency(data.accountsReceivable.current, data.currency)
                : "—"
            }
            caption={compareCaption}
            deltaPct={data.accountsReceivable.deltaPct}
            deltaPolarity="neutral"
          />
          <KpiCard
            label="Accounts Payable"
            value={
              data.accountsPayable.current != null
                ? formatCurrency(data.accountsPayable.current, data.currency)
                : "—"
            }
            caption={compareCaption}
            deltaPct={data.accountsPayable.deltaPct}
            deltaPolarity="neutral"
          />
          <KpiCard
            label="Working Capital"
            value={
              data.workingCapital.current != null
                ? formatCurrency(data.workingCapital.current, data.currency)
                : "—"
            }
            caption={compareCaption}
            deltaPct={data.workingCapital.deltaPct}
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title={`${data.division.name} — last 6 periods`}
            description="Revenue, gross profit, and operating income"
          >
            {data.trend.length > 0 ? (
              <FinancialTrendChart data={data.trend} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No trend data available.
              </p>
            )}
          </ChartCard>
          <ChartCard
            title="Division comparison"
            description={`Revenue + gross profit by operating division — ${data.period.name}`}
          >
            {data.divisionComparison.length > 0 ? (
              <DivisionComparisonChart data={data.divisionComparison} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No comparison data available.
              </p>
            )}
          </ChartCard>
        </section>

        {/* Monthly summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly summary — operating divisions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.monthlyTable.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No periods to display.</p>
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>Period</TH>
                    <TH>Status</TH>
                    <TH>Division</TH>
                    <TH align="right">Revenue</TH>
                    <TH align="right">Gross Profit</TH>
                    <TH align="right">GM %</TH>
                    <TH align="right">Operating Income</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.monthlyTable.flatMap((mp) =>
                    mp.rows.map((r, idx) => (
                      <TR key={`${mp.periodName}-${r.divisionCode}`}>
                        <TD className={idx === 0 ? "font-medium" : "text-muted-foreground"}>
                          {idx === 0 ? mp.periodName : ""}
                        </TD>
                        <TD>
                          {idx === 0 && (
                            <Badge variant={mp.periodStatus === "open" ? "secondary" : "success"}>
                              {mp.periodStatus.replace("_", " ")}
                            </Badge>
                          )}
                        </TD>
                        <TD className="text-muted-foreground">{r.divisionCode}</TD>
                        <TD align="right" className="tabular-nums">
                          {formatCurrency(r.revenue, data.currency)}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {formatCurrency(r.grossProfit, data.currency)}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {r.grossMargin != null ? formatPercent(r.grossMargin, 1) : "—"}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {formatCurrency(r.operatingIncome, data.currency)}
                        </TD>
                      </TR>
                    )),
                  )}
                </TBody>
              </DataTable>
            )}
          </CardContent>
        </Card>

        {/* AI commentary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" /> AI financial commentary
            </CardTitle>
            {data.aiCommentary && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> Generated{" "}
                {formatDateTime(data.aiCommentary.createdAt)} • {data.aiCommentary.modelName}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {data.aiCommentary ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {data.aiCommentary.output}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                No financial commentary generated yet. AI commentary will appear here when an
                analyst run completes for the selected period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
