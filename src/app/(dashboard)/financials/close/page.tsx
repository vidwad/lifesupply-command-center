import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";
import type { MonthlyCloseStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import {
  closeChecklistSummary,
  listCloseTasks,
} from "@/server/services/finance/close-tasks";
import { requirePermission } from "@/server/permissions";

import { seedChecklistAction } from "./actions";
import { CloseTaskStatusForm } from "./status-form";

export const metadata = { title: "Monthly close" };
export const dynamic = "force-dynamic";

type SearchParams = { period?: string };

const STATUS_VARIANT: Record<MonthlyCloseStatus, "warning" | "success" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  in_progress: "warning",
  blocked: "destructive",
  done: "success",
  skipped: "secondary",
};

export default async function ClosePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.FINANCIALS_REVIEW);
  const params = await searchParams;

  const periods = await prisma.financialPeriod.findMany({
    where: { periodType: "month" },
    orderBy: { startDate: "desc" },
    take: 12,
    select: { id: true, name: true, status: true },
  });

  const selectedPeriod =
    periods.find((p) => p.id === params.period) ??
    periods.find((p) => p.status === "open") ??
    periods[0] ??
    null;

  const tasks = selectedPeriod
    ? await listCloseTasks({ financialPeriodId: selectedPeriod.id })
    : [];
  const summary = selectedPeriod
    ? await closeChecklistSummary(selectedPeriod.id)
    : { total: 0, done: 0, blocked: 0, remaining: 0 };

  return (
    <div>
      <PageHeader
        title="Monthly close"
        description="Standard checklist for closing a financial period. Run the checklist before approving the period."
        breadcrumb={
          <Link href="/financials" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Financials
          </Link>
        }
        actions={
          <form action="/financials/close">
            <select
              name="period"
              defaultValue={selectedPeriod?.id ?? ""}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              onChange={(e) => {
                const form = (e.target as HTMLSelectElement).form;
                if (form) form.submit();
              }}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.status}
                </option>
              ))}
            </select>
            <noscript>
              <button type="submit">Go</button>
            </noscript>
          </form>
        }
      />

      <div className="space-y-4 p-6">
        {selectedPeriod && summary.total > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Tasks" value={summary.total} />
            <SummaryStat label="Done" value={summary.done} tone="success" />
            <SummaryStat label="Blocked" value={summary.blocked} tone="destructive" />
            <SummaryStat label="Remaining" value={summary.remaining} tone="warning" />
          </div>
        )}

        {!selectedPeriod ? (
          <EmptyState
            icon={CheckSquare}
            title="No financial periods available"
            description="Seed sample periods or import QuickBooks data first."
          />
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm">
                No checklist exists for <strong>{selectedPeriod.name}</strong>. Seed the standard
                checklist (12 tasks) to start the close.
              </p>
              <form action={seedChecklistAction}>
                <input type="hidden" name="periodId" value={selectedPeriod.id} />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Seed standard checklist
                </button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Task</TH>
                    <TH>Status</TH>
                    <TH>Owner</TH>
                    <TH>Completed</TH>
                    <TH>Notes</TH>
                    <TH>Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {tasks.map((t) => (
                    <TR key={t.id}>
                      <TD>
                        <div className="font-medium">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        )}
                        <code className="mt-0.5 block text-[10px] text-muted-foreground">
                          {t.taskKey}
                        </code>
                      </TD>
                      <TD>
                        <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
                      </TD>
                      <TD className="text-xs text-muted-foreground">{t.ownerLabel ?? "—"}</TD>
                      <TD className="text-xs text-muted-foreground">
                        {t.completedAt ? formatDate(t.completedAt) : "—"}
                        {t.completedByLabel && (
                          <div className="text-[10px]">{t.completedByLabel}</div>
                        )}
                      </TD>
                      <TD className="text-xs text-muted-foreground">{t.notes ?? "—"}</TD>
                      <TD>
                        <CloseTaskStatusForm id={t.id} currentStatus={t.status} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "";
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
