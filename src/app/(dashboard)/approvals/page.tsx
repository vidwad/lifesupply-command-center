import Link from "next/link";
import { CheckCircle2, ShieldCheck, ThumbsDown } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  APPROVAL_TYPE_LABEL,
  canUserApprove,
  getApprovalCounts,
  listApprovals,
  type ApprovalView,
} from "@/server/services/approvals";
import { requireUser } from "@/server/permissions";

export const metadata = { title: "Approvals" };
export const dynamic = "force-dynamic";

const VALID_VIEWS: ApprovalView[] = [
  "pending",
  "my_requests",
  "approved",
  "rejected",
  "withdrawn",
  "all",
];

const STATUS_BADGE: Record<
  string,
  "secondary" | "warning" | "success" | "destructive" | "outline"
> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  withdrawn: "outline",
  not_required: "outline",
};

type SearchParams = { view?: string };

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const view = (VALID_VIEWS as string[]).includes(params.view ?? "")
    ? (params.view as ApprovalView)
    : "pending";

  const [approvals, counts] = await Promise.all([
    listApprovals({ view, currentUserId: user.id }),
    getApprovalCounts(user.id),
  ]);

  const tabs: { key: ApprovalView; label: string; count?: number }[] = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "my_requests", label: "My requests", count: counts.mine },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "withdrawn", label: "Withdrawn" },
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Review pending approvals for campaigns, financial summaries, supplier orders, reports, and external updates."
        breadcrumb={`${approvals.length} ${approvals.length === 1 ? "item" : "items"} • ${tabs.find((t) => t.key === view)?.label.toLowerCase()}`}
      />

      <div className="space-y-4 p-6">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const isActive = view === t.key;
            const next = new URLSearchParams();
            if (t.key !== "pending") next.set("view", t.key);
            const href = `/approvals${next.toString() ? `?${next}` : ""}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] tabular-nums",
                      isActive ? "bg-primary-foreground/20" : "bg-muted",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {approvals.length === 0 ? (
          <EmptyState
            icon={
              view === "rejected" ? ThumbsDown : view === "approved" ? CheckCircle2 : ShieldCheck
            }
            title={
              view === "pending"
                ? "No pending approvals"
                : view === "my_requests"
                  ? "You haven't submitted any approval requests"
                  : "No approvals match this filter"
            }
            description={
              view === "pending"
                ? "All clear — every approval has been decided."
                : "Adjust the tab to see more approvals."
            }
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Request</TH>
                <TH>Related</TH>
                <TH>Requested by</TH>
                <TH>Requested</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </THead>
            <TBody>
              {approvals.map((a) => {
                const userCan = canUserApprove(user, a.approvalType);
                return (
                  <TR key={a.id}>
                    <TD className="text-muted-foreground">
                      {APPROVAL_TYPE_LABEL[a.approvalType] ?? a.approvalType}
                    </TD>
                    <TD>
                      <Link href={`/approvals/${a.id}`} className="font-medium hover:underline">
                        {a.requestSummary ?? "(no summary)"}
                      </Link>
                    </TD>
                    <TD className="text-muted-foreground">
                      {a.relatedEntityHref && a.relatedEntityLabel ? (
                        <Link href={a.relatedEntityHref} className="hover:underline">
                          {a.relatedEntityLabel}
                        </Link>
                      ) : (
                        (a.relatedEntityLabel ?? "—")
                      )}
                    </TD>
                    <TD className="text-xs text-muted-foreground">
                      {a.requestedBy?.name ?? a.requestedBy?.email ?? "—"}
                    </TD>
                    <TD className="text-xs text-muted-foreground">{formatDate(a.requestedAt)}</TD>
                    <TD>
                      <Badge variant={STATUS_BADGE[a.status] ?? "outline"}>{a.status}</Badge>
                      {a.decidedAt && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {a.approver?.name ?? a.approver?.email ?? "—"} •{" "}
                          {formatDateTime(a.decidedAt)}
                        </div>
                      )}
                    </TD>
                    <TD>
                      {a.status === "pending" && (
                        <Link
                          href={`/approvals/${a.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {userCan ? "Review" : "View"}
                        </Link>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
