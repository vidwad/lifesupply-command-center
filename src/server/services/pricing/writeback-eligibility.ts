/**
 * DP-6 writeback eligibility — pure rules, no Prisma, no HTTP.
 *
 * This is the last gate before a LifeSupply price reaches a live storefront.
 * Everything decidable without I/O is decided here so it can be tested
 * exhaustively, and so the same predicate can answer "should the button
 * render?" and "may this write proceed?" without the two drifting apart.
 *
 * The flag and permission gates are NOT here — they need the database and the
 * session — but they are enumerated in REQUIRED_WRITEBACK_FLAGS so the service
 * and the UI copy cannot disagree about what is required.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Every flag that must be ON. `external.writebacks` is the platform-wide gate
 * for any BigCommerce write; `pricing.writebacks` is this feature's own.
 * Requiring both is also what wires DP-6 into the kill switch: tripping it
 * turns both OFF, which stops writes here with no extra check.
 */
export const REQUIRED_WRITEBACK_FLAGS = [
  FEATURE_FLAGS.PRICING_INTELLIGENCE,
  FEATURE_FLAGS.PRICING_WRITEBACKS,
  FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
] as const;

export const WRITEBACK_PERMISSION = PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE;

export type WritebackRefusal =
  | "not_approved"
  | "missing_approver"
  | "expired"
  | "missing_recommended_price"
  | "missing_floor"
  | "missing_cost"
  | "below_floor"
  | "item_missing"
  | "item_blocked"
  | "missing_store"
  | "missing_mapping"
  | "already_written";

export type WritebackVerdict =
  | { allowed: true }
  | { allowed: false; reason: WritebackRefusal; message: string };

const refuse = (reason: WritebackRefusal, message: string): WritebackVerdict => ({
  allowed: false,
  reason,
  message,
});

const positive = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export type WritebackRecommendation = {
  status: string;
  approvedById: string | null;
  approvedAt: Date | null;
  recommendedSalePrice: number | null;
  floorPrice: number | null;
  costPrice: number | null;
  expiresAt: Date | null;
};

export type WritebackItem = {
  status: string;
  blockedReason: string | null;
  storeId: string | null;
} | null;

/** Existing logs for this recommendation, newest first. */
export type ExistingWriteback = { status: string };

export type SourceRef = { sourceSystem: string | null; sourceId: string | null } | null;

/** Where the price lives in BigCommerce. */
export type ResolvedTarget =
  | { scope: "variant"; productId: string; variantId: string }
  | { scope: "product"; productId: string };

const BIGCOMMERCE = "bigcommerce";

const bcId = (ref: SourceRef): string | null => {
  if (!ref) return null;
  if (ref.sourceSystem?.toLowerCase() !== BIGCOMMERCE) return null;
  return ref.sourceId && ref.sourceId.trim() ? ref.sourceId.trim() : null;
};

/**
 * Resolves which BigCommerce record to update.
 *
 * A variant write needs BOTH ids: BigCommerce addresses a variant as
 * /products/{productId}/variants/{variantId}, so a variant with no resolvable
 * parent product id cannot be targeted. Rather than silently falling back to
 * the product — which would reprice every variant of it — that case resolves
 * to null and the write is refused.
 */
export function resolveBigCommerceTarget(args: {
  product: SourceRef;
  variant: SourceRef;
  /** True when the recommendation is scoped to a specific variant. */
  variantScoped: boolean;
}): ResolvedTarget | null {
  const productId = bcId(args.product);
  const variantId = bcId(args.variant);

  if (args.variantScoped || variantId != null) {
    if (variantId == null || productId == null) return null;
    return { scope: "variant", productId, variantId };
  }
  if (productId == null) return null;
  return { scope: "product", productId };
}

/** Human-readable explanation of what is missing, for the refusal message. */
export function describeMissingMapping(args: {
  product: SourceRef;
  variant: SourceRef;
  variantScoped: boolean;
}): string {
  const productId = bcId(args.product);
  const variantId = bcId(args.variant);
  const missing: string[] = [];
  if (productId == null) {
    missing.push("Product.sourceId with sourceSystem 'bigcommerce'");
  }
  if ((args.variantScoped || variantId != null) && variantId == null) {
    missing.push("ProductVariant.sourceId with sourceSystem 'bigcommerce'");
  }
  if (missing.length === 0) {
    missing.push("a resolvable BigCommerce product or variant reference");
  }
  return (
    "No BigCommerce mapping for this item. Missing: " +
    missing.join(" and ") +
    ". Run a BigCommerce product sync so the local record carries its source id."
  );
}

export function isExpired(recommendation: { expiresAt: Date | null }, now: Date): boolean {
  return recommendation.expiresAt != null && recommendation.expiresAt <= now;
}

/** A writeback that already landed. Re-writing one is refused. */
export function hasSuccessfulWriteback(logs: readonly ExistingWriteback[]): boolean {
  return logs.some((log) => log.status === "succeeded");
}

/**
 * Whether this recommendation may be written to BigCommerce.
 *
 * Order matters: approval state first, then freshness, then the price
 * arithmetic, then the mapping. Each failure stops here rather than being
 * collected, because the first thing wrong is the thing the operator must fix.
 */
export function canWriteBack(args: {
  recommendation: WritebackRecommendation;
  item: WritebackItem;
  existingLogs: readonly ExistingWriteback[];
  target: ResolvedTarget | null;
  missingMappingMessage?: string;
  now: Date;
}): WritebackVerdict {
  const { recommendation, item, existingLogs, target, now } = args;

  if (recommendation.status !== "approved") {
    return refuse(
      "not_approved",
      "Only an approved recommendation can be written to BigCommerce; this one is " +
        recommendation.status +
        ".",
    );
  }
  // Belt and braces on the approval columns themselves. A row reading
  // "approved" with no approver is a data fault, and this is not the place to
  // give it the benefit of the doubt.
  if (!recommendation.approvedById || !recommendation.approvedAt) {
    return refuse(
      "missing_approver",
      "This recommendation is marked approved but records no approver or approval time.",
    );
  }

  if (hasSuccessfulWriteback(existingLogs)) {
    return refuse(
      "already_written",
      "A successful writeback already exists for this recommendation. Generate a new recommendation rather than writing this one twice.",
    );
  }

  if (isExpired(recommendation, now)) {
    return refuse(
      "expired",
      "This recommendation's evidence has expired. Re-check competitors and generate a fresh recommendation before writing a price.",
    );
  }

  if (item == null) {
    return refuse("item_missing", "The pricing run item behind this recommendation is gone.");
  }
  if (item.status === "blocked" || item.blockedReason != null) {
    return refuse(
      "item_blocked",
      "The pricing run item is blocked" +
        (item.blockedReason ? " (" + item.blockedReason + ")" : "") +
        "; resolve that before writing its price.",
    );
  }
  if (!item.storeId) {
    return refuse(
      "missing_store",
      "The pricing run item has no store, so there is nowhere to write.",
    );
  }

  if (!positive(recommendation.recommendedSalePrice)) {
    return refuse("missing_recommended_price", "This recommendation has no price to write.");
  }
  if (!positive(recommendation.costPrice)) {
    return refuse(
      "missing_cost",
      "No cost price is recorded, so the margin behind this price cannot be verified.",
    );
  }
  if (!positive(recommendation.floorPrice)) {
    return refuse(
      "missing_floor",
      "No floor price is recorded, so this price cannot be checked against a floor.",
    );
  }
  // Re-checked at the door, not trusted from approval time. This is the last
  // moment a below-floor price can be stopped.
  if (recommendation.recommendedSalePrice < recommendation.floorPrice) {
    return refuse(
      "below_floor",
      "The price of $" +
        recommendation.recommendedSalePrice.toFixed(2) +
        " is below the $" +
        recommendation.floorPrice.toFixed(2) +
        " floor and will not be written.",
    );
  }

  if (target == null) {
    return refuse(
      "missing_mapping",
      args.missingMappingMessage ?? "No BigCommerce product or variant reference for this item.",
    );
  }

  return { allowed: true };
}

/**
 * Whether the writeback panel should render.
 *
 * Permission plus the full eligibility check — the same predicate the service
 * enforces, so the page never offers a button the action would refuse. Flags
 * are checked by the service, not here: a flag being off is a temporary
 * platform state, and the panel should still appear to explain why the write
 * is unavailable rather than vanishing without explanation.
 */
export function canUserWriteBack(user: { permissions: string[] } | null | undefined): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(WRITEBACK_PERMISSION);
}
