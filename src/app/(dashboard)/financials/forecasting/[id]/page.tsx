import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import type { ForecastRow } from "@/server/services/financials/forecast-engine";
import { getForecastScenario } from "@/server/services/financials/forecast-scenarios";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { ScenarioControls } from "./scenario-controls";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  draft: "outline",
  under_review: "warning",
  approved: "success",
  archived: "outline",
};

const money = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("en-CA", { maximumFractionDigits: 0 });
const pct = (n: number | null) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);

export default async function ScenarioDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.FINANCIALS_VIEW_DETAIL);
  const canReview = userHasPermission(user, PERMISSIONS.FINANCIALS_REVIEW);
  const canExport = userHasPermission(user, PERMISSIONS.FINANCIALS_EXPORT);
  const { id } = await params;
  const scenario = await getForecastScenario(id);
  if (!scenario) notFound();

  const rows = (Array.isArray(scenario.results)
    ? scenario.results
    : []) as unknown as ForecastRow[];
  const assumptions = (scenario.assumptions ?? {}) as Record<string, unknown>;
  const limitations = (Array.isArray(scenario.limitations) ? scenario.limitations : []) as string[];
  const sourceRefs = (scenario.sourceReferences ?? {}) as {
    sourcePeriods?: { name: string; status: string; sourceSystem: string | null }[];
    dataFreshness?: Record<string, string | boolean | null>;
  };

  return (
    <div>
      <PageHeader
        title={`${scenario.name} — v${scenario.version}`}
        description="FORECAST — estimates built from stated assumptions, not actual results."
        breadcrumb={
          <Link
            href="/financials/forecasting"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Forecasting
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[scenario.status] ?? "outline"}>
              {scenario.status.replace(/_/g, " ")}
            </Badge>
            {canExport && (
              <a
                href={`/api/exports/forecast/${scenario.id}`}
                className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <Download className="h-4 w-4" /> CSV
              </a>
            )}
          </div>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Baseline vs scenario</CardTitle>
              <CardDescription className="text-xs">
                Method: {scenario.method.replace(/_/g, " ")} · {scenario.horizonMonths} months. Cash
                impact is indicative only — see limitations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Period</TH>
                    <TH align="right">Base revenue</TH>
                    <TH align="right">Scenario revenue</TH>
                    <TH align="right">Base GM</TH>
                    <TH align="right">Scenario GM</TH>
                    <TH align="right">Base GP</TH>
                    <TH align="right">Scenario GP</TH>
                    <TH align="right">Cash impact (cum.)</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((r) => (
                    <TR key={r.period}>
                      <TD className="font-medium">{r.period}</TD>
                      <TD align="right" className="tabular-nums">
                        {money(r.baselineRevenue)}
                      </TD>
                      <TD align="right" className="font-medium tabular-nums">
                        {money(r.scenarioRevenue)}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {pct(r.baselineGrossMarginPct)}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {pct(r.scenarioGrossMarginPct)}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {money(r.baselineGrossProfit)}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {money(r.scenarioGrossProfit)}
                      </TD>
                      <TD
                        align="right"
                        className={`tabular-nums ${r.indicativeCashImpact < 0 ? "text-destructive" : ""}`}
                      >
                        {money(r.indicativeCashImpact)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Limitations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assumptions</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1.5 text-xs">
                {Object.entries(assumptions).map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between gap-2">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-mono">{String(value)}</dd>
                  </div>
                ))}
              </dl>
              {scenario.notes && (
                <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">{scenario.notes}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sources & freshness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                Source periods:{" "}
                {sourceRefs.sourcePeriods
                  ?.map(
                    (p) => `${p.name} (${p.status}${p.sourceSystem ? `, ${p.sourceSystem}` : ""})`,
                  )
                  .join(" · ") ?? "unknown"}
              </p>
              <p>
                QuickBooks last successful sync:{" "}
                {typeof sourceRefs.dataFreshness?.qboLastSuccessfulSyncAt === "string"
                  ? formatDateTime(new Date(sourceRefs.dataFreshness.qboLastSuccessfulSyncAt))
                  : "never"}
              </p>
              <p>
                Generated{" "}
                {typeof sourceRefs.dataFreshness?.generatedAt === "string"
                  ? formatDateTime(new Date(sourceRefs.dataFreshness.generatedAt))
                  : formatDateTime(scenario.createdAt)}{" "}
                by {scenario.createdBy?.name ?? scenario.createdBy?.email ?? "unknown"}
              </p>
              {scenario.approvedBy && scenario.approvedAt && (
                <p className="text-success">
                  Approved by {scenario.approvedBy.name ?? scenario.approvedBy.email} ·{" "}
                  {formatDateTime(scenario.approvedAt)}
                </p>
              )}
            </CardContent>
          </Card>

          {canReview && scenario.status !== "archived" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Lifecycle</CardTitle>
                <CardDescription className="text-xs">
                  Approval (financials.approve) is required before using this scenario in any
                  external material.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioControls scenarioId={scenario.id} status={scenario.status} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
