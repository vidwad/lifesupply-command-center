import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import {
  DEFAULT_B2B_SEQUENCE,
  DEFAULT_CONSUMER_SEQUENCE,
} from "@/server/services/marketing/campaign-streams";
import { previewStreams } from "@/server/services/marketing/program-builder";
import { requirePermission } from "@/server/permissions";

import { BuilderForm } from "./builder-form";

export const metadata = { title: "Campaign Builder" };
export const dynamic = "force-dynamic";

export default async function CampaignBuilderPage() {
  await requirePermission(PERMISSIONS.MARKETING_DRAFT_CAMPAIGN);
  const preview = await previewStreams();
  const excluded = Object.entries(preview.excludedByCode);

  return (
    <div>
      <PageHeader
        title="Campaign Builder"
        description="Build the LifeSupply Customer Reactivation & Replenishment program as a structured, approval-gated campaign record."
        breadcrumb={
          <Link
            href="/marketing/campaigns"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Campaigns
          </Link>
        }
        actions={
          excluded.length > 0 ? (
            <Badge variant="outline">
              {excluded.reduce((s, [, n]) => s + n, 0)} excluded by consent policy
            </Badge>
          ) : null
        }
      />

      <div className="max-w-3xl space-y-4 p-6">
        {excluded.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Excluded from audiences (casl-v1):{" "}
            {excluded.map(([code, n]) => `${code.replace(/_/g, " ")}: ${n}`).join(" · ")}
          </p>
        )}
        <BuilderForm
          streams={preview.streams}
          defaultConsumerSequence={DEFAULT_CONSUMER_SEQUENCE}
          defaultB2bSequence={DEFAULT_B2B_SEQUENCE}
        />
      </div>
    </div>
  );
}
