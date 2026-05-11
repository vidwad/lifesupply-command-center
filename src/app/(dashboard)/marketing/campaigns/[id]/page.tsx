import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { getCampaign, isMailchimpSendEnabled } from "@/server/services/marketing/campaigns";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { ExportToMailchimpButton, RequestApprovalButton } from "./action-buttons";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "outline" | "warning" | "success" | "secondary" | "destructive"> = {
  draft: "outline",
  scheduled: "warning",
  sent: "success",
  paused: "secondary",
  cancelled: "outline",
};

const EXPORT_VARIANT: Record<string, "outline" | "warning" | "success" | "destructive"> = {
  not_queued: "outline",
  queued: "warning",
  sent: "success",
  failed: "destructive",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const c = await getCampaign(id);
  return { title: c ? `Campaign: ${c.name}` : "Campaign" };
}

export default async function CampaignDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.MARKETING_VIEW);
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const canDraft = userHasPermission(user, PERMISSIONS.MARKETING_DRAFT_CAMPAIGN);
  const canExport = userHasPermission(user, PERMISSIONS.MARKETING_SYNC_MAILCHIMP);
  const sendEnabled = await isMailchimpSendEnabled();

  // Pull the linked pending Approval row, if any.
  const pendingApproval = await prisma.approval.findFirst({
    where: {
      approvalType: "campaign",
      relatedEntityType: "Campaign",
      relatedEntityId: campaign.id,
      status: "pending",
    },
  });

  const audience = Array.isArray(campaign.audienceSnapshot)
    ? (campaign.audienceSnapshot as Array<{ id: string; email: string | null; name: string; score: number }>)
    : [];
  const audienceCount = audience.length;

  const canRequestApproval = canDraft && campaign.status === "draft" && !pendingApproval;
  const canExportNow =
    canExport &&
    sendEnabled &&
    campaign.status === "scheduled" &&
    (campaign.mailchimpExportStatus ?? "not_queued") === "not_queued";

  const exportDisabledReason = !canExport
    ? `Requires ${PERMISSIONS.MARKETING_SYNC_MAILCHIMP}.`
    : !sendEnabled
      ? "mailchimp.send feature flag is OFF."
      : campaign.status !== "scheduled"
        ? "Campaign must be approved (status: scheduled) before export."
        : campaign.mailchimpExportStatus !== "not_queued"
          ? `Already ${campaign.mailchimpExportStatus}.`
          : undefined;

  return (
    <div>
      <PageHeader
        title={campaign.name}
        description={campaign.subject ?? "No subject set."}
        breadcrumb={
          <Link href="/marketing/campaigns" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Campaigns
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[campaign.status] ?? "outline"}>{campaign.status}</Badge>
            <Badge
              variant={EXPORT_VARIANT[campaign.mailchimpExportStatus ?? "not_queued"] ?? "outline"}
            >
              mailchimp: {(campaign.mailchimpExportStatus ?? "not_queued").replace(/_/g, " ")}
            </Badge>
            {canDraft && (
              <RequestApprovalButton
                campaignId={campaign.id}
                disabled={!canRequestApproval}
                disabledReason={
                  pendingApproval
                    ? "An approval is already pending for this campaign."
                    : campaign.status !== "draft"
                      ? `Campaign is in "${campaign.status}" — only drafts can request approval.`
                      : undefined
                }
              />
            )}
            {canExport && (
              <ExportToMailchimpButton
                campaignId={campaign.id}
                disabled={!canExportNow}
                disabledReason={exportDisabledReason}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Body draft</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.bodyDraft ? (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {campaign.bodyDraft}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No body draft yet.</p>
              )}
            </CardContent>
          </Card>

          {campaign.aiOutput && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Model">{campaign.aiOutput.modelName}</Row>
                {campaign.aiOutput.warnings && campaign.aiOutput.warnings.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Warnings
                    </dt>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-warning">
                      {campaign.aiOutput.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {campaign.aiOutput.assumptions && campaign.aiOutput.assumptions.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Assumptions
                    </dt>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {campaign.aiOutput.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Audience">{campaign.audienceSummary ?? "—"}</Row>
                <Row label="Recipients">{audienceCount}</Row>
                <Row label="Approved by">
                  {campaign.approvedById ? (campaign.approvedAt ? formatDateTime(campaign.approvedAt) : "yes") : "—"}
                </Row>
                <Row label="Mailchimp ID">
                  {campaign.mailchimpExternalId ?? "—"}
                </Row>
                <Row label="Mailchimp queued at">
                  {campaign.mailchimpExportedAt ? formatDateTime(campaign.mailchimpExportedAt) : "—"}
                </Row>
                {campaign.mailchimpExportError && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Last export error
                    </dt>
                    <dd className="mt-1 rounded bg-destructive/10 p-2 text-xs text-destructive">
                      {campaign.mailchimpExportError}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {pendingApproval && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Badge variant="warning">pending</Badge>
                <p className="text-xs text-muted-foreground">
                  Decided in /approvals. Approval moves the campaign to <code>scheduled</code>;
                  rejection sends it back to <code>draft</code>.
                </p>
                <Link
                  href={`/approvals/${pendingApproval.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Open approval →
                </Link>
              </CardContent>
            </Card>
          )}

          {!sendEnabled && (
            <div className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs">
              <ShieldAlert className="mb-1 h-3 w-3" />
              <code>mailchimp.send</code> is OFF. The flag must be enabled in{" "}
              <Link href="/admin/feature-flags" className="underline">
                /admin/feature-flags
              </Link>{" "}
              before any export — even of an approved campaign.
            </div>
          )}

          {audience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audience snapshot (top 25)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="max-h-96 space-y-1 overflow-y-auto text-xs">
                  {audience.slice(0, 25).map((a) => (
                    <li key={a.id} className="flex items-baseline justify-between gap-2">
                      <span className="truncate">
                        {a.name}
                        {a.email && (
                          <span className="ml-1 text-muted-foreground">&lt;{a.email}&gt;</span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {a.score}
                      </span>
                    </li>
                  ))}
                  {audience.length > 25 && (
                    <li className="text-[10px] text-muted-foreground">
                      … {audience.length - 25} more
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}
