import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ExternalLink, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getOpportunityById } from "@/server/services/opportunities";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<
  string,
  "outline" | "secondary" | "warning" | "success" | "destructive"
> = {
  identified: "outline",
  evaluating: "warning",
  committed: "secondary",
  in_progress: "secondary",
  completed: "success",
  declined: "destructive",
  on_hold: "outline",
};

const PRIORITY_BADGE: Record<string, "outline" | "secondary" | "warning" | "destructive"> = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const RISK_TONE: Record<string, string> = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-success",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const opportunity = await getOpportunityById(id);
  return { title: opportunity ? opportunity.title : "Opportunity" };
}

export default async function OpportunityDetailPage({ params }: Props) {
  await requirePermission(PERMISSIONS.OPPORTUNITIES_VIEW);
  const { id } = await params;
  const opportunity = await getOpportunityById(id);
  if (!opportunity) notFound();

  return (
    <div>
      <PageHeader
        title={opportunity.title}
        description={opportunity.opportunityType.replace("_", " ")}
        breadcrumb={
          <Link href="/opportunities" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Opportunities
          </Link>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={STATUS_BADGE[opportunity.status] ?? "outline"}>
              {opportunity.status.replace("_", " ")}
            </Badge>
            {opportunity.priority && (
              <Badge variant={PRIORITY_BADGE[opportunity.priority] ?? "outline"}>
                {opportunity.priority} priority
              </Badge>
            )}
            {opportunity.riskRating && (
              <Badge variant="outline" className={RISK_TONE[opportunity.riskRating]}>
                {opportunity.riskRating} risk
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {opportunity.strategicRationale && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Strategic rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {opportunity.strategicRationale}
                </p>
              </CardContent>
            </Card>
          )}

          {opportunity.acquisitionTarget && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" /> Acquisition target
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold">
                    {opportunity.acquisitionTarget.companyName}
                  </h3>
                  {opportunity.acquisitionTarget.website && (
                    <a
                      href={opportunity.acquisitionTarget.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Row label="Geography" value={opportunity.acquisitionTarget.geography ?? "—"} />
                  <Row
                    label="Revenue est."
                    value={
                      opportunity.acquisitionTarget.revenueEstimate != null
                        ? formatCurrency(opportunity.acquisitionTarget.revenueEstimate)
                        : "—"
                    }
                  />
                  <Row
                    label="EBITDA est."
                    value={
                      opportunity.acquisitionTarget.ebitdaEstimate != null
                        ? formatCurrency(opportunity.acquisitionTarget.ebitdaEstimate)
                        : "—"
                    }
                  />
                  <Row
                    label="Integration"
                    value={opportunity.acquisitionTarget.integrationComplexity ?? "—"}
                  />
                  <Row
                    label="Diligence"
                    value={opportunity.acquisitionTarget.diligenceStatus?.replace("_", " ") ?? "—"}
                  />
                </dl>
                {opportunity.acquisitionTarget.strategicFit && (
                  <p className="text-sm">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Strategic fit:{" "}
                    </span>
                    {opportunity.acquisitionTarget.strategicFit}
                  </p>
                )}
                {opportunity.acquisitionTarget.valuationNotes && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Valuation notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {opportunity.acquisitionTarget.valuationNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" /> Impact estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row
                  label="Revenue impact"
                  value={
                    opportunity.estimatedRevenueImpact != null
                      ? formatCurrency(opportunity.estimatedRevenueImpact)
                      : "—"
                  }
                  emphasis
                />
                <Row
                  label="Margin uplift"
                  value={
                    opportunity.estimatedMarginImpact != null
                      ? `+${formatPercent(opportunity.estimatedMarginImpact, 1)}`
                      : "—"
                  }
                />
                <Row
                  label="Cost / investment"
                  value={
                    opportunity.estimatedCost != null
                      ? formatCurrency(opportunity.estimatedCost)
                      : "—"
                  }
                />
                <Row label="Risk" value={opportunity.riskRating ?? "—"} />
                <Row label="Priority" value={opportunity.priority ?? "—"} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ownership & timing</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row
                  label="Owner"
                  value={opportunity.owner?.name ?? opportunity.owner?.email ?? "Unassigned"}
                />
                <Row
                  label="Due date"
                  value={opportunity.dueDate ? formatDate(opportunity.dueDate) : "—"}
                />
                <Row label="Created" value={formatDate(opportunity.createdAt)} />
              </dl>
              {opportunity.nextAction && (
                <div className="mt-4 rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next action
                  </p>
                  <p className="mt-1 text-sm">{opportunity.nextAction}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-2", emphasis && "")}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={emphasis ? "text-base font-semibold tabular-nums" : "font-medium tabular-nums"}
      >
        {value}
      </dd>
    </div>
  );
}
