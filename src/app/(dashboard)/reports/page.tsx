import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate, formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listReports } from "@/server/services/reports";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, "success" | "secondary" | "warning" | "outline"> = {
  approved: "success",
  generated: "secondary",
  draft: "outline",
  under_review: "warning",
  archived: "outline",
};

const TYPE_LABEL: Record<string, string> = {
  monthly_management: "Monthly Management",
  daily_brief: "Daily Operating Brief",
  customer_reactivation: "Customer Reactivation",
  board: "Board Update",
  investor: "Investor Update",
  product_margin: "Product Margin",
  supplier_performance: "Supplier Performance",
  marketing_performance: "Marketing Performance",
};

export default async function ReportsPage() {
  const user = await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const reports = await listReports();
  const canGenerate = userHasPermission(user, PERMISSIONS.REPORTS_GENERATE);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generated management, financial, marketing, and investor reports."
        breadcrumb={`${reports.length} ${reports.length === 1 ? "report" : "reports"}`}
        actions={
          canGenerate && (
            <Link href="/reports/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Generate report
              </Button>
            </Link>
          )
        }
      />

      <div className="p-6">
        {reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Generate your first monthly management report from the seeded financial data."
            action={
              canGenerate ? (
                <Link href="/reports/new">
                  <Button size="sm">Generate report</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Title</TH>
                <TH>Type</TH>
                <TH>Period</TH>
                <TH>Status</TH>
                <TH>Prepared by</TH>
                <TH>Generated</TH>
              </tr>
            </THead>
            <TBody>
              {reports.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/reports/${r.id}`} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                    {r.summary && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {r.summary.split("\n")[0]}
                      </div>
                    )}
                  </TD>
                  <TD className="text-muted-foreground">
                    {TYPE_LABEL[r.reportType] ?? r.reportType}
                  </TD>
                  <TD className="text-muted-foreground">
                    {r.periodStart && r.periodEnd
                      ? `${formatDate(r.periodStart)} – ${formatDate(r.periodEnd)}`
                      : "—"}
                  </TD>
                  <TD>
                    <Badge variant={STATUS_BADGE[r.status] ?? "outline"}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </TD>
                  <TD className="text-muted-foreground">
                    {r.preparedBy?.name ?? r.preparedBy?.email ?? "—"}
                  </TD>
                  <TD className="text-muted-foreground">{formatDateTime(r.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
