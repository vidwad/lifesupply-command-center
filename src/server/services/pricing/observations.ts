/**
 * DP-3 observation collection service.
 *
 * Resolves which run items may be checked, which competitor URL to use, and
 * writes CompetitorPriceObservation rows. Creates observations only: no
 * recommendation, no approval, no BigCommerce call, and no reference to
 * pricing.writebacks or external.writebacks anywhere in this phase.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { COMPETITOR_CHECK_EVENT } from "@/server/inngest/functions/pricing/competitor-check";
import { requireFeature } from "@/server/services/feature-flags";

import {
  canContactCompetitor,
  isItemEligible,
  isRunCheckable,
  minRequestSpacingMs,
  resolveBatchSize,
  type CompetitorSkipReason,
  type ItemSkipReason,
} from "./eligibility";
import { PricingValidationError } from "./validation";

export type ResolvedTarget = {
  itemId: string;
  sku: string;
  productName: string | null;
  competitorId: string;
  competitorUrl: string;
  /** True when the URL came from a human-verified ProductCompetitorUrl. */
  urlVerified: boolean;
};

type ItemWithMeta = {
  id: string;
  sku: string;
  productName: string | null;
  status: string;
  blockedReason: string | null;
  costPrice: unknown;
  floorPrice: unknown;
  productId: string | null;
  productVariantId: string | null;
  metadata: unknown;
};

/** The uploaded competitor URL DP-2 preserved, if any. */
export function uploadedCompetitorUrl(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const upload = (metadata as Record<string, unknown>).upload;
  if (!upload || typeof upload !== "object" || Array.isArray(upload)) return null;
  const url = (upload as Record<string, unknown>).competitorUrl;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export type SkipRecord =
  | { kind: "item"; itemId: string; reason: ItemSkipReason }
  | { kind: "competitor"; competitorId: string; reason: CompetitorSkipReason };

export type BatchPlan = {
  targets: ResolvedTarget[];
  skips: SkipRecord[];
  batchSize: number;
};

/**
 * Decides what a single dispatch will check, without contacting anything.
 *
 * Separated from execution so the plan — including every refusal and its
 * reason — can be audited and tested independently of the network.
 */
export async function planObservationBatch(args: {
  pricingRunId: string;
  requestedBatchSize?: number | null;
}): Promise<BatchPlan> {
  const run = await prisma.pricingRun.findUniqueOrThrow({
    where: { id: args.pricingRunId },
    include: { items: { orderBy: { sku: "asc" } } },
  });
  if (!isRunCheckable(run.status)) {
    throw new PricingValidationError(
      "Only a draft or queued run can be checked. This run is " + run.status + ".",
    );
  }

  const batchSize = resolveBatchSize({
    requested: args.requestedBatchSize,
    dailyBatchSize: run.dailyBatchSize,
  });

  const competitors = await prisma.pricingCompetitor.findMany();
  const since = new Date(Date.now() - 3_600_000);
  const recentCounts = new Map<string, number>();
  for (const competitor of competitors) {
    recentCounts.set(
      competitor.id,
      await prisma.competitorPriceObservation.count({
        where: { competitorId: competitor.id, checkedAt: { gte: since } },
      }),
    );
  }

  // Terms review and rate limit are evaluated once per competitor, so a
  // refusal is recorded once rather than per item.
  const allowed = new Map<string, (typeof competitors)[number]>();
  const skips: SkipRecord[] = [];
  for (const competitor of competitors) {
    const decision = canContactCompetitor(competitor, {
      checksInLastHour: recentCounts.get(competitor.id) ?? 0,
    });
    if (decision.allowed) allowed.set(competitor.id, competitor);
    else skips.push({ kind: "competitor", competitorId: competitor.id, reason: decision.reason });
  }

  const mappings = await prisma.productCompetitorUrl.findMany({
    where: { status: "active", competitorId: { in: [...allowed.keys()] } },
  });

  const targets: ResolvedTarget[] = [];
  for (const item of run.items as unknown as ItemWithMeta[]) {
    const mapping = mappings.find(
      (row) =>
        (item.productVariantId != null && row.productVariantId === item.productVariantId) ||
        (item.productId != null && row.productId === item.productId),
    );
    const uploaded = uploadedCompetitorUrl(item.metadata);

    const decision = isItemEligible(item, {
      runStatus: run.status,
      hasCompetitorUrl: Boolean(mapping) || Boolean(uploaded),
    });
    if (!decision.eligible) {
      skips.push({ kind: "item", itemId: item.id, reason: decision.reason });
      continue;
    }
    if (targets.length >= batchSize) continue;

    if (mapping) {
      targets.push({
        itemId: item.id,
        sku: item.sku,
        productName: item.productName,
        competitorId: mapping.competitorId,
        competitorUrl: mapping.competitorUrl,
        urlVerified: mapping.verifiedAt != null,
      });
      continue;
    }

    // An uploaded URL is only usable if it belongs to an allowed competitor —
    // matched by origin, so an operator cannot introduce an unreviewed site by
    // putting its URL in a spreadsheet.
    const host = safeHost(uploaded);
    const competitor = host
      ? [...allowed.values()].find((row) => safeHost(row.baseUrl) === host)
      : undefined;
    if (!competitor || !uploaded) {
      skips.push({ kind: "item", itemId: item.id, reason: "no_competitor_url" });
      continue;
    }
    targets.push({
      itemId: item.id,
      sku: item.sku,
      productName: item.productName,
      competitorId: competitor.id,
      competitorUrl: uploaded,
      urlVerified: false,
    });
  }

  return { targets, skips, batchSize };
}

function safeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export { minRequestSpacingMs };

export async function requestCompetitorCheck(args: {
  actorUserId: string;
  pricingRunId: string;
  batchSize?: number | null;
}): Promise<{ targets: number; skipped: number; batchSize: number }> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  // Planned before dispatch so the operator is told up front how many items
  // will actually be checked, and so a run with nothing eligible fails here
  // rather than queueing a job that does nothing.
  const plan = await planObservationBatch({
    pricingRunId: args.pricingRunId,
    requestedBatchSize: args.batchSize,
  });
  if (plan.targets.length === 0) {
    throw new PricingValidationError(
      "No eligible items. Items must be pending, unblocked, have a cost and floor, and have a competitor URL from an approved competitor.",
    );
  }
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.competitor_check_requested",
    entityType: "PricingRun",
    entityId: args.pricingRunId,
    afterData: {
      batchSize: plan.batchSize,
      targets: plan.targets.length,
      skipped: plan.skips.length,
      skipReasons: plan.skips.map((skip) =>
        skip.kind === "item" ? "item:" + skip.reason : "competitor:" + skip.reason,
      ),
    },
  });

  await inngest.send({
    id: "pricing-check-" + args.pricingRunId + "-" + String(Date.now()),
    name: COMPETITOR_CHECK_EVENT,
    data: {
      pricingRunId: args.pricingRunId,
      actorUserId: args.actorUserId,
      batchSize: plan.batchSize,
    },
  });

  return { targets: plan.targets.length, skipped: plan.skips.length, batchSize: plan.batchSize };
}
