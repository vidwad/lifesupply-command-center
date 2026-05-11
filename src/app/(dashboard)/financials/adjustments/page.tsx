import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { listAdjustments } from "@/server/services/finance/adjustments";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { approveAdjustmentAction } from "./actions";
import { AdjustmentCreateForm } from "./adjustment-create-form";
import { RejectAdjustmentForm } from "./reject-form";

export const metadata = { title: "Financial adjustments" };
export const dynamic = "force-dynamic";

type SearchParams = { period?: string; division?: string };

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive" | "outline"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  withdrawn: "outline",
  not_required: "outline",
};

export default async function AdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.FINANCIALS_VIEW_DETAIL);
  const params = await searchParams;
  const canManage = userHasPermission(user, PERMISSIONS.FINANCIALS_MANAGE_ADJUSTMENTS);
  const canApprove = userHasPermission(user, PERMISSIONS.FINANCIALS_APPROVE);

  const [rows, periods, divisions] = await Promise.all([
    listAdjustments({
      periodId: params.period || undefined,
      divisionId: params.division || undefined,
    }),
    prisma.financialPeriod.findMany({
      orderBy: { startDate: "desc" },
      take: 24,
      select: { id: true, name: true, status: true },
    }),
    prisma.division.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Financial adjustments"
        description="Management overlays on top of imported QuickBooks data. Each adjustment carries a description and approval state."
        breadcrumb={
          <Link href="/financials" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Financials
          </Link>
        }
        actions={
          canManage ? <AdjustmentCreateForm periods={periods} divisions={divisions} /> : null
        }
      />

      <div className="space-y-4 p-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No adjustments yet"
            description="Adjustments capture management overlays on top of QuickBooks figures — EBITDA addbacks, normalizations, and one-time items."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Period</TH>
                    <TH>Division</TH>
                    <TH>Category</TH>
                    <TH>Account</TH>
                    <TH align="right">Amount</TH>
                    <TH>Description</TH>
                    <TH>Status</TH>
                    <TH>Created</TH>
                    <TH>{" "}</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((r) => (
                    <TR key={r.id}>
                      <TD>
                        <div className="font-medium">{r.periodName}</div>
                        <div className="text-xs text-muted-foreground">{r.periodStatus}</div>
                      </TD>
                      <TD className="text-muted-foreground">
                        {r.divisionName ?? "Consolidated"}
                      </TD>
                      <TD className="text-xs uppercase tracking-wide text-muted-foreground">
                        {r.category.replace(/_/g, " ")}
                      </TD>
                      <TD className="font-mono text-xs text-muted-foreground">
                        {r.accountKey ?? "—"}
                      </TD>
                      <TD align="right" className="font-medium tabular-nums">
                        {formatCurrency(Number(r.amount), r.currency)}
                      </TD>
                      <TD className="max-w-xs">
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {r.description}
                        </div>
                      </TD>
                      <TD>
                        <Badge variant={STATUS_VARIANT[r.approvalStatus] ?? "outline"}>
                          {r.approvalStatus}
                        </Badge>
                        {r.approvedByLabel && r.approvedAt && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {r.approvedByLabel} · {formatDate(r.approvedAt)}
                          </div>
                        )}
                      </TD>
                      <TD className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt)}
                        {r.createdByLabel && (
                          <div className="text-[10px]">{r.createdByLabel}</div>
                        )}
                      </TD>
                      <TD>
                        {canApprove && r.approvalStatus === "pending" && (
                          <div className="flex flex-col gap-1">
                            <form action={approveAdjustmentAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <button
                                type="submit"
                                className="rounded bg-success px-2 py-1 text-xs font-medium text-success-foreground hover:opacity-90"
                              >
                                Approve
                              </button>
                            </form>
                            <RejectAdjustmentForm id={r.id} />
                          </div>
                        )}
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
