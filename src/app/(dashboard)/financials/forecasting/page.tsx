import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { isFeatureOn } from "@/server/services/feature-flags";
import { listForecastScenarios } from "@/server/services/financials/forecast-scenarios";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { ScenarioForm } from "./scenario-form";

export const metadata = { title: "Forecasting & scenarios" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  draft: "outline",
  under_review: "warning",
  approved: "success",
  archived: "outline",
};

export default async function ForecastingPage() {
  const user = await requirePermission(PERMISSIONS.FINANCIALS_VIEW_DETAIL);
  const canCreate = userHasPermission(user, PERMISSIONS.FINANCIALS_REVIEW);
  const [flagOn, scenarios] = await Promise.all([
    isFeatureOn(FEATURE_FLAGS.FORECASTING),
    listForecastScenarios(),
  ]);

  return (
    <div>
      <PageHeader
        title="Forecasting & scenarios"
        description="Versioned management forecasts with explicit assumptions and limitations. Forecasts are estimates — never actuals."
        breadcrumb={
          <Link href="/financials" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Financials
          </Link>
        }
        actions={
          <Badge variant={flagOn ? "success" : "outline"}>
            forecasting.enabled: {flagOn ? "ON" : "OFF"}
          </Badge>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scenarios</CardTitle>
              <CardDescription className="text-xs">
                Baselines extrapolate consolidated monthly actuals (QuickBooks-synced where
                available). Approval for external use requires financials.approve via /approvals.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {scenarios.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={TrendingUp}
                    title="No scenarios yet"
                    description="Generate the first forecast from the panel on the right."
                  />
                </div>
              ) : (
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Scenario</TH>
                      <TH>Method</TH>
                      <TH>Horizon</TH>
                      <TH>Status</TH>
                      <TH>Created</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {scenarios.map((s) => (
                      <TR key={s.id}>
                        <TD>
                          <Link
                            href={`/financials/forecasting/${s.id}`}
                            className="font-medium hover:underline"
                          >
                            {s.name} <span className="text-muted-foreground">v{s.version}</span>
                          </Link>
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {s.method.replace(/_/g, " ")}
                        </TD>
                        <TD className="text-xs">{s.horizonMonths} mo</TD>
                        <TD>
                          <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>
                            {s.status.replace(/_/g, " ")}
                          </Badge>
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {formatDateTime(s.createdAt)}
                          {s.createdBy && (
                            <div className="text-[10px]">
                              {s.createdBy.name ?? s.createdBy.email}
                            </div>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!flagOn && (
            <div className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              The <code>forecasting.enabled</code> flag is OFF — scenario generation is disabled.
              Enable it in{" "}
              <Link href="/admin/feature-flags" className="underline">
                /admin/feature-flags
              </Link>
              .
            </div>
          )}
          {canCreate ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">New scenario</CardTitle>
                <CardDescription className="text-xs">
                  Leave assumption fields blank for a pure baseline projection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioForm />
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              You can view scenarios but not create them. Requires{" "}
              <code className="rounded bg-muted px-1">{PERMISSIONS.FINANCIALS_REVIEW}</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
