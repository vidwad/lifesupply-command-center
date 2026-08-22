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
  remainingHourlyAllowance,
  resolveBatchSize,
  selectCompetitorUrlsForItem,
  type UrlCandidate,
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

export type SkipCounts = Record<string, number>;

export type BatchPlan = {
  targets: ResolvedTarget[];
  /** Products selected. Distinct from targets.length, which counts URLs. */
  itemsSelected: number;
  skipCounts: SkipCounts;
  batchSize: number;
};

const bump = (counts: SkipCounts, key: string, by = 1): void => {
  counts[key] = (counts[key] ?? 0) + by;
};

function safeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Decides what a single dispatch will check, without contacting anything.
 *
 * batchSize counts PRODUCTS. Each selected product may resolve up to five
 * approved competitor URLs, so a 300-product batch can produce up to 1500
 * targets. Reading the cap as "300 URL checks" would have silently checked 60
 * products when each has five competitors.
 *
 * A competitor is never given more targets than its remaining hourly
 * allowance, so the plan itself cannot describe work that would breach a rate
 * limit — execution then only has to pace what the plan already permits.
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
  const skipCounts: SkipCounts = {};

  const allowed = new Map<string, (typeof competitors)[number]>();
  const allowance = new Map<string, number>();
  for (const competitor of competitors) {
    const checksInLastHour = await prisma.competitorPriceObservation.count({
      where: { competitorId: competitor.id, checkedAt: { gte: since } },
    });
    const decision = canContactCompetitor(competitor, { checksInLastHour });
    if (!decision.allowed) {
      bump(skipCounts, "competitor:" + decision.reason);
      continue;
    }
    allowed.set(competitor.id, competitor);
    allowance.set(competitor.id, remainingHourlyAllowance(competitor, checksInLastHour));
  }

  const allowedIds = [...allowed.keys()];
  const mappings = allowedIds.length
    ? await prisma.productCompetitorUrl.findMany({
        where: { status: "active", competitorId: { in: allowedIds } },
      })
    : [];
  const byOrigin = new Map<string, string>();
  for (const competitor of allowed.values()) {
    const host = safeHost(competitor.baseUrl);
    if (host) byOrigin.set(host, competitor.id);
  }

  const targets: ResolvedTarget[] = [];
  let itemsSelected = 0;

  for (const item of run.items as unknown as ItemWithMeta[]) {
    if (itemsSelected >= batchSize) break;

    const candidates: UrlCandidate[] = [];
    for (const mapping of mappings) {
      const isVariant =
        item.productVariantId != null && mapping.productVariantId === item.productVariantId;
      const isProduct = item.productId != null && mapping.productId === item.productId;
      if (!isVariant && !isProduct) continue;
      candidates.push({
        competitorId: mapping.competitorId,
        competitorUrl: mapping.competitorUrl,
        scope: isVariant ? "variant" : "product",
        urlVerified: mapping.verifiedAt != null,
      });
    }

    const uploaded = uploadedCompetitorUrl(item.metadata);
    if (uploaded) {
      const host = safeHost(uploaded);
      const competitorId = host ? byOrigin.get(host) : undefined;
      if (competitorId) {
        candidates.push({
          competitorId,
          competitorUrl: uploaded,
          scope: "upload",
          urlVerified: false,
        });
      } else {
        bump(skipCounts, host ? "url:unapproved_origin" : "url:invalid_url");
      }
    }

    const decision = isItemEligible(item, {
      runStatus: run.status,
      hasCompetitorUrl: candidates.length > 0,
    });
    if (!decision.eligible) {
      bump(skipCounts, "item:" + decision.reason);
      continue;
    }

    const chosen = selectCompetitorUrlsForItem(candidates);
    const withinAllowance: UrlCandidate[] = [];
    for (const candidate of chosen) {
      const left = allowance.get(candidate.competitorId) ?? 0;
      if (left <= 0) {
        bump(skipCounts, "competitor:rate_limited");
        continue;
      }
      allowance.set(candidate.competitorId, left - 1);
      withinAllowance.push(candidate);
    }
    if (withinAllowance.length === 0) {
      bump(skipCounts, "item:no_competitor_url");
      continue;
    }

    itemsSelected += 1;
    for (const candidate of withinAllowance) {
      targets.push({
        itemId: item.id,
        sku: item.sku,
        productName: item.productName,
        competitorId: candidate.competitorId,
        competitorUrl: candidate.competitorUrl,
        urlVerified: candidate.urlVerified,
      });
    }
  }

  return { targets, itemsSelected, skipCounts, batchSize };
}

export { minRequestSpacingMs };

export async function requestCompetitorCheck(args: {
  actorUserId: string;
  pricingRunId: string;
  batchSize?: number | null;
}): Promise<{ items: number; targets: number; batchSize: number; skipCounts: SkipCounts }> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const plan = await planObservationBatch({
    pricingRunId: args.pricingRunId,
    requestedBatchSize: args.batchSize,
  });
  if (plan.targets.length === 0) {
    throw new PricingValidationError(
      "No eligible checks. Items must be pending, unblocked, have a cost and floor, and have a competitor URL belonging to a competitor whose terms review is allowed and which is within its hourly rate limit.",
    );
  }

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.competitor_check_requested",
    entityType: "PricingRun",
    entityId: args.pricingRunId,
    afterData: {
      batchSize: plan.batchSize,
      itemsSelected: plan.itemsSelected,
      urlTargets: plan.targets.length,
      // Grouped rather than per-row: the operator needs to know WHY fewer
      // checks ran than the batch size implied, not which row each was.
      skipCounts: plan.skipCounts,
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

  return {
    items: plan.itemsSelected,
    targets: plan.targets.length,
    batchSize: plan.batchSize,
    skipCounts: plan.skipCounts,
  };
}
