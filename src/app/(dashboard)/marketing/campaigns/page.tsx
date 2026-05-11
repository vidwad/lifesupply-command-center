import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listCampaignDrafts } from "@/server/services/marketing/campaigns";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Campaign drafts" };
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

export default async function CampaignDraftsPage() {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);
  const drafts = await listCampaignDrafts({ limit: 50 });

  return (
    <div>
      <PageHeader
        title="Campaign drafts"
        description="Approval-gated campaigns. Drafts move through draft → scheduled (after approval) → sent. Mailchimp export is feature-flag gated."
        breadcrumb={
          <Link href="/marketing" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Marketing
          </Link>
        }
      />
      <div className="space-y-4 p-6">
        {drafts.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaign drafts yet"
            description={
              <>
                Draft a reactivation campaign from{" "}
                <Link href="/marketing/reactivation" className="text-primary hover:underline">
                  /marketing/reactivation
                </Link>
                .
              </>
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Type</TH>
                    <TH>Audience</TH>
                    <TH>Status</TH>
                    <TH>Mailchimp</TH>
                    <TH>AI</TH>
                    <TH align="right">Updated</TH>
                  </tr>
                </THead>
                <TBody>
                  {drafts.map((c) => {
                    const audience = Array.isArray(c.audienceSnapshot)
                      ? c.audienceSnapshot.length
                      : null;
                    return (
                      <TR key={c.id}>
                        <TD>
                          <Link
                            href={`/marketing/campaigns/${c.id}`}
                            className="font-medium hover:underline"
                          >
                            {c.name}
                          </Link>
                          {c.subject && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {c.subject}
                            </div>
                          )}
                        </TD>
                        <TD className="text-xs uppercase tracking-wide text-muted-foreground">
                          {c.campaignType}
                        </TD>
                        <TD className="text-xs">
                          {c.audienceSummary ?? "—"}
                          {audience != null && (
                            <div className="text-[10px] text-muted-foreground">
                              {audience} recipients
                            </div>
                          )}
                        </TD>
                        <TD>
                          <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{c.status}</Badge>
                        </TD>
                        <TD>
                          <Badge
                            variant={EXPORT_VARIANT[c.mailchimpExportStatus ?? "not_queued"] ?? "outline"}
                          >
                            {(c.mailchimpExportStatus ?? "not_queued").replace(/_/g, " ")}
                          </Badge>
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {c.aiOutput?.modelName ?? "—"}
                        </TD>
                        <TD align="right" className="text-xs text-muted-foreground">
                          {formatDateTime(c.updatedAt)}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
