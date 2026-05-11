/**
 * Customer reactivation segmentation. Pure read service that computes
 * per-customer reactivation potential from existing customer + order data.
 *
 * Intentionally derived (no extra table). Scoring is simple and explainable
 * so the marketing team can audit who gets included in a reactivation
 * campaign before it lands in front of an approver.
 *
 * Per docs/13 §6.3 + §16, only marketable + non-archived customers are
 * eligible for reactivation. Unsubscribed/cleaned/archived customers are
 * always excluded — even from the list — to make compliance posture clear.
 */

import { type Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type ReactivationCustomer = {
  id: string;
  email: string | null;
  name: string;
  customerType: string;
  consentStatus: string;
  storeName: string | null;
  lifetimeValue: number;
  orderCount: number;
  daysSinceLastOrder: number | null;
  lastOrderAt: Date | null;
  reactivationScore: number;
  bucket: ReactivationBucket;
  reasons: string[];
};

export type ReactivationBucket = "hot" | "warm" | "cold" | "deep_freeze";

export type ReactivationFilters = {
  bucket?: ReactivationBucket;
  storeId?: string;
  minLifetimeValue?: number;
  search?: string;
  limit?: number;
};

export type ReactivationSummary = {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  deepFreeze: number;
  /** Marketable customers excluded due to consent. */
  excludedDueToConsent: number;
};

const MARKETABLE_CONSENT = ["subscribed", "transactional"] as const;

function bucketize(score: number): ReactivationBucket {
  if (score >= 70) return "hot";
  if (score >= 50) return "warm";
  if (score >= 30) return "cold";
  return "deep_freeze";
}

/**
 * Score a customer for reactivation potential. Inputs:
 * - lifetime value (heavier weight = higher score)
 * - days since last order (90–365 = sweet spot)
 * - order count (returning customer = better)
 * - consent state (transactional starts lower than subscribed)
 *
 * Returned score is clamped to 0..100 with a list of reasons so the UI can
 * explain why a row appears where it does. Replace this with a fitted model
 * once campaign-result data is available.
 */
export function scoreReactivation(args: {
  lifetimeValue: number;
  orderCount: number;
  daysSinceLastOrder: number | null;
  consentStatus: string;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Lifetime-value tier (max 35 points).
  const ltv = args.lifetimeValue;
  if (ltv >= 5_000) {
    score += 35;
    reasons.push("VIP lifetime value (>$5k)");
  } else if (ltv >= 1_000) {
    score += 25;
    reasons.push("High lifetime value (>$1k)");
  } else if (ltv >= 250) {
    score += 12;
    reasons.push("Mid lifetime value (>$250)");
  }

  // Lapsed-but-active sweet spot (max 35 points).
  const days = args.daysSinceLastOrder;
  if (days != null) {
    if (days >= 90 && days <= 180) {
      score += 35;
      reasons.push("Recently lapsed (90–180 days) — best reactivation odds");
    } else if (days > 180 && days <= 365) {
      score += 22;
      reasons.push("Lapsed 6–12 months");
    } else if (days > 365 && days <= 730) {
      score += 10;
      reasons.push("Lapsed 1–2 years");
    } else if (days < 90) {
      // Still active — not really a reactivation candidate.
      reasons.push("Active in last 90 days (excluded as candidate)");
    } else {
      reasons.push("Lapsed >2 years (low odds)");
    }
  } else {
    reasons.push("Never ordered — not eligible for reactivation");
  }

  // Returning-customer bonus (max 20 points).
  if (args.orderCount >= 5) {
    score += 20;
    reasons.push("5+ orders historically (loyal)");
  } else if (args.orderCount >= 2) {
    score += 12;
    reasons.push("2–4 orders historically");
  }

  // Consent posture (max 10 points).
  if (args.consentStatus === "subscribed") {
    score += 10;
    reasons.push("Subscribed to marketing");
  } else if (args.consentStatus === "transactional") {
    score += 4;
    reasons.push("Transactional only — content must comply");
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export async function listReactivationCandidates(
  filters: ReactivationFilters = {},
): Promise<{ rows: ReactivationCustomer[]; summary: ReactivationSummary }> {
  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    consentStatus: { in: MARKETABLE_CONSENT as unknown as string[] as never },
    lastOrderAt: { not: null, lte: daysAgo(60) },
    ...(filters.storeId ? { storeId: filters.storeId } : {}),
    ...(filters.minLifetimeValue ? { lifetimeValue: { gte: filters.minLifetimeValue } } : {}),
    ...(filters.search
      ? {
          OR: [
            { email: { contains: filters.search, mode: "insensitive" } },
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { companyName: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ lifetimeValue: "desc" }, { lastOrderAt: "asc" }],
    take: filters.limit ?? 500,
    include: { store: { select: { name: true } } },
  });

  const now = Date.now();
  const rows: ReactivationCustomer[] = customers.map((c) => {
    const ltv = Number(c.lifetimeValue);
    const days = c.lastOrderAt
      ? Math.floor((now - c.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const { score, reasons } = scoreReactivation({
      lifetimeValue: ltv,
      orderCount: c.orderCount,
      daysSinceLastOrder: days,
      consentStatus: c.consentStatus,
    });
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
    const name = c.companyName || fullName || c.email || "(unnamed)";
    return {
      id: c.id,
      email: c.email,
      name,
      customerType: c.customerType,
      consentStatus: c.consentStatus,
      storeName: c.store?.name ?? null,
      lifetimeValue: ltv,
      orderCount: c.orderCount,
      daysSinceLastOrder: days,
      lastOrderAt: c.lastOrderAt,
      reactivationScore: score,
      bucket: bucketize(score),
      reasons,
    };
  });

  const filtered = filters.bucket ? rows.filter((r) => r.bucket === filters.bucket) : rows;
  filtered.sort((a, b) => b.reactivationScore - a.reactivationScore);

  // Excluded count: marketable but explicitly unsubscribed-after-consent.
  const excluded = await prisma.customer.count({
    where: {
      deletedAt: null,
      consentStatus: { in: ["unsubscribed", "cleaned"] },
      lastOrderAt: { not: null },
    },
  });

  const summary: ReactivationSummary = {
    total: rows.length,
    hot: rows.filter((r) => r.bucket === "hot").length,
    warm: rows.filter((r) => r.bucket === "warm").length,
    cold: rows.filter((r) => r.bucket === "cold").length,
    deepFreeze: rows.filter((r) => r.bucket === "deep_freeze").length,
    excludedDueToConsent: excluded,
  };

  return { rows: filtered, summary };
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
