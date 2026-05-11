import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileSearch } from "lucide-react";
import type { DiligenceCategory, DiligenceStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import {
  diligenceSummary,
  listDiligenceItems,
} from "@/server/services/strategic/diligence";
import { requirePermission } from "@/server/permissions";

import { seedChecklistAction } from "./actions";
import { DiligenceStatusForm } from "./status-form";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<DiligenceStatus, "outline" | "warning" | "success" | "secondary" | "destructive"> = {
  pending: "outline",
  in_progress: "warning",
  blocked: "destructive",
  done: "success",
  not_applicable: "secondary",
};

const CATEGORY_LABEL: Record<DiligenceCategory, string> = {
  financial: "Financial",
  legal: "Legal",
  operational: "Operational",
  commercial: "Commercial",
  technology: "Technology",
  hr: "HR",
  regulatory: "Regulatory",
  other: "Other",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: opportunity ? `Diligence — ${opportunity.title}` : "Diligence" };
}

export default async function OpportunityDiligencePage({ params }: Props) {
  await requirePermission(PERMISSIONS.OPPORTUNITIES_VIEW);
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    select: { id: true, title: true, opportunityType: true, status: true },
  });
  if (!opportunity) notFound();

  const [items, summary] = await Promise.all([
    listDiligenceItems({ opportunityId: id }),
    diligenceSummary(id),
  ]);

  // Group by category for the rendered list.
  const grouped = new Map<DiligenceCategory, typeof items>();
  for (const item of items) {
    const cat = item.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return (
    <div>
      <PageHeader
        title={`Diligence — ${opportunity.title}`}
        description={`${opportunity.opportunityType.replace(/_/g, " ")} · status: ${opportunity.status}`}
        breadcrumb={
          <Link href={`/opportunities/${id}`} className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Opportunity
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        {summary.total > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Items" value={summary.total} />
            <SummaryStat label="Done / N/A" value={summary.done} tone="success" />
            <SummaryStat label="Blocked" value={summary.blocked} tone="destructive" />
            <SummaryStat label="Remaining" value={summary.remaining} tone="warning" />
          </div>
        )}

        {items.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  No diligence checklist exists for this opportunity. Seed the standard list (17
                  items across financial / legal / operational / commercial / regulatory / HR).
                </p>
              </div>
              <form action={seedChecklistAction}>
                <input type="hidden" name="opportunityId" value={id} />
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
          <div className="space-y-6">
            {[...grouped.entries()].map(([category, rows]) => (
              <Card key={category}>
                <CardContent className="p-0">
                  <div className="border-b bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {CATEGORY_LABEL[category]} ({rows.length})
                  </div>
                  <DataTable className="border-0">
                    <THead>
                      <tr>
                        <TH>Item</TH>
                        <TH>Status</TH>
                        <TH>Owner</TH>
                        <TH>Completed</TH>
                        <TH>Notes</TH>
                        <TH>Actions</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {rows.map((item) => (
                        <TR key={item.id}>
                          <TD>
                            <div className="font-medium">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            )}
                            <code className="mt-0.5 block text-[10px] text-muted-foreground">
                              {item.itemKey}
                            </code>
                          </TD>
                          <TD>
                            <Badge variant={STATUS_VARIANT[item.status]}>
                              {item.status.replace(/_/g, " ")}
                            </Badge>
                          </TD>
                          <TD className="text-xs text-muted-foreground">
                            {item.owner?.name ?? item.owner?.email ?? "—"}
                          </TD>
                          <TD className="text-xs text-muted-foreground">
                            {item.completedAt ? formatDate(item.completedAt) : "—"}
                            {item.completedBy && (
                              <div className="text-[10px]">
                                {item.completedBy.name ?? item.completedBy.email}
                              </div>
                            )}
                          </TD>
                          <TD className="text-xs text-muted-foreground">{item.notes ?? "—"}</TD>
                          <TD>
                            <DiligenceStatusForm
                              id={item.id}
                              opportunityId={id}
                              currentStatus={item.status}
                            />
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </DataTable>
                </CardContent>
              </Card>
            ))}
          </div>
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
