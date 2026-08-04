import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate, formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listRecentReconciliationReports } from "@/server/services/sync/reconciliation-reports";
import { requirePermission } from "@/server/permissions";

import { RunReconciliationButton } from "./run-button";

export const metadata = { title: "Reconciliation" };
export const dynamic = "force-dynamic";

function fmtValue(kind: string, v: number | null): string {
  if (v == null) return "—";
  return kind === "money"
    ? v.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
    : v.toLocaleString();
}

export default async function ReconciliationPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const reports = await listRecentReconciliationReports();

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Command Center totals vs BigCommerce source totals, by store. Material gaps raise exceptions."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
        actions={<RunReconciliationButton />}
      />

      <div className="space-y-6 p-6">
        {reports.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No reconciliation reports yet"
            description="Run a reconciliation to compare synced data against BigCommerce source totals. Runs execute on the background worker."
          />
        ) : (
          reports.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {r.storeName}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {formatDate(r.rangeStart)} → {formatDate(r.rangeEnd)} · ran{" "}
                      {formatDateTime(r.createdAt)}
                      {r.triggeredByName ? ` by ${r.triggeredByName}` : ""}
                    </span>
                  </CardTitle>
                  <Badge variant={r.status === "ok" ? "success" : "destructive"}>
                    {r.status === "ok" ? "OK" : `${r.discrepancyCount} discrepancies`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <DataTable>
                  <THead>
                    <TR>
                      <TH>Metric</TH>
                      <TH className="text-right">Command Center</TH>
                      <TH className="text-right">BigCommerce</TH>
                      <TH className="text-right">Delta</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {r.metrics.map((m) => (
                      <TR key={m.metric}>
                        <TD>
                          <span className="font-medium">{m.label}</span>
                          {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
                        </TD>
                        <TD className="text-right font-mono">{fmtValue(m.kind, m.ccValue)}</TD>
                        <TD className="text-right font-mono">{fmtValue(m.kind, m.bcValue)}</TD>
                        <TD className="text-right font-mono">
                          {m.delta == null
                            ? "—"
                            : `${m.delta > 0 ? "+" : ""}${fmtValue(m.kind, m.delta)} (${((m.deltaPct ?? 0) * 100).toFixed(2)}%)`}
                        </TD>
                        <TD>
                          {m.bcValue == null ? (
                            <Badge variant="outline">info</Badge>
                          ) : m.material ? (
                            <Badge variant="destructive">material</Badge>
                          ) : (
                            <Badge variant="success">ok</Badge>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
