import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { APPROVAL_TYPE_LABEL, canUserApprove, getApprovalById } from "@/server/services/approvals";
import { requireUser } from "@/server/permissions";

import { ApprovalDecisionForms } from "./approval-decision-forms";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<
  string,
  "secondary" | "warning" | "success" | "destructive" | "outline"
> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  withdrawn: "outline",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const approval = await getApprovalById(id);
  return {
    title: approval
      ? `Approval — ${APPROVAL_TYPE_LABEL[approval.approvalType] ?? approval.approvalType}`
      : "Approval",
  };
}

export default async function ApprovalDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const approval = await getApprovalById(id);
  if (!approval) notFound();

  const userCanDecide = canUserApprove(user, approval.approvalType);
  const isRequester = approval.requestedById === user.id;
  const isPending = approval.status === "pending";

  return (
    <div>
      <PageHeader
        title={APPROVAL_TYPE_LABEL[approval.approvalType] ?? approval.approvalType}
        description={
          approval.requestSummary ??
          `Approval request from ${approval.requestedBy?.name ?? approval.requestedBy?.email ?? "unknown"}`
        }
        breadcrumb={
          <Link href="/approvals" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Approvals
          </Link>
        }
        actions={
          <Badge variant={STATUS_BADGE[approval.status] ?? "outline"}>{approval.status}</Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap leading-relaxed">
                {approval.requestSummary ?? "(no summary provided)"}
              </p>
              {approval.relatedEntityLabel && (
                <p className="text-xs text-muted-foreground">
                  Related:{" "}
                  {approval.relatedEntityHref ? (
                    <Link
                      href={approval.relatedEntityHref}
                      className="text-primary hover:underline"
                    >
                      {approval.relatedEntityLabel}
                    </Link>
                  ) : (
                    approval.relatedEntityLabel
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          {!isPending && approval.decisionNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Decision notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {approval.decisionNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {isPending && userCanDecide && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Decide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalDecisionForms approvalId={approval.id} />
              </CardContent>
            </Card>
          )}

          {isPending && !userCanDecide && !isRequester && (
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="py-4 text-sm text-muted-foreground">
                You don&apos;t have permission to approve a{" "}
                <span className="font-medium text-foreground">
                  {APPROVAL_TYPE_LABEL[approval.approvalType] ?? approval.approvalType}
                </span>{" "}
                request. Visible here for awareness only.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row
                  label="Type"
                  value={APPROVAL_TYPE_LABEL[approval.approvalType] ?? approval.approvalType}
                />
                <Row label="Status" value={approval.status} />
                <Row
                  label="Requested by"
                  value={approval.requestedBy?.name ?? approval.requestedBy?.email ?? "—"}
                />
                <Row label="Requested at" value={formatDateTime(approval.requestedAt)} />
                {approval.decidedAt && (
                  <>
                    <Row
                      label="Decided by"
                      value={approval.approver?.name ?? approval.approver?.email ?? "—"}
                    />
                    <Row label="Decided at" value={formatDateTime(approval.decidedAt)} />
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          {isRequester && isPending && (
            <Card>
              <CardContent className="py-4">
                <WithdrawForm approvalId={approval.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

import { WithdrawForm } from "./approval-decision-forms";
