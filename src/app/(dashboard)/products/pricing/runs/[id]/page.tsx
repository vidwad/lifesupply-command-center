import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { getPricingRun } from "@/server/services/pricing/runs";

import { GenerateRecommendationsForm } from "../../recommendations/generate-form";
import { CompetitorCheckForm } from "../competitor-check-form";

export const metadata = { title: "Pricing run" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const money = (value: unknown): string => (value == null ? "—" : `$${Number(value).toFixed(2)}`);

export default async function PricingRunPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.PRICING_VIEW);
  const canExport = userHasPermission(user, PERMISSIONS.PRICING_EXPORT);
  const canRunChecks = userHasPermission(user, PERMISSIONS.PRICING_RUN_CHECKS);
  const canReview = userHasPermission(user, PERMISSIONS.PRICING_REVIEW_RECOMMENDATIONS);
  const { id } = await params;
  const run = await getPricingRun(id);
  if (!run) notFound();

  const observations = run.items.flatMap((item) => item.observations);
  const lastCheckedAt = run.items
    .map((item) => item.lastCheckedAt)
    .filter((value): value is Date => value != null)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const counts = {
    total: run._count.items,
    pending: run.items.filter((item) => item.status === "pending").length,
    checked: run.items.filter((item) => item.status === "checked").length,
    blocked: run.items.filter((item) => item.status === "blocked").length,
    missingCost: run.items.filter((item) => item.blockedReason === "missing_cost").length,
    observations: observations.length,
    valid: observations.filter((o) => o.status === "valid").length,
    lowOrFailed: observations.filter((o) =>
      ["low_confidence", "failed", "invalid", "unavailable"].includes(o.status),
    ).length,
    // Eligible = checked, unblocked, priced, and carrying at least one valid
    // observation. It is the ceiling on what a generation pass could produce,
    // not a promise: freshness and confidence are applied by the engine.
    eligible: run.items.filter(
      (item) =>
        item.status !== "blocked" &&
        item.blockedReason == null &&
        item.costPrice != null &&
        item.floorPrice != null &&
        item.currentEffectivePrice != null &&
        item.observations.some((o) => o.status === "valid"),
    ).length,
    recommendationReady: run.items.filter((item) => item.status === "recommendation_ready").length,
  };

  return (
    <div>
      <PageHeader
        title={`${run.store.name} — ${run.sourceType.replaceAll("_", " ")}`}
        description="Draft product list and fix-list. This is read-only: it creates competitor observations only. It does not create recommendations, approvals, or BigCommerce price changes. Readable on permission alone — the pricing.intelligence flag gates building and checking runs, not reading stored ones."
        breadcrumb={
          <Link
            href="/products/pricing/runs"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Pricing runs
          </Link>
        }
        actions={
          canExport ? (
            <Button asChild variant="outline">
              <a href={`/api/exports/pricing/runs/${run.id}`}>
                <Download /> Export CSV
              </a>
            </Button>
          ) : null
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Status", run.status],
            ["Total items", String(counts.total)],
            ["Pending", String(counts.pending)],
            ["Checked", String(counts.checked)],
            ["Blocked", String(counts.blocked)],
            ["Missing cost", String(counts.missingCost)],
            ["Observations", String(counts.observations)],
            ["Valid observations", String(counts.valid)],
            ["Eligible for recommendation", String(counts.eligible)],
            ["Recommendations ready", String(counts.recommendationReady)],
            ["Low conf. / failed", String(counts.lowOrFailed)],
            [
              "Last checked",
              lastCheckedAt ? lastCheckedAt.toISOString().slice(0, 16).replace("T", " ") : "never",
            ],
            ["Target count", run.targetCount != null ? String(run.targetCount) : "—"],
            ["Batch / day", String(run.dailyBatchSize)],
            ["Ranking", run.rankingBasis?.replaceAll("_", " ") ?? "—"],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {canRunChecks ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Read-only competitor check</CardTitle>
              <CardDescription>
                Checks up to the batch size in <strong>products</strong>, each against up to five
                approved competitor URLs, subject to each competitor&apos;s hourly rate limit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorCheckForm runId={run.id} dailyBatchSize={run.dailyBatchSize} />
            </CardContent>
          </Card>
        ) : null}

        {canReview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate recommendations</CardTitle>
              <CardDescription>
                Turns valid, fresh competitor observations into proposals for review.{" "}
                <strong>
                  This creates recommendations only. It does not approve or write prices.
                </strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GenerateRecommendationsForm runId={run.id} />
            </CardContent>
          </Card>
        ) : null}

        {observations.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Latest observations ({observations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">SKU</th>
                    <th className="px-4 py-2 text-left">Competitor</th>
                    <th className="px-4 py-2 text-right">Observed</th>
                    <th className="px-4 py-2 text-left">Currency</th>
                    <th className="px-4 py-2 text-right">Confidence</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {run.items.flatMap((item) =>
                    item.observations.map((observation) => (
                      <tr key={observation.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                        <td className="px-4 py-2">
                          <a
                            href={observation.competitorUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="hover:underline"
                          >
                            {observation.competitor.name}
                          </a>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {money(observation.observedEffectivePrice)}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {observation.currency ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-right text-xs">
                          {observation.matchConfidence == null
                            ? "—"
                            : Math.round(Number(observation.matchConfidence) * 100) + "%"}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={observation.status === "valid" ? "outline" : "destructive"}
                          >
                            {observation.status.replaceAll("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {observation.checkedAt
                            ? observation.checkedAt.toISOString().slice(0, 16).replace("T", " ")
                            : "—"}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products ({run.items.length} shown)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-right">Regular</th>
                  <th className="px-4 py-2 text-right">Sale</th>
                  <th className="px-4 py-2 text-right">Effective</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                  <th className="px-4 py-2 text-left">Cost source</th>
                  <th className="px-4 py-2 text-right">Floor</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {run.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-2">{item.productName ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{money(item.currentRegularPrice)}</td>
                    <td className="px-4 py-2 text-right">{money(item.currentSalePrice)}</td>
                    <td className="px-4 py-2 text-right">{money(item.currentEffectivePrice)}</td>
                    <td className="px-4 py-2 text-right">{money(item.costPrice)}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {item.costSource ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">{money(item.floorPrice)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={item.status === "blocked" ? "destructive" : "outline"}>
                        {item.status === "blocked"
                          ? (item.blockedReason ?? "blocked").replaceAll("_", " ")
                          : item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
