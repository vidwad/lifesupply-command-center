/**
 * DP-2 Product List Builder — pure selection, mapping, and blocking rules.
 *
 * Kept free of Prisma so the guardrails are unit-testable: no product may reach
 * a future price check without a cost basis, the cost source must be recorded,
 * and the floor price must be computed and stored at build time rather than
 * recalculated later against a rule that may since have changed.
 */

export type RankingBasis = "revenue" | "units" | "gross_profit" | "margin_opportunity";

export const RANKING_BASES: readonly RankingBasis[] = [
  "revenue",
  "units",
  "gross_profit",
  "margin_opportunity",
];

export const DEFAULT_TARGET_COUNT = 1500;

/** Why an item cannot proceed to a future price check. */
export type BlockedReason =
  | "missing_cost"
  | "invalid_price"
  | "duplicate_sku"
  | "unmatched_sku"
  | "floor_above_price";

export type CostSource = "variant" | "order_history" | "upload" | "none";

/** One row of a candidate list, before it becomes a PricingRunItem. */
/** Where an inferred cost came from, for audit and staleness checks. */
export type CostSourceRef = {
  orderItemId?: string | null;
  orderDate?: string | null;
};

/** Uploaded fields that are not columns on PricingRunItem but must survive. */
export type UploadMeta = {
  uploadRow?: number;
  competitorUrl?: string | null;
  supplierSku?: string | null;
  notes?: string | null;
  store?: string | null;
  uploadedProductId?: string | null;
  uploadedVariantId?: string | null;
  parseErrors?: string[];
};

export type CandidateItem = {
  sku: string;
  productId: string | null;
  productVariantId: string | null;
  productName: string | null;
  currentRegularPrice: number | null;
  currentSalePrice: number | null;
  costPrice: number | null;
  costSource: CostSource;
  quantitySold: number;
  revenue: number;
  estimatedGrossProfit: number | null;
  costSourceRef?: CostSourceRef;
  uploadMeta?: UploadMeta;
};

export type BuiltItem = CandidateItem & {
  currentEffectivePrice: number | null;
  floorPrice: number | null;
  status: "pending" | "blocked";
  blockedReason: BlockedReason | null;
};

/** Sale price wins when present and positive; otherwise the regular price. */
export function effectivePrice(regular: number | null, sale: number | null): number | null {
  if (sale != null && sale > 0) return sale;
  if (regular != null && regular > 0) return regular;
  return null;
}

/**
 * The price floor. Stored per item at build time: recomputing later against a
 * rule that has since been edited would silently move the floor under
 * recommendations already reviewed against the old one.
 */
export function floorPrice(cost: number | null, minCostMultiplier: number): number | null {
  if (cost == null || cost <= 0) return null;
  if (!Number.isFinite(minCostMultiplier) || minCostMultiplier <= 0) return null;
  return Math.round(cost * minCostMultiplier * 100) / 100;
}

/**
 * Ranking key. margin_opportunity favours products selling well at a thin
 * margin — the ones where a price correction is worth the most — and falls back
 * to revenue when margin is unknown rather than ranking them last.
 */
export function rankingValue(item: CandidateItem, basis: RankingBasis): number {
  switch (basis) {
    case "units":
      return item.quantitySold;
    case "gross_profit":
      return item.estimatedGrossProfit ?? 0;
    case "margin_opportunity": {
      if (item.estimatedGrossProfit == null || item.revenue <= 0) return item.revenue;
      const margin = item.estimatedGrossProfit / item.revenue;
      return item.revenue * Math.max(0, 1 - margin);
    }
    case "revenue":
    default:
      return item.revenue;
  }
}

export function rankCandidates(
  items: readonly CandidateItem[],
  basis: RankingBasis,
  targetCount: number,
): CandidateItem[] {
  const limit = Number.isFinite(targetCount) && targetCount > 0 ? Math.floor(targetCount) : 0;
  return [...items]
    .sort((a, b) => {
      const diff = rankingValue(b, basis) - rankingValue(a, basis);
      // Deterministic order so a rebuilt run reproduces the same list.
      return diff !== 0 ? diff : a.sku.localeCompare(b.sku);
    })
    .slice(0, limit);
}

/**
 * Applies the blocking rules and computes derived prices.
 *
 * Blocked items are kept, not dropped: an operator needs to see which products
 * were excluded and why, and a silently shortened list is indistinguishable
 * from a product that simply did not sell.
 */
export function buildItems(
  items: readonly CandidateItem[],
  minCostMultiplier: number,
): BuiltItem[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    const key = item.sku.trim().toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const emitted = new Set<string>();

  return items.map((item) => {
    const key = item.sku.trim().toLowerCase();
    const price = effectivePrice(item.currentRegularPrice, item.currentSalePrice);
    const floor = floorPrice(item.costPrice, minCostMultiplier);

    let blockedReason: BlockedReason | null = null;
    if (!key) {
      blockedReason = "unmatched_sku";
    } else if ((seen.get(key) ?? 0) > 1 && emitted.has(key)) {
      // First occurrence proceeds; later duplicates are blocked so the run
      // cannot check the same product twice under one rule.
      blockedReason = "duplicate_sku";
    } else if (item.costPrice == null || item.costPrice <= 0) {
      blockedReason = "missing_cost";
    } else if (price == null) {
      blockedReason = "invalid_price";
    } else if (floor != null && price < floor) {
      // Already below its own floor: a price check cannot help, and raising to
      // the floor is a pricing decision no one has approved.
      blockedReason = "floor_above_price";
    }
    emitted.add(key);

    return {
      ...item,
      currentEffectivePrice: price,
      floorPrice: floor,
      status: blockedReason ? "blocked" : "pending",
      blockedReason,
    };
  });
}

export type BuildSummary = {
  total: number;
  pending: number;
  blocked: number;
  missingCost: number;
  duplicates: number;
  unmatched: number;
  invalidPrice: number;
  belowFloor: number;
};

export function summarise(items: readonly BuiltItem[]): BuildSummary {
  const count = (reason: BlockedReason) =>
    items.filter((item) => item.blockedReason === reason).length;
  return {
    total: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    blocked: items.filter((item) => item.status === "blocked").length,
    missingCost: count("missing_cost"),
    duplicates: count("duplicate_sku"),
    unmatched: count("unmatched_sku"),
    invalidPrice: count("invalid_price"),
    belowFloor: count("floor_above_price"),
  };
}

/** Lookback windows offered in the UI, in days. */
export const LOOKBACK_WINDOWS = [30, 90, 180, 365] as const;
export type LookbackWindow = (typeof LOOKBACK_WINDOWS)[number];

/**
 * Upper bound on a single run.
 *
 * 1500 is the PRD's target list size. The cap exists because target count
 * drives how many products a later phase will fetch competitor prices for, and
 * an accidental 150000 would commit the operation to a workload nobody sized.
 * Raising it is a product-owner decision, not a form input.
 */
export const MAX_TARGET_COUNT = 1500;

export class ListBuilderInputError extends Error {}

export function parseRankingBasis(value: unknown): RankingBasis {
  if (typeof value === "string" && (RANKING_BASES as readonly string[]).includes(value)) {
    return value as RankingBasis;
  }
  throw new ListBuilderInputError(`Ranking basis must be one of: ${RANKING_BASES.join(", ")}.`);
}

export function parseLookbackWindow(value: unknown): LookbackWindow {
  const days = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if ((LOOKBACK_WINDOWS as readonly number[]).includes(days)) return days as LookbackWindow;
  throw new ListBuilderInputError(
    `Lookback window must be one of: ${LOOKBACK_WINDOWS.join(", ")} days.`,
  );
}

export function parseTargetCount(value: unknown): number {
  const raw = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw <= 0) {
    throw new ListBuilderInputError("Target count must be a positive whole number.");
  }
  if (raw > MAX_TARGET_COUNT) {
    throw new ListBuilderInputError(
      `Target count cannot exceed ${MAX_TARGET_COUNT} in this phase.`,
    );
  }
  return raw;
}
