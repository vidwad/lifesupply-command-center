/**
 * DP-5 approval/rejection service.
 *
 * Records an INTERNAL decision on a PriceRecommendation and nothing else. It
 * writes no product price, no variant price, no PriceWritebackLog, calls no
 * external system, makes no outbound request, and never references
 * pricing.writebacks or external.writebacks.
 *
 * An approved recommendation is a recommendation someone has accepted. It is
 * not a price change, and it does not queue one — DP-6 writeback is a separate
 * phase behind its own flags and its own permission.
 *
 * Decisions are audited per row rather than grouped. DP-4 groups its
 * generation counts because generation is a bulk mechanical act; a decision is
 * a personal accountable one, and the log has to name who made which.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { requireFeature } from "@/server/services/feature-flags";

import {
  canApprove,
  canReject,
  isExpired,
  type RecommendationLike,
  type RunItemLike,
  type Verdict,
} from "./approval";
import { PricingValidationError } from "./validation";

const num = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** The row plus the run-item context the eligibility rules need. */
async function loadForDecision(recommendationId: string) {
  const row = await prisma.priceRecommendation.findUnique({
    where: { id: recommendationId },
    include: {
      pricingRunItem: {
        select: {
          id: true,
          sku: true,
          status: true,
          blockedReason: true,
          currentSalePrice: true,
          currentEffectivePrice: true,
          pricingRunId: true,
        },
      },
    },
  });
  if (!row) throw new PricingValidationError("Recommendation not found.");
  return row;
}

type LoadedRow = Awaited<ReturnType<typeof loadForDecision>>;

function toRecommendationLike(row: LoadedRow): RecommendationLike {
  return {
    status: row.status,
    requiresApproval: row.requiresApproval,
    recommendedSalePrice: num(row.recommendedSalePrice),
    floorPrice: num(row.floorPrice),
    costPrice: num(row.costPrice),
    expiresAt: row.expiresAt,
  };
}

function toRunItemLike(row: LoadedRow): RunItemLike {
  const item = row.pricingRunItem;
  if (!item) return null;
  return { status: item.status, blockedReason: item.blockedReason };
}

/** The decision context every audit entry carries, so a log row stands alone. */
function auditContext(row: LoadedRow) {
  return {
    recommendationId: row.id,
    pricingRunItemId: row.pricingRunItemId,
    pricingRunId: row.pricingRunItem?.pricingRunId ?? null,
    sku: row.pricingRunItem?.sku ?? null,
    oldSalePrice: num(row.oldSalePrice),
    currentEffectivePrice: num(row.pricingRunItem?.currentEffectivePrice),
    recommendedSalePrice: num(row.recommendedSalePrice),
    floorPrice: num(row.floorPrice),
    costPrice: num(row.costPrice),
    lowestCompetitorPrice: num(row.lowestCompetitorPrice),
    recommendationType: row.recommendationType,
    expiresAt: row.expiresAt,
  };
}

async function auditRefusal(args: {
  actorUserId: string;
  row: LoadedRow;
  verdict: Extract<Verdict, { allowed: false }>;
  intent: "approve" | "reject";
}): Promise<void> {
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.recommendation_approval_refused",
    entityType: "PriceRecommendation",
    entityId: args.row.id,
    beforeData: { status: args.row.status },
    afterData: {
      ...auditContext(args.row),
      intent: args.intent,
      refusedBecause: args.verdict.reason,
      message: args.verdict.message,
    },
  });
}

/**
 * Flips a time-expired row to `expired`.
 *
 * Housekeeping in the safe direction: it moves a row OUT of the reviewable
 * state, never into it, so the worst case of getting this wrong is a row a
 * reviewer has to regenerate.
 */
export async function markExpired(args: {
  actorUserId: string;
  recommendationId: string;
}): Promise<void> {
  const row = await loadForDecision(args.recommendationId);
  if (row.status !== "ready_for_review") return;
  await prisma.priceRecommendation.update({
    where: { id: row.id },
    data: { status: "expired" },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.recommendation_expired",
    entityType: "PriceRecommendation",
    entityId: row.id,
    beforeData: { status: row.status },
    afterData: { ...auditContext(row), status: "expired" },
  });
}

export async function approveRecommendation(args: {
  actorUserId: string;
  recommendationId: string;
  now?: Date;
}): Promise<{ id: string; status: string }> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const now = args.now ?? new Date();
  const row = await loadForDecision(args.recommendationId);

  const verdict = canApprove(toRecommendationLike(row), toRunItemLike(row), now);
  if (!verdict.allowed) {
    await auditRefusal({ actorUserId: args.actorUserId, row, verdict, intent: "approve" });
    // An expired row is retired as part of refusing it, so the queue does not
    // keep offering a decision that can never be taken.
    if (verdict.reason === "expired") {
      await markExpired({
        actorUserId: args.actorUserId,
        recommendationId: args.recommendationId,
      });
    }
    throw new PricingValidationError(verdict.message);
  }

  const updated = await prisma.priceRecommendation.update({
    where: { id: row.id },
    data: {
      status: "approved",
      approvedById: args.actorUserId,
      approvedAt: now,
    },
    select: { id: true, status: true },
  });

  // Internal workflow mirror on OUR row so the run page can count decisions.
  // No product or variant price is touched here or anywhere in DP-5.
  await prisma.pricingRunItem.update({
    where: { id: row.pricingRunItemId },
    data: { status: "approved" },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.recommendation_approved",
    entityType: "PriceRecommendation",
    entityId: row.id,
    beforeData: { status: row.status },
    afterData: {
      ...auditContext(row),
      status: "approved",
      approvedById: args.actorUserId,
      approvedAt: now,
      // Stated in the record itself so a future reader of this log cannot
      // mistake an approval for a price change.
      note: "Internal approval only. No price was written to any store.",
    },
  });

  return updated;
}

export async function rejectRecommendation(args: {
  actorUserId: string;
  recommendationId: string;
  reason: string;
  now?: Date;
}): Promise<{ id: string; status: string }> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const now = args.now ?? new Date();
  const row = await loadForDecision(args.recommendationId);

  const verdict = canReject({ status: row.status }, args.reason);
  if (!verdict.allowed) {
    await auditRefusal({ actorUserId: args.actorUserId, row, verdict, intent: "reject" });
    throw new PricingValidationError(verdict.message);
  }

  const updated = await prisma.priceRecommendation.update({
    where: { id: row.id },
    data: {
      status: "rejected",
      rejectedById: args.actorUserId,
      rejectedAt: now,
      rejectionReason: args.reason,
    },
    select: { id: true, status: true },
  });

  await prisma.pricingRunItem.update({
    where: { id: row.pricingRunItemId },
    data: { status: "rejected" },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.recommendation_rejected",
    entityType: "PriceRecommendation",
    entityId: row.id,
    beforeData: { status: row.status },
    afterData: {
      ...auditContext(row),
      status: "rejected",
      rejectedById: args.actorUserId,
      rejectedAt: now,
      rejectionReason: args.reason,
      expiredAtDecision: isExpired(toRecommendationLike(row), now),
    },
  });

  return updated;
}
