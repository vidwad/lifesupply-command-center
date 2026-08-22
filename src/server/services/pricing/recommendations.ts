/**
 * DP-4 recommendation generation service.
 *
 * Reads observations DP-3 already collected and writes PriceRecommendation
 * rows for human review. It creates a queue and nothing else: no approval
 * record, no ProductVariant or Product mutation, no BigCommerce call, no
 * outbound HTTP of any kind, and no reference to pricing.writebacks or
 * external.writebacks.
 *
 * Every row is written with requiresApproval = true and status
 * ready_for_review. Deciding on a row is DP-5 (services/pricing/approvals.ts);
 * this module never sets a decision column.
 *
 * Generation runs synchronously rather than through Inngest: unlike DP-3 this
 * phase contacts nothing and is bounded arithmetic over rows already in the
 * database, so a background worker would add failure modes without buying
 * anything.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { requireFeature } from "@/server/services/feature-flags";

import {
  calculateRecommendation,
  PRICED_RECOMMENDATION_TYPES,
  RECOMMENDABLE_RUN_STATUSES,
  type ItemInput,
  type ObservationInput,
  type Recommendation,
  type RecommendationType,
  type RuleSettings,
} from "./recommendation";
import { PricingValidationError } from "./validation";

/** Cap on items processed per generation pass, matching DP-2's list ceiling. */
export const MAX_ITEMS_PER_GENERATION = 2000;

const num = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Resolves the rule that governs this run: store-specific first, then global.
 * Mirrors resolveMinCostMultiplier so both phases agree on which rule is
 * "active" for a store.
 */
export async function resolveRuleSettings(storeId: string): Promise<RuleSettings> {
  const rule =
    (await prisma.pricingRule.findFirst({
      where: { enabled: true, storeId },
      orderBy: { updatedAt: "desc" },
    })) ??
    (await prisma.pricingRule.findFirst({
      where: { enabled: true, storeId: null },
      orderBy: { updatedAt: "desc" },
    }));
  if (!rule) {
    throw new PricingValidationError(
      "No enabled pricing rule found. Seed the default global rule or create one before generating recommendations.",
    );
  }
  return {
    minCostMultiplier: Number(rule.minCostMultiplier),
    undercutAmount: Number(rule.defaultUndercutAmount),
    maxIncreasePct: Number(rule.maxIncreasePct),
    maxDecreasePct: Number(rule.maxDecreasePct),
    minConfidence: Number(rule.minConfidence),
    evidenceFreshnessHours: rule.evidenceFreshnessHours,
  };
}

/** Currency configured on the run, if any. No Store.currency column exists. */
export function runCurrencyFrom(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).currency;
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;
}

export type GenerationSummary = {
  itemsConsidered: number;
  created: number;
  skippedExisting: number;
  /** Count per recommendation type, including blocked outcomes. */
  byType: Record<string, number>;
  failed: number;
};

const bump = (counts: Record<string, number>, key: string): void => {
  counts[key] = (counts[key] ?? 0) + 1;
};

/**
 * True when an existing recommendation should stop DP-4 regenerating this item.
 *
 * Regenerating a run must not stack duplicate rows on the same item: a reviewer
 * seeing two live proposals for one SKU has no way to tell which one the queue
 * means.
 *
 * WIDENED IN DP-5. Through DP-4 only `ready_for_review` suppressed, which meant
 * a rejected recommendation came straight back on the next pass — the reviewer
 * says no and the system silently asks again with the same evidence. Decided
 * rows now suppress too:
 *
 *  - `approved` and `written_back` always suppress. An approved row is waiting
 *    on DP-6; proposing a competing price for the same item alongside it would
 *    make the queue ambiguous at exactly the wrong moment.
 *  - `rejected` suppresses until its evidence horizon passes. The rejection was
 *    of a price derived from THAT evidence, so re-asking on fresher evidence is
 *    legitimate; re-asking on the same evidence is not.
 *  - `expired` and `failed` never suppress — there is nothing live to protect.
 */
export function isStillLive(
  existing: { status: string; expiresAt: Date | null },
  now: Date,
): boolean {
  if (existing.status === "approved" || existing.status === "written_back") return true;
  if (existing.status !== "ready_for_review" && existing.status !== "rejected") return false;
  return existing.expiresAt == null || existing.expiresAt > now;
}

export async function generateRecommendationsForRun(args: {
  actorUserId: string;
  pricingRunId: string;
  now?: Date;
}): Promise<GenerationSummary> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const now = args.now ?? new Date();

  const run = await prisma.pricingRun.findUnique({
    where: { id: args.pricingRunId },
    select: { id: true, storeId: true, status: true, metadata: true },
  });
  if (!run) throw new PricingValidationError("Pricing run not found.");
  if (!(RECOMMENDABLE_RUN_STATUSES as readonly string[]).includes(run.status)) {
    throw new PricingValidationError(
      "This run is " +
        run.status +
        ". Recommendations are generated only for " +
        RECOMMENDABLE_RUN_STATUSES.join(", ") +
        " runs.",
    );
  }

  const rule = await resolveRuleSettings(run.storeId);
  const runCurrency = runCurrencyFrom(run.metadata);

  const items = await prisma.pricingRunItem.findMany({
    where: { pricingRunId: run.id },
    take: MAX_ITEMS_PER_GENERATION,
    orderBy: { sku: "asc" },
    include: {
      observations: { orderBy: { checkedAt: "desc" }, take: 25 },
      // Not filtered to ready_for_review: DP-5 lets decided rows suppress
      // regeneration too, so isStillLive must see them.
      recommendations: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, status: true, expiresAt: true },
      },
    },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.recommendation_generation_requested",
    entityType: "PricingRun",
    entityId: run.id,
    afterData: { itemsConsidered: items.length, rule, runCurrency },
  });

  const summary: GenerationSummary = {
    itemsConsidered: items.length,
    created: 0,
    skippedExisting: 0,
    byType: {},
    failed: 0,
  };

  for (const item of items) {
    try {
      if (item.recommendations.some((existing) => isStillLive(existing, now))) {
        summary.skippedExisting += 1;
        continue;
      }

      const itemInput: ItemInput = {
        id: item.id,
        sku: item.sku,
        status: item.status,
        blockedReason: item.blockedReason,
        costPrice: num(item.costPrice),
        floorPrice: num(item.floorPrice),
        currentRegularPrice: num(item.currentRegularPrice),
        currentSalePrice: num(item.currentSalePrice),
        currentEffectivePrice: num(item.currentEffectivePrice),
      };
      const observations: ObservationInput[] = item.observations.map((observation) => ({
        id: observation.id,
        competitorId: observation.competitorId,
        status: observation.status,
        observedEffectivePrice: num(observation.observedEffectivePrice),
        currency: observation.currency,
        matchConfidence: num(observation.matchConfidence),
        checkedAt: observation.checkedAt,
      }));

      const result = calculateRecommendation({
        item: itemInput,
        observations,
        rule,
        runStatus: run.status,
        runCurrency,
        now,
      });
      bump(summary.byType, result.type);

      await persistOutcome({
        itemId: item.id,
        existingMetadata: item.metadata,
        oldRegularPrice: itemInput.currentRegularPrice,
        oldSalePrice: itemInput.currentSalePrice,
        result,
        summary,
      });
    } catch {
      summary.failed += 1;
      bump(summary.byType, "calculation_failed");
    }
  }

  // Grouped rather than per-item: a 1500-row run would otherwise bury the
  // audit log, and what management needs is why recommendations were or were
  // not created, which the type counts answer directly.
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.recommendation_generation_completed",
    entityType: "PricingRun",
    entityId: run.id,
    afterData: summary,
  });

  return summary;
}

/**
 * Writes one outcome.
 *
 * Only priced outcomes become PriceRecommendation rows. A blocked outcome has
 * no proposed price, and recommendedSalePrice is a non-nullable column — so
 * storing one would mean inventing a number that a reviewer could act on.
 * Blocked outcomes are recorded on the run item and counted in the audit
 * summary instead, which preserves the "why not" without fabricating a price.
 */
async function persistOutcome(args: {
  itemId: string;
  existingMetadata: unknown;
  oldRegularPrice: number | null;
  oldSalePrice: number | null;
  result: Recommendation;
  summary: GenerationSummary;
}): Promise<void> {
  const { itemId, result, summary } = args;
  const priced = (PRICED_RECOMMENDATION_TYPES as readonly string[]).includes(result.type);

  if (!priced || result.recommendedSalePrice == null) {
    // Merged, never replaced: metadata.upload.competitorUrl is what DP-3 reads
    // to know which page to check, and clobbering it would silently un-map the
    // item from its competitor.
    const base =
      args.existingMetadata &&
      typeof args.existingMetadata === "object" &&
      !Array.isArray(args.existingMetadata)
        ? (args.existingMetadata as Record<string, unknown>)
        : {};
    await prisma.pricingRunItem.update({
      where: { id: itemId },
      data: {
        recommendationType: result.type,
        lowestCompetitorPrice: result.lowestCompetitorPrice,
        confidence: result.confidence,
        metadata: { ...base, recommendation: { type: result.type, reason: result.reason } },
      },
    });
    return;
  }

  await prisma.priceRecommendation.create({
    data: {
      pricingRunItemId: itemId,
      oldRegularPrice: args.oldRegularPrice,
      oldSalePrice: args.oldSalePrice,
      recommendedSalePrice: result.recommendedSalePrice,
      floorPrice: result.floorPrice,
      costPrice: result.costPrice,
      marginBefore: result.marginBefore,
      marginAfter: result.marginAfter,
      lowestCompetitorPrice: result.lowestCompetitorPrice,
      undercutAmount: result.undercutAmount,
      recommendationType: result.type,
      reason: result.reason,
      // Both are constants in DP-4, not decisions. Approval arrives in DP-5.
      requiresApproval: true,
      status: "ready_for_review",
      expiresAt: result.expiresAt,
    },
  });

  // Mirrors the proposal onto the run item so the run page can count what is
  // ready without loading every recommendation. This is a status on OUR
  // workflow row; no product or variant price is touched anywhere in DP-4.
  await prisma.pricingRunItem.update({
    where: { id: itemId },
    data: {
      status: "recommendation_ready",
      recommendationType: result.type,
      recommendedSalePrice: result.recommendedSalePrice,
      lowestCompetitorPrice: result.lowestCompetitorPrice,
      confidence: result.confidence,
    },
  });
  summary.created += 1;
}

export async function listRecommendations(args?: {
  /** A PriceRecommendationStatus, or "all" / undefined for no status filter. */
  status?: string;
  pricingRunId?: string;
  take?: number;
}) {
  const status = args?.status;
  return prisma.priceRecommendation.findMany({
    where: {
      status: status && status !== "all" ? { equals: status as never } : undefined,
      pricingRunItem: args?.pricingRunId ? { pricingRunId: args.pricingRunId } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: args?.take ?? 500,
    include: {
      // Decision actors are read-only projections: name and email only, so the
      // queue can say who decided without widening what a viewer can see.
      approvedBy: { select: { id: true, name: true, email: true } },
      rejectedBy: { select: { id: true, name: true, email: true } },
      // DP-6 status summary. Newest first so the queue reflects the latest
      // attempt rather than the first one.
      writebackLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, writtenAt: true },
      },
      pricingRunItem: {
        include: {
          store: { select: { id: true, name: true } },
          pricingRun: { select: { id: true, sourceType: true } },
        },
      },
    },
  });
}

/**
 * One-word writeback state for the queue.
 *
 * Distinguishes "nobody has tried" from "an attempt failed": both leave the
 * recommendation `approved`, and conflating them would hide failed writes.
 */
export function writebackSummary(row: {
  status: string;
  writebackLogs: readonly { status: string }[];
}): "written_back" | "writeback_failed" | "approved_not_written" | "not_applicable" {
  if (row.writebackLogs.some((log) => log.status === "succeeded")) return "written_back";
  if (row.writebackLogs.some((log) => log.status === "failed")) return "writeback_failed";
  if (row.status === "approved") return "approved_not_written";
  return "not_applicable";
}

/** Counts per status, for the queue filter tabs. */
export async function recommendationStatusCounts(): Promise<Record<string, number>> {
  const grouped = await prisma.priceRecommendation.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of grouped) {
    counts[row.status] = row._count._all;
    total += row._count._all;
  }
  counts.all = total;
  return counts;
}

export async function getRecommendation(id: string) {
  return prisma.priceRecommendation.findUnique({
    where: { id },
    include: {
      approvedBy: { select: { id: true, name: true, email: true } },
      rejectedBy: { select: { id: true, name: true, email: true } },
      pricingRunItem: {
        include: {
          store: { select: { id: true, name: true } },
          pricingRun: { select: { id: true, sourceType: true, status: true } },
          // Source ids only. DP-6 needs them to resolve the BigCommerce target;
          // loading the whole product here would pull catalogue content into a
          // pricing page that has no use for it.
          product: { select: { id: true, sourceSystem: true, sourceId: true } },
          productVariant: { select: { id: true, sourceSystem: true, sourceId: true } },
          observations: {
            orderBy: { checkedAt: "desc" },
            take: 25,
            include: { competitor: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
}

export { PRICED_RECOMMENDATION_TYPES, type RecommendationType };
