/**
 * DP-4 recommendation detail.
 *
 * Shows the proposal, the arithmetic behind it, and the observations it rests
 * on, so a reviewer can judge the number rather than trust it.
 *
 * DP-5 adds approve / reject controls. They appear only when the SAME
 * predicate the server enforces says a decision is available, so the page
 * cannot offer a button the action would then refuse. Approving records an
 * internal decision; it writes no price anywhere.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import {
  approveUnavailableReason,
  isExpired,
  showsApproveControl,
  showsRejectControl,
} from "@/server/services/pricing/approval";
import { getRecommendation } from "@/server/services/pricing/recommendations";
import {
  canUserWriteBack,
  canWriteBack,
  describeMissingMapping,
  resolveBigCommerceTarget,
} from "@/server/services/pricing/writeback-eligibility";
import { listWritebackLogs, writebackFlagState } from "@/server/services/pricing/writeback";

import { ApproveForm, RejectForm } from "../decision-forms";
import { WritebackForm } from "../writeback-form";

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
  const user = await requirePermission(PERMISSIONS.PRICING_VIEW);
  const { id } = await params;
  const recommendation = await getRecommendation(id);
  if (!recommendation) notFound();

  const item = recommendation.pricingRunItem;
  const now = new Date();
  const asRule = {
    status: recommendation.status,
    requiresApproval: recommendation.requiresApproval,
    recommendedSalePrice: Number(recommendation.recommendedSalePrice),
    floorPrice: recommendation.floorPrice == null ? null : Number(recommendation.floorPrice),
    costPrice: recommendation.costPrice == null ? null : Number(recommendation.costPrice),
    expiresAt: recommendation.expiresAt,
  };
  const expired = isExpired(asRule, now);
  const asItem = { status: item.status, blockedReason: item.blockedReason };
  const decisionArgs = { recommendation: asRule, item: asItem, user, now };
  const canApproveHere = showsApproveControl(decisionArgs);
  const canRejectHere = showsRejectControl({ recommendation: asRule, user });
  // Shown when the user COULD decide but this row is not approvable, so the
  // absent button reads as a guardrail rather than a broken page.
  const approveBlockedBecause = canApproveHere ? null : approveUnavailableReason(decisionArgs);

  // DP-6. The panel renders on permission alone so a flag being off can be
  // EXPLAINED rather than making the control silently vanish; the eligibility
  // verdict below decides whether the button itself is offered.
  const mayWriteBack = canUserWriteBack(user);
  const [writebackLogs, flagState] = mayWriteBack
    ? await Promise.all([listWritebackLogs(recommendation.id), writebackFlagState()])
    : [[], { enabled: false, disabledFlags: [] as string[] }];
  const writebackTargetArgs = {
    product: item.product ?? null,
    variant: item.productVariant ?? null,
    variantScoped: item.productVariantId != null,
  };
  const writebackVerdict = mayWriteBack
    ? canWriteBack({
        recommendation: {
          status: recommendation.status,
          approvedById: recommendation.approvedById,
          approvedAt: recommendation.approvedAt,
          recommendedSalePrice: Number(recommendation.recommendedSalePrice),
          floorPrice: recommendation.floorPrice == null ? null : Number(recommendation.floorPrice),
          costPrice: recommendation.costPrice == null ? null : Number(recommendation.costPrice),
          expiresAt: recommendation.expiresAt,
        },
        item: { status: item.status, blockedReason: item.blockedReason, storeId: item.storeId },
        existingLogs: writebackLogs,
        target: resolveBigCommerceTarget(writebackTargetArgs),
        missingMappingMessage: describeMissingMapping(writebackTargetArgs),
        now,
      })
    : null;

  return (
    <div>
      <PageHeader
        title={`${item.sku} — ${recommendation.recommendationType.replaceAll("_", " ")}`}
        description="Approved recommendations are internal approvals only. No BigCommerce price change occurs until a later controlled writeback phase."
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
              Approving is an internal decision. No BigCommerce price change occurs until a later
              controlled writeback phase.
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
            {recommendation.approvedAt ? (
              <p className="text-xs text-muted-foreground">
                Approved by{" "}
                {recommendation.approvedBy?.name ?? recommendation.approvedBy?.email ?? "unknown"}{" "}
                at {when(recommendation.approvedAt)}. Internal approval only — no price was written.
              </p>
            ) : null}
            {recommendation.rejectedAt ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Rejected by{" "}
                  {recommendation.rejectedBy?.name ?? recommendation.rejectedBy?.email ?? "unknown"}{" "}
                  at {when(recommendation.rejectedAt)}.
                </p>
                <p className="whitespace-pre-wrap text-sm">{recommendation.rejectionReason}</p>
              </div>
            ) : null}
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

      {expired && recommendation.status === "ready_for_review" ? (
        <Card className="mt-4 border-destructive">
          <CardContent className="p-4 text-sm">
            This recommendation is expired. Re-run observation and recommendation generation before
            approving.
          </CardContent>
        </Card>
      ) : null}

      {canApproveHere || canRejectHere ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Decision</CardTitle>
            <CardDescription>
              Approved recommendations are internal approvals only. No BigCommerce price change
              occurs until a later controlled writeback phase.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {canApproveHere ? (
              <ApproveForm recommendationId={recommendation.id} />
            ) : (
              <p className="text-xs text-destructive">
                Cannot approve: {approveBlockedBecause ?? "not eligible."} Rejecting is still
                available so this row can be cleared from the queue.
              </p>
            )}
            {canRejectHere ? <RejectForm recommendationId={recommendation.id} /> : null}
          </CardContent>
        </Card>
      ) : null}

      {mayWriteBack ? (
        <Card className="mt-4 border-destructive">
          <CardHeader>
            <CardTitle>BigCommerce writeback</CardTitle>
            <CardDescription>
              Writes the approved sale price to the live storefront. One recommendation per action —
              there is no bulk or scheduled writeback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {writebackVerdict?.allowed ? (
              <WritebackForm
                recommendationId={recommendation.id}
                disabledFlags={flagState.disabledFlags}
              />
            ) : (
              <p className="text-xs text-destructive">
                Cannot write back:{" "}
                {writebackVerdict?.allowed === false ? writebackVerdict.message : "not eligible."}
              </p>
            )}

            {writebackLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3 text-right">Old sale</th>
                      <th className="py-2 pr-3 text-right">New sale</th>
                      <th className="py-2 pr-3">Written by</th>
                      <th className="py-2 pr-3">Written at</th>
                      <th className="py-2 pr-3">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {writebackLogs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <Badge variant={log.status === "succeeded" ? "default" : "destructive"}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 text-right">{money(log.oldSalePrice)}</td>
                        <td className="py-2 pr-3 text-right">{money(log.newSalePrice)}</td>
                        <td className="py-2 pr-3 text-xs">
                          {log.writtenBy?.name ?? log.writtenBy?.email ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-xs">{when(log.writtenAt)}</td>
                        <td className="max-w-[20rem] truncate py-2 pr-3 text-xs">
                          {log.errorMessage ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No writeback attempted yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

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
