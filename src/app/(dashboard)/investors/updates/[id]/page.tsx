import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import {
  getInvestorUpdate,
  isInvestorDistributionEnabled,
} from "@/server/services/strategic/investor-updates";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { ReleaseButton, RequestApprovalButton } from "./action-buttons";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "outline" | "warning" | "success" | "secondary"> = {
  draft: "outline",
  under_review: "warning",
  approved: "secondary",
  released: "success",
  archived: "outline",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const u = await getInvestorUpdate(id);
  return { title: u ? u.title : "Investor update" };
}

export default async function InvestorUpdateDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.INVESTORS_VIEW);
  const { id } = await params;
  const update = await getInvestorUpdate(id);
  if (!update) notFound();

  const canDraft = userHasPermission(user, PERMISSIONS.INVESTORS_GENERATE_UPDATE);
  const canRelease = userHasPermission(user, PERMISSIONS.INVESTORS_APPROVE_MATERIALS);
  const distEnabled = await isInvestorDistributionEnabled();

  const distribution = Array.isArray(update.distributionSnapshot)
    ? (update.distributionSnapshot as Array<{ id: string; name: string; email: string | null; organization: string | null; status: string }>)
    : [];

  const pendingApproval = await prisma.approval.findFirst({
    where: {
      approvalType: "investor_material",
      relatedEntityType: "InvestorUpdate",
      relatedEntityId: update.id,
      status: "pending",
    },
  });

  const canRequestApproval = canDraft && update.status === "draft" && !pendingApproval;
  const canReleaseNow = canRelease && distEnabled && update.status === "approved";

  const releaseDisabledReason = !canRelease
    ? `Requires ${PERMISSIONS.INVESTORS_APPROVE_MATERIALS}.`
    : !distEnabled
      ? "investor.distribution feature flag is OFF."
      : update.status !== "approved"
        ? `Status must be approved (current: "${update.status}").`
        : undefined;

  return (
    <div>
      <PageHeader
        title={update.title}
        description={update.periodLabel ? `Period: ${update.periodLabel}` : "No period attached."}
        breadcrumb={
          <Link href="/investors/updates" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Investor updates
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[update.status] ?? "outline"}>
              {update.status.replace(/_/g, " ")}
            </Badge>
            {canDraft && (
              <RequestApprovalButton
                id={update.id}
                disabled={!canRequestApproval}
                disabledReason={
                  pendingApproval
                    ? "An approval is already pending."
                    : update.status !== "draft"
                      ? `Status is "${update.status}".`
                      : undefined
                }
              />
            )}
            {canRelease && (
              <ReleaseButton
                id={update.id}
                disabled={!canReleaseNow}
                disabledReason={releaseDisabledReason}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Body</CardTitle>
            </CardHeader>
            <CardContent>
              {update.bodyDraft ? (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {update.bodyDraft}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No body draft yet.</p>
              )}
            </CardContent>
          </Card>

          {update.aiOutput && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Model">{update.aiOutput.modelName}</Row>
                {update.aiOutput.warnings && update.aiOutput.warnings.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Warnings
                    </dt>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-warning">
                      {update.aiOutput.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
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
                <Row label="Period status">
                  {update.financialPeriod?.status ?? "—"}
                </Row>
                <Row label="Prepared by">
                  {update.preparedBy?.name ?? update.preparedBy?.email ?? "—"}
                </Row>
                <Row label="Approved by">
                  {update.approvedBy?.name ?? update.approvedBy?.email ?? "—"}
                </Row>
                <Row label="Approved at">
                  {update.approvedAt ? formatDateTime(update.approvedAt) : "—"}
                </Row>
                <Row label="Released at">
                  {update.releasedAt ? formatDateTime(update.releasedAt) : "—"}
                </Row>
                <Row label="Recipients">{distribution.length}</Row>
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
                <Link
                  href={`/approvals/${pendingApproval.id}`}
                  className="block text-xs text-primary hover:underline"
                >
                  Open approval →
                </Link>
              </CardContent>
            </Card>
          )}

          {!distEnabled && (
            <div className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs">
              <ShieldAlert className="mb-1 h-3 w-3" />
              <code>investor.distribution</code> is OFF. Enable in{" "}
              <Link href="/admin/feature-flags" className="underline">
                /admin/feature-flags
              </Link>{" "}
              before releasing — even after approval.
            </div>
          )}

          {distribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribution snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="max-h-96 space-y-1 overflow-y-auto text-xs">
                  {distribution.map((d) => (
                    <li key={d.id} className="flex items-baseline justify-between gap-2">
                      <span className="truncate">
                        {d.name}
                        {d.organization && (
                          <span className="ml-1 text-muted-foreground">
                            ({d.organization})
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{d.status}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {update.highlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Highlights extracted</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {update.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
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
