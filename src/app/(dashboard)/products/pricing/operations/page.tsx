/**
 * DP-6C Pricing operations and reconciliation dashboard.
 *
 * A review surface, not a control surface. It shows what the system has
 * changed in the store and whether the store is still in that state. The only
 * action on it reads a live price and records what it saw.
 *
 * There are deliberately no bulk controls and no writeback or rollback buttons
 * here — those live on the individual recommendation, one record at a time,
 * behind their own gates. This page imports neither dangerous service.
 */
import Link from "next/link";
import { Download } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import {
  latestReconciliations,
  listApprovedNotWritten,
  listWritebackOperations,
  operationsCounts,
} from "@/server/services/pricing/operations-read";
import { runStagingPreflight } from "@/server/services/pricing/staging-preflight";
import {
  hasFailedRollbackAttempt,
  latestRollbackAttempt,
  OPERATIONS_FILTERS,
  parseOperationsFilter,
  type OperationsFilter,
} from "@/server/services/pricing/reconciliation";

import { ReconcileForm } from "./reconcile-form";

export const metadata = { title: "Pricing operations" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ filter?: string }> };

const money = (value: unknown): string => (value == null ? "—" : `$${Number(value).toFixed(2)}`);
const when = (value: Date | null): string =>
  value == null ? "—" : value.toISOString().slice(0, 16).replace("T", " ");

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "succeeded" || status === "matched") return "default";
  if (status === "rolled_back") return "secondary";
  if (status === "failed" || status === "mismatch" || status === "possible_landed_write") {
    return "destructive";
  }
  return "outline";
}

export default async function PricingOperationsPage({
  searchParams,
}: Props): Promise<React.JSX.Element> {
  const user = await requirePermission(PERMISSIONS.PRICING_VIEW);
  const canExport = userHasPermission(user, PERMISSIONS.PRICING_EXPORT);
  const canReconcile = userHasPermission(user, PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE);
  const filter = parseOperationsFilter((await searchParams).filter);

  const [counts, logs, approvedNotWritten, reconciliations, preflight] = await Promise.all([
    operationsCounts(),
    listWritebackOperations(),
    listApprovedNotWritten(),
    latestReconciliations(),
    // Read-only: flags, role grants, store mappings, and test data from the
    // local database. It contacts no store.
    runStagingPreflight(),
  ]);

  const matches = (log: (typeof logs)[number], f: OperationsFilter): boolean => {
    const obs = reconciliations.get(log.id);
    switch (f) {
      case "written_back":
        return log.status === "succeeded" && log.rollbackAt == null;
      case "rolled_back":
        return log.status === "rolled_back";
      case "writeback_failed":
        return log.status === "failed";
      case "rollback_failed":
        return hasFailedRollbackAttempt(log.rollbackPayload);
      case "needs_reconciliation":
        return log.status === "succeeded" && obs == null;
      case "mismatch":
        return obs?.status === "mismatch" || obs?.status === "possible_landed_write";
      case "approved_not_written":
        return false; // shown in its own table below
      default:
        return true;
    }
  };

  const visible = logs.filter((log) => matches(log, filter));

  const cards: [string, number][] = [
    ["Ready for review", counts.ready_for_review],
    ["Approved, not written", counts.approved_not_written],
    ["Written back", counts.written_back],
    ["Rolled back", counts.rolled_back],
    ["Writeback failed", counts.writeback_failed],
    ["Rollback failed/refused", counts.rollback_failed],
    ["Needs reconciliation", counts.needs_reconciliation],
    ["Mismatch found", counts.mismatch],
    ["Expired", counts.expired],
    ["Rejected", counts.rejected],
  ];

  return (
    <div>
      <PageHeader
        title="Pricing operations"
        description="This is an operator review and reconciliation dashboard. It does not automatically change prices. This page is read-only except for explicit one-record reconciliation checks. It does not automatically change BigCommerce prices."
        actions={
          canExport ? (
            <Button asChild variant="outline">
              <a href="/api/exports/pricing/writebacks">
                <Download /> Export CSV
              </a>
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {OPERATIONS_FILTERS.map((option) => (
          <Button
            key={option}
            asChild
            size="sm"
            variant={option === filter ? "default" : "outline"}
          >
            <Link href={`/products/pricing/operations?filter=${option}`}>
              {option.replaceAll("_", " ")}
            </Link>
          </Button>
        ))}
      </div>

      {filter === "approved_not_written" || filter === "all" ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Approved, not written back</CardTitle>
            <CardDescription>
              Recommendations a person approved that have no successful writeback behind them.
              Writing a price is done from the recommendation itself, one at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {approvedNotWritten.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing waiting.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Store</th>
                      <th className="py-2 pr-3">SKU</th>
                      <th className="py-2 pr-3">Product</th>
                      <th className="py-2 pr-3 text-right">Recommended</th>
                      <th className="py-2 pr-3">Approved</th>
                      <th className="py-2 pr-3">Attempts</th>
                      <th className="py-2 pr-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {approvedNotWritten.map((rec) => (
                      <tr key={rec.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{rec.pricingRunItem.store.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{rec.pricingRunItem.sku}</td>
                        <td className="max-w-[18rem] truncate py-2 pr-3">
                          {rec.pricingRunItem.productName ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-right">{money(rec.recommendedSalePrice)}</td>
                        <td className="py-2 pr-3 text-xs">{when(rec.approvedAt)}</td>
                        <td className="py-2 pr-3 text-xs">
                          {rec.writebackLogs.length === 0
                            ? "none"
                            : `${rec.writebackLogs.length} failed`}
                        </td>
                        <td className="py-2 pr-3">
                          <Link
                            href={`/products/pricing/recommendations/${rec.id}`}
                            className="text-xs hover:underline"
                          >
                            View recommendation
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">
            Pilot / staging readiness{" "}
            <Badge variant={preflight.ready ? "default" : "destructive"}>
              {preflight.ready ? "ready" : `${preflight.blockers} blocker(s)`}
            </Badge>
          </CardTitle>
          <CardDescription>
            Read-only preflight for the certification exercise — whether run in staging (
            <code>docs/29</code>) or as the controlled production pilot (<code>docs/34</code>). The
            checks are identical either way. It reads flags, role grants, store mappings, and test
            data locally. It contacts no store and changes nothing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {preflight.checks.map((c) => (
                  <tr key={c.id} className="border-b align-top last:border-0">
                    <td className="whitespace-nowrap py-2 pr-3">
                      <Badge
                        variant={
                          c.ok ? "default" : c.level === "blocker" ? "destructive" : "outline"
                        }
                      >
                        {c.ok ? "ok" : c.level}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{c.label}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Writeback log</CardTitle>
          <CardDescription>
            {visible.length === 0
              ? "No writeback logs match this filter."
              : `${visible.length} log(s). Reconciling reads the live BigCommerce price and records what it found — it changes nothing.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? null : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Store</th>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Writeback</th>
                    <th className="py-2 pr-3 text-right">Old sale</th>
                    <th className="py-2 pr-3 text-right">New sale</th>
                    <th className="py-2 pr-3">Written</th>
                    <th className="py-2 pr-3">Rolled back</th>
                    <th className="py-2 pr-3">Reconciliation</th>
                    <th className="py-2 pr-3 text-right">Live observed</th>
                    <th className="py-2 pr-3">Required action</th>
                    <th className="py-2 pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((log) => {
                    const obs = reconciliations.get(log.id);
                    const attempt = latestRollbackAttempt(log.rollbackPayload);
                    return (
                      <tr key={log.id} className="border-b align-top last:border-0">
                        <td className="py-2 pr-3">{log.store.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs">
                          {log.recommendation?.pricingRunItem?.sku ?? "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={statusVariant(log.status)}>
                            {log.status.replaceAll("_", " ")}
                          </Badge>
                          {attempt?.outcome && attempt.outcome !== "rolled_back" ? (
                            <p className="mt-1 text-xs text-destructive">
                              rollback {attempt.outcome}
                              {attempt.reason ? `: ${attempt.reason}` : ""}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3 text-right">{money(log.oldSalePrice)}</td>
                        <td className="py-2 pr-3 text-right">{money(log.newSalePrice)}</td>
                        <td className="py-2 pr-3 text-xs">{when(log.writtenAt)}</td>
                        <td className="py-2 pr-3 text-xs">{when(log.rollbackAt)}</td>
                        <td className="py-2 pr-3">
                          {obs == null ? (
                            <span className="text-xs text-muted-foreground">not checked</span>
                          ) : (
                            <>
                              <Badge variant={statusVariant(obs.status)}>
                                {obs.status.replaceAll("_", " ")}
                              </Badge>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {when(obs.observedAt)}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {obs == null ? "—" : money(obs.observedSalePrice)}
                        </td>
                        <td className="max-w-[18rem] py-2 pr-3 text-xs">
                          {obs?.requiredAction ?? "—"}
                        </td>
                        <td className="space-y-2 py-2 pr-3">
                          {log.recommendation ? (
                            <Link
                              href={`/products/pricing/recommendations/${log.recommendation.id}`}
                              className="block text-xs hover:underline"
                            >
                              View recommendation
                            </Link>
                          ) : null}
                          {canReconcile ? <ReconcileForm writebackLogId={log.id} /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
