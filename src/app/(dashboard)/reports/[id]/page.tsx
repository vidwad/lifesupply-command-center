import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatDateTime, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getReportById, type ReportSnapshot } from "@/server/services/reports";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, "success" | "secondary" | "warning" | "outline"> = {
  approved: "success",
  generated: "secondary",
  draft: "outline",
  under_review: "warning",
  archived: "outline",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const report = await getReportById(id);
  return { title: report ? report.title : "Report" };
}

export default async function ReportDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) notFound();

  const snapshot = report.metadata as unknown as ReportSnapshot | null;
  const canExport = userHasPermission(user, PERMISSIONS.REPORTS_EXPORT);

  return (
    <div>
      <PageHeader
        title={report.title}
        description={`Generated ${formatDateTime(report.createdAt)} by ${report.preparedBy?.name ?? report.preparedBy?.email ?? "system"}`}
        breadcrumb={
          <Link href="/reports" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Reports
          </Link>
        }
        actions={
          <div className="flex gap-2">
            <Badge variant={STATUS_BADGE[report.status] ?? "outline"}>
              {report.status.replace("_", " ")}
            </Badge>
            <Link href={`/reports/${report.id}/print`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4" /> Print view
              </Button>
            </Link>
            {canExport && (
              <Button size="sm" variant="outline" asChild>
                <a href={`/api/reports/${report.id}/pdf`}>
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {report.summary && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Executive summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{report.summary}</p>
            </CardContent>
          </Card>
        )}

        {snapshot && <ReportBody snapshot={snapshot} />}
      </div>
    </div>
  );
}

function ReportBody({ snapshot }: { snapshot: ReportSnapshot }) {
  const f = snapshot.financial;
  const p = snapshot.prevFinancial;
  const delta = (cur: number, prev: number | null) => {
    if (prev == null || prev === 0) return "—";
    const d = (cur - prev) / prev;
    return `${d >= 0 ? "+" : ""}${(d * 100).toFixed(1)}%`;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Financials — {snapshot.division.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">Metric</th>
                <th className="py-2 text-right">{snapshot.period.name}</th>
                <th className="py-2 text-right">{snapshot.prevPeriod?.name ?? "Prior"}</th>
                <th className="py-2 text-right">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <FinRow
                label="Revenue"
                cur={f.revenue}
                prev={p?.revenue ?? null}
                delta={delta(f.revenue, p?.revenue ?? null)}
              />
              <FinRow
                label="COGS"
                cur={f.cogs}
                prev={p?.cogs ?? null}
                delta={delta(f.cogs, p?.cogs ?? null)}
              />
              <FinRow
                label="Gross profit"
                cur={f.grossProfit}
                prev={p?.grossProfit ?? null}
                delta={delta(f.grossProfit, p?.grossProfit ?? null)}
              />
              <tr>
                <td className="py-2">Gross margin</td>
                <td className="py-2 text-right tabular-nums">
                  {f.grossMargin != null ? formatPercent(f.grossMargin, 1) : "—"}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {p?.grossMargin != null ? formatPercent(p.grossMargin, 1) : "—"}
                </td>
                <td className="py-2 text-right text-xs text-muted-foreground">
                  {f.grossMargin != null && p?.grossMargin != null
                    ? `${f.grossMargin - p.grossMargin >= 0 ? "+" : ""}${((f.grossMargin - p.grossMargin) * 100).toFixed(1)}pp`
                    : "—"}
                </td>
              </tr>
              <FinRow
                label="Operating expenses"
                cur={f.operatingExpenses}
                prev={p?.operatingExpenses ?? null}
                delta={delta(f.operatingExpenses, p?.operatingExpenses ?? null)}
              />
              <FinRow
                label="Operating income"
                cur={f.operatingIncome}
                prev={p?.operatingIncome ?? null}
                delta={delta(f.operatingIncome, p?.operatingIncome ?? null)}
              />
              {f.cash != null && (
                <FinRow
                  label="Cash"
                  cur={f.cash}
                  prev={p?.cash ?? null}
                  delta={delta(f.cash, p?.cash ?? null)}
                />
              )}
              {f.accountsReceivable != null && (
                <FinRow
                  label="Accounts receivable"
                  cur={f.accountsReceivable}
                  prev={p?.accountsReceivable ?? null}
                  delta={delta(f.accountsReceivable, p?.accountsReceivable ?? null)}
                />
              )}
              {f.accountsPayable != null && (
                <FinRow
                  label="Accounts payable"
                  cur={f.accountsPayable}
                  prev={p?.accountsPayable ?? null}
                  delta={delta(f.accountsPayable, p?.accountsPayable ?? null)}
                />
              )}
              {f.workingCapital != null && (
                <FinRow
                  label="Working capital"
                  cur={f.workingCapital}
                  prev={p?.workingCapital ?? null}
                  delta={delta(f.workingCapital, p?.workingCapital ?? null)}
                />
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <SnapshotRow label="Total orders" value={String(snapshot.operations.totalOrders)} />
            <SnapshotRow label="Completed" value={String(snapshot.operations.completedOrders)} />
            <SnapshotRow label="Cancelled" value={String(snapshot.operations.cancelledOrders)} />
            <SnapshotRow
              label="Awaiting supplier"
              value={String(snapshot.operations.awaitingSupplier)}
            />
            <SnapshotRow
              label="Open exceptions"
              value={String(snapshot.operations.exceptionsOpen)}
            />
            <SnapshotRow
              label="Order revenue"
              value={formatCurrency(snapshot.operations.grossOrderRevenue)}
            />
          </dl>
        </CardContent>
      </Card>

      {snapshot.topProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top products in period</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="divide-y">
              {snapshot.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 py-2 first:pt-0">
                  <span className="w-5 text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku ?? "—"} • {p.quantity} units
                    </p>
                  </div>
                  <div className="text-right text-sm font-medium tabular-nums">
                    {formatCurrency(p.revenue)}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {snapshot.marketing.sentCampaigns > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <SnapshotRow
                label="Campaigns sent"
                value={String(snapshot.marketing.sentCampaigns)}
              />
              <SnapshotRow
                label="Contacts reached"
                value={snapshot.marketing.totalSent.toLocaleString()}
              />
              <SnapshotRow label="Opens" value={snapshot.marketing.totalOpens.toLocaleString()} />
              <SnapshotRow
                label="Conversions"
                value={snapshot.marketing.totalConversions.toLocaleString()}
              />
              <SnapshotRow
                label="Attributed revenue"
                value={formatCurrency(snapshot.marketing.attributedRevenue)}
              />
            </dl>
          </CardContent>
        </Card>
      )}

      {snapshot.priorityTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Priority tasks at report time</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {snapshot.priorityTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                  <span className="font-medium">{t.title}</span>
                  <Badge variant={t.priority === "urgent" ? "destructive" : "warning"}>
                    {t.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Source</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-1 text-sm">
            <SnapshotRow
              label="Period"
              value={`${snapshot.period.name} (${formatDate(snapshot.period.startDate)} – ${formatDate(snapshot.period.endDate)})`}
            />
            <SnapshotRow
              label="Division"
              value={`${snapshot.division.name} (${snapshot.division.code})`}
            />
            <SnapshotRow label="Period status" value={snapshot.period.status} />
          </dl>
        </CardContent>
      </Card>
    </>
  );
}

function FinRow({
  label,
  cur,
  prev,
  delta,
}: {
  label: string;
  cur: number;
  prev: number | null;
  delta: string;
}) {
  return (
    <tr>
      <td className="py-2">{label}</td>
      <td className="py-2 text-right font-medium tabular-nums">{formatCurrency(cur)}</td>
      <td className="py-2 text-right tabular-nums text-muted-foreground">
        {prev != null ? formatCurrency(prev) : "—"}
      </td>
      <td className="py-2 text-right text-xs text-muted-foreground">{delta}</td>
    </tr>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
