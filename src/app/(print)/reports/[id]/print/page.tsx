import { notFound } from "next/navigation";

import { formatCurrency, formatDate, formatDateTime, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getReportById, type ReportSnapshot } from "@/server/services/reports";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const report = await getReportById(id);
  return { title: report ? `${report.title} — Print` : "Print report" };
}

export default async function PrintReportPage({ params }: Props) {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) notFound();

  const snapshot = report.metadata as unknown as ReportSnapshot | null;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-sm leading-relaxed text-foreground print:max-w-none print:p-6">
      <header className="mb-6 border-b pb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          LifeSupply Command Center
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{report.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Generated {formatDateTime(report.createdAt)} by{" "}
          {report.preparedBy?.name ?? report.preparedBy?.email ?? "system"} • Status:{" "}
          {report.status.replace("_", " ")}
        </p>
      </header>

      {report.summary && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Executive Summary
          </h2>
          <p className="whitespace-pre-wrap">{report.summary}</p>
        </section>
      )}

      {snapshot && <PrintBody snapshot={snapshot} />}

      <footer className="mt-10 border-t pt-3 text-xs text-muted-foreground">
        Source of truth for accounting figures: QuickBooks. This report is the management view,
        generated from the LifeSupply Command Center.
      </footer>
    </div>
  );
}

function PrintBody({ snapshot }: { snapshot: ReportSnapshot }) {
  const f = snapshot.financial;
  const p = snapshot.prevFinancial;

  return (
    <>
      <Section title={`Financials — ${snapshot.division.name}`}>
        <table className="w-full">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-1">Metric</th>
              <th className="py-1 text-right">{snapshot.period.name}</th>
              <th className="py-1 text-right">{snapshot.prevPeriod?.name ?? "Prior"}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <PrintFinRow label="Revenue" cur={f.revenue} prev={p?.revenue ?? null} />
            <PrintFinRow label="COGS" cur={f.cogs} prev={p?.cogs ?? null} />
            <PrintFinRow label="Gross profit" cur={f.grossProfit} prev={p?.grossProfit ?? null} />
            <tr>
              <td className="py-1">Gross margin</td>
              <td className="py-1 text-right tabular-nums">
                {f.grossMargin != null ? formatPercent(f.grossMargin, 1) : "—"}
              </td>
              <td className="py-1 text-right tabular-nums">
                {p?.grossMargin != null ? formatPercent(p.grossMargin, 1) : "—"}
              </td>
            </tr>
            <PrintFinRow
              label="Operating expenses"
              cur={f.operatingExpenses}
              prev={p?.operatingExpenses ?? null}
            />
            <PrintFinRow
              label="Operating income"
              cur={f.operatingIncome}
              prev={p?.operatingIncome ?? null}
            />
            {f.cash != null && <PrintFinRow label="Cash" cur={f.cash} prev={p?.cash ?? null} />}
            {f.workingCapital != null && (
              <PrintFinRow
                label="Working capital"
                cur={f.workingCapital}
                prev={p?.workingCapital ?? null}
              />
            )}
          </tbody>
        </table>
      </Section>

      <Section title="Operations">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
          <li>
            Total orders: <strong>{snapshot.operations.totalOrders}</strong>
          </li>
          <li>
            Completed: <strong>{snapshot.operations.completedOrders}</strong>
          </li>
          <li>
            Cancelled: <strong>{snapshot.operations.cancelledOrders}</strong>
          </li>
          <li>
            Awaiting supplier: <strong>{snapshot.operations.awaitingSupplier}</strong>
          </li>
          <li>
            Open exceptions: <strong>{snapshot.operations.exceptionsOpen}</strong>
          </li>
          <li>
            Order revenue: <strong>{formatCurrency(snapshot.operations.grossOrderRevenue)}</strong>
          </li>
        </ul>
      </Section>

      {snapshot.topProducts.length > 0 && (
        <Section title="Top products">
          <ol className="ml-5 list-decimal space-y-1">
            {snapshot.topProducts.map((tp) => (
              <li key={tp.id}>
                <strong>{tp.name}</strong> — {formatCurrency(tp.revenue)} ({tp.quantity} units)
              </li>
            ))}
          </ol>
        </Section>
      )}

      {snapshot.marketing.sentCampaigns > 0 && (
        <Section title="Marketing">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
            <li>
              Campaigns sent: <strong>{snapshot.marketing.sentCampaigns}</strong>
            </li>
            <li>
              Contacts reached: <strong>{snapshot.marketing.totalSent.toLocaleString()}</strong>
            </li>
            <li>
              Opens: <strong>{snapshot.marketing.totalOpens.toLocaleString()}</strong>
            </li>
            <li>
              Conversions: <strong>{snapshot.marketing.totalConversions.toLocaleString()}</strong>
            </li>
            <li>
              Attributed revenue:{" "}
              <strong>{formatCurrency(snapshot.marketing.attributedRevenue)}</strong>
            </li>
          </ul>
        </Section>
      )}

      {snapshot.priorityTasks.length > 0 && (
        <Section title="Priority tasks at report time">
          <ul className="ml-5 list-disc space-y-1">
            {snapshot.priorityTasks.map((t) => (
              <li key={t.id}>
                [{t.priority}] {t.title}{" "}
                <span className="text-muted-foreground">({t.status.replace("_", " ")})</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Source">
        <p>
          Period: <strong>{snapshot.period.name}</strong> ({formatDate(snapshot.period.startDate)} –{" "}
          {formatDate(snapshot.period.endDate)}, status: {snapshot.period.status})
        </p>
        <p>
          Division: <strong>{snapshot.division.name}</strong> ({snapshot.division.code})
        </p>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PrintFinRow({ label, cur, prev }: { label: string; cur: number; prev: number | null }) {
  return (
    <tr>
      <td className="py-1">{label}</td>
      <td className="py-1 text-right font-medium tabular-nums">{formatCurrency(cur)}</td>
      <td className="py-1 text-right tabular-nums">{prev != null ? formatCurrency(prev) : "—"}</td>
    </tr>
  );
}
