/**
 * DP-4 recommendation detail.
 *
 * Shows the proposal, the arithmetic behind it, and the observations it rests
 * on, so a reviewer can judge the number rather than trust it. There is no
 * approve or reject control: approval is DP-5 and does not exist yet.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { getRecommendation } from "@/server/services/pricing/recommendations";

export const metadata = { title: "Price recommendation" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const money = (value: unknown): string => (value == null ? "—" : `$${Number(value).toFixed(2)}`);
const percent = (value: unknown): string =>
  value == null ? "—" : `${(Number(value) * 100).toFixed(1)}%`;
const when = (value: Date | null): string => (value == null ? "—" : value.toISOString());

function Figure({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );
}

export default async function RecommendationDetailPage({
  params,
}: Props): Promise<React.JSX.Element> {
  await requirePermission(PERMISSIONS.PRICING_VIEW);
  const { id } = await params;
  const recommendation = await getRecommendation(id);
  if (!recommendation) notFound();

  const item = recommendation.pricingRunItem;

  return (
    <div>
      <PageHeader
        title={`${item.sku} — ${recommendation.recommendationType.replaceAll("_", " ")}`}
        description="A proposal awaiting human review. No recommendation has been approved. No price has been changed. Approval and writeback are later phases."
        breadcrumb={
          <Link
            href="/products/pricing/recommendations"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Recommendations
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proposal</CardTitle>
            <CardDescription>
              {item.productName ?? "Unnamed product"} — {item.store.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Figure label="Current regular" value={money(recommendation.oldRegularPrice)} />
            <Figure label="Current sale" value={money(recommendation.oldSalePrice)} />
            <Figure label="Current effective" value={money(item.currentEffectivePrice)} />
            <Figure label="Cost" value={money(recommendation.costPrice)} />
            <Figure label="Floor" value={money(recommendation.floorPrice)} />
            <Figure label="Lowest competitor" value={money(recommendation.lowestCompetitorPrice)} />
            <Figure label="Undercut by" value={money(recommendation.undercutAmount)} />
            <Figure label="Recommended" value={money(recommendation.recommendedSalePrice)} />
            <Figure label="Margin before" value={percent(recommendation.marginBefore)} />
            <Figure label="Margin after" value={percent(recommendation.marginAfter)} />
            <Figure label="Confidence" value={percent(item.confidence)} />
            <Figure label="Evidence expires" value={when(recommendation.expiresAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Approval is a later phase; nothing here is actionable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{recommendation.status.replaceAll("_", " ")}</Badge>
              <Badge variant={recommendation.requiresApproval ? "default" : "destructive"}>
                {recommendation.requiresApproval ? "requires approval" : "NO APPROVAL REQUIRED"}
              </Badge>
              <Badge variant="secondary">
                run {item.pricingRun.sourceType.replaceAll("_", " ")} — {item.pricingRun.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Reason</p>
              <p className="whitespace-pre-wrap text-sm">{recommendation.reason ?? "—"}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Created {when(recommendation.createdAt)}.{" "}
              <Link
                href={`/products/pricing/runs/${item.pricingRun.id}`}
                className="hover:underline"
              >
                Open the pricing run
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
          <CardDescription>
            Observations recorded for this item. Only observations with status <code>valid</code>, a
            numeric price, fresh evidence, and sufficient confidence influence the proposal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {item.observations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No observations recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Competitor</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Effective</th>
                    <th className="py-2 pr-3">Currency</th>
                    <th className="py-2 pr-3 text-right">Confidence</th>
                    <th className="py-2 pr-3">Checked</th>
                    <th className="py-2 pr-3">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {item.observations.map((observation) => (
                    <tr key={observation.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{observation.competitor.name}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={observation.status === "valid" ? "default" : "outline"}>
                          {observation.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {money(observation.observedEffectivePrice)}
                      </td>
                      <td className="py-2 pr-3">{observation.currency ?? "—"}</td>
                      <td className="py-2 pr-3 text-right">
                        {percent(observation.matchConfidence)}
                      </td>
                      <td className="py-2 pr-3 text-xs">{when(observation.checkedAt)}</td>
                      <td className="max-w-[20rem] truncate py-2 pr-3 text-xs">
                        {observation.competitorUrl}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
