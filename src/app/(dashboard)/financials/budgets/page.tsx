import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { listBudgets } from "@/server/services/finance/budgets";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { BudgetImportForm } from "./budget-import-form";

export const metadata = { title: "Budgets" };
export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const user = await requirePermission(PERMISSIONS.FINANCIALS_VIEW_DETAIL);
  const canManage = userHasPermission(user, PERMISSIONS.FINANCIALS_MANAGE_ADJUSTMENTS);

  const [budgets, divisions] = await Promise.all([
    listBudgets(),
    prisma.division.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Per-period operating plans used for variance reporting on the financials dashboard."
        breadcrumb={
          <Link href="/financials" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Financials
          </Link>
        }
      />
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {budgets.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="No budgets yet"
              description="Upload a budget CSV to enable budget vs actual comparisons."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Name</TH>
                      <TH>Year</TH>
                      <TH>Division</TH>
                      <TH align="right">Lines</TH>
                      <TH>Active</TH>
                      <TH>Created</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {budgets.map((b) => (
                      <TR key={b.id}>
                        <TD className="font-medium">{b.name}</TD>
                        <TD>{b.year}</TD>
                        <TD className="text-muted-foreground">
                          {b.divisionName ?? "Consolidated"}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {b.lineCount}
                        </TD>
                        <TD>
                          {b.isActive ? (
                            <Badge variant="success">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {formatDate(b.createdAt)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {canManage ? (
            <BudgetImportForm divisions={divisions} />
          ) : (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              You can view budgets but not import them. Requires{" "}
              <code className="rounded bg-muted px-1">{PERMISSIONS.FINANCIALS_MANAGE_ADJUSTMENTS}</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
