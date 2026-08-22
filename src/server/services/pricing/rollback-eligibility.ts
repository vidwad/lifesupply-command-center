/**
 * DP-6B rollback eligibility — pure rules, no Prisma, no HTTP.
 *
 * Rolling back is itself a live price change, so it is gated exactly as hard as
 * the write that preceded it. Same three flags, same permission, same
 * one-record-per-explicit-action shape.
 *
 * The rule that matters most here is the mismatch check. Rollback restores a
 * price recorded at DP-6 write time; if the store price has moved since, that
 * movement was somebody or something else's decision, and quietly overwriting
 * it would make rollback a way to clobber a change nobody reviewed. DP-6B
 * refuses by default in that case and says so.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";

/** Same gates as the forward write — a rollback is not a lesser action. */
export const REQUIRED_ROLLBACK_FLAGS = [
  FEATURE_FLAGS.PRICING_INTELLIGENCE,
  FEATURE_FLAGS.PRICING_WRITEBACKS,
  FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
] as const;

export const ROLLBACK_PERMISSION = PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE;

/**
 * Whether the integration can clear a sale price back to "no sale price".
 *
 * FALSE, deliberately. `writeBigCommerceSalePrice` refuses a non-positive
 * price, and BigCommerce's semantics for clearing `sale_price` (null vs 0 vs
 * omission) have never been exercised against a real store from this codebase.
 * Guessing here would mean either writing 0 — a real price of zero — or sending
 * a null whose effect is unverified, onto a live storefront. So a rollback
 * whose prior state was "no sale price" refuses and says why.
 *
 * Flipping this to true requires a verified clearing path in the client AND an
 * observed round-trip against a real store, not a docs reading.
 */
export const CLEARING_SALE_PRICE_SUPPORTED = false;

/** How much drift between the written price and the live price is tolerated. */
export const PRICE_MATCH_TOLERANCE = 0.005;

export type RollbackRefusal =
  | "not_succeeded"
  | "already_rolled_back"
  | "missing_rollback_evidence"
  | "wrong_source_system"
  | "missing_source_product"
  | "missing_variant_target"
  | "missing_written_price"
  | "missing_prior_price"
  | "null_prior_price_unsupported"
  | "recommendation_missing"
  | "recommendation_not_written_back"
  | "store_price_changed";

export type RollbackVerdict =
  | { allowed: true; target: RollbackTarget; salePrice: number }
  | { allowed: false; reason: RollbackRefusal; message: string };

const refuse = (reason: RollbackRefusal, message: string): RollbackVerdict => ({
  allowed: false,
  reason,
  message,
});

export type RollbackTarget =
  | { scope: "variant"; productId: string; variantId: string }
  | { scope: "product"; productId: string };

export type WritebackLogLike = {
  status: string;
  rollbackAt: Date | null;
  rollbackPayload: unknown;
  sourceSystem: string | null;
  sourceProductId: string | null;
  sourceVariantId: string | null;
  oldSalePrice: number | null;
  newSalePrice: number | null;
};

export type RollbackRecommendationLike = { status: string } | null;

const positive = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/** The recorded pre-write state. `null_price` means "there was no sale price". */
export type PriorSalePrice =
  | { kind: "value"; salePrice: number }
  | { kind: "null_price" }
  | { kind: "unavailable" };

function liveBeforeSalePrice(payload: unknown): { present: boolean; value: number | null } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { present: false, value: null };
  }
  const liveBefore = (payload as Record<string, unknown>).liveBefore;
  if (!liveBefore || typeof liveBefore !== "object" || Array.isArray(liveBefore)) {
    return { present: false, value: null };
  }
  const record = liveBefore as Record<string, unknown>;
  // The key must EXIST for a recorded null to count as evidence. An absent key
  // means we never captured it, which is not the same as "there was no sale
  // price" — and treating the two alike would clear a price on no evidence.
  if (!("salePrice" in record)) return { present: false, value: null };
  const raw = record.salePrice;
  if (raw == null) return { present: true, value: null };
  const parsed = Number(raw);
  return Number.isFinite(parsed)
    ? { present: true, value: parsed }
    : { present: false, value: null };
}

/**
 * Picks the price to restore, in the order the product owner specified:
 * the live pre-write reading first, then the stored column, then nothing.
 *
 * The live reading wins because it is what the store actually held immediately
 * before DP-6 changed it; `oldSalePrice` can fall back to a local mirror that
 * may have lagged.
 */
export function selectPriorSalePrice(log: WritebackLogLike): PriorSalePrice {
  const live = liveBeforeSalePrice(log.rollbackPayload);
  if (live.present) {
    return live.value == null ? { kind: "null_price" } : { kind: "value", salePrice: live.value };
  }
  if (log.oldSalePrice != null && Number.isFinite(log.oldSalePrice)) {
    return { kind: "value", salePrice: log.oldSalePrice };
  }
  return { kind: "unavailable" };
}

/** Resolves the endpoint, preserving variant scope exactly. */
export function resolveRollbackTarget(log: WritebackLogLike): RollbackTarget | null {
  const productId = log.sourceProductId?.trim();
  if (!productId) return null;
  const variantId = log.sourceVariantId?.trim();
  // A log written against a variant must roll back that variant. Falling back
  // to the product endpoint would reprice every variant of it.
  if (log.sourceVariantId != null) {
    if (!variantId) return null;
    return { scope: "variant", productId, variantId };
  }
  return { scope: "product", productId };
}

/** True when the live price still equals what DP-6 wrote. */
export function livePriceMatchesWritten(
  liveSalePrice: number | null,
  writtenSalePrice: number,
): boolean {
  if (liveSalePrice == null) return false;
  return Math.abs(liveSalePrice - writtenSalePrice) <= PRICE_MATCH_TOLERANCE;
}

/**
 * Everything decidable before contacting the store.
 *
 * Split from the live-price check so the UI can explain why a rollback button
 * is missing without making a BigCommerce request during a page render.
 */
export function canRollBackBeforeRead(args: {
  log: WritebackLogLike;
  recommendation: RollbackRecommendationLike;
}): RollbackVerdict {
  const { log, recommendation } = args;

  if (log.status !== "succeeded") {
    return refuse(
      "not_succeeded",
      log.status === "rolled_back"
        ? "This writeback has already been rolled back."
        : "Only a successful writeback can be rolled back; this one is " + log.status + ".",
    );
  }
  if (log.rollbackAt != null) {
    return refuse("already_rolled_back", "This writeback has already been rolled back.");
  }
  if (!log.rollbackPayload) {
    return refuse(
      "missing_rollback_evidence",
      "This writeback recorded no rollback evidence, so there is no prior price to restore.",
    );
  }
  if ((log.sourceSystem ?? "").toLowerCase() !== "bigcommerce") {
    return refuse(
      "wrong_source_system",
      "This writeback was not made against BigCommerce, so it cannot be rolled back here.",
    );
  }
  if (!log.sourceProductId?.trim()) {
    return refuse(
      "missing_source_product",
      "The writeback log records no BigCommerce product id, so the rollback has no target.",
    );
  }
  if (log.sourceVariantId != null && !log.sourceVariantId.trim()) {
    return refuse(
      "missing_variant_target",
      "The writeback log is variant-scoped but records no variant id. Refusing rather than repricing the whole product.",
    );
  }
  if (!positive(log.newSalePrice)) {
    return refuse(
      "missing_written_price",
      "The writeback log records no written price, so the store price cannot be checked before rolling back.",
    );
  }

  if (recommendation == null) {
    return refuse("recommendation_missing", "The recommendation behind this writeback is gone.");
  }
  if (recommendation.status !== "written_back") {
    return refuse(
      "recommendation_not_written_back",
      "The recommendation is " + recommendation.status + ", not written_back.",
    );
  }

  const target = resolveRollbackTarget(log);
  if (target == null) {
    return refuse(
      "missing_source_product",
      "Could not resolve a BigCommerce target from the writeback log.",
    );
  }

  const prior = selectPriorSalePrice(log);
  if (prior.kind === "unavailable") {
    return refuse(
      "missing_prior_price",
      "No prior sale price was recorded, so there is nothing to restore.",
    );
  }
  if (prior.kind === "null_price") {
    // Documented limitation, not an oversight. See CLEARING_SALE_PRICE_SUPPORTED.
    if (!CLEARING_SALE_PRICE_SUPPORTED) {
      return refuse(
        "null_prior_price_unsupported",
        "This product had no sale price before the writeback, and clearing a sale price is not " +
          "supported by this integration yet. Clear it manually in BigCommerce; do not let the " +
          "system guess between null and $0.00.",
      );
    }
    return refuse(
      "null_prior_price_unsupported",
      "Clearing a sale price is not implemented on this path.",
    );
  }
  if (!positive(prior.salePrice)) {
    return refuse(
      "missing_prior_price",
      "The recorded prior sale price of " +
        String(prior.salePrice) +
        " is not a price this path will write. Restore it manually in BigCommerce.",
    );
  }

  return { allowed: true, target, salePrice: prior.salePrice };
}

/**
 * The final gate, applied after the pre-rollback store read.
 *
 * Refusing on mismatch is the default and DP-6B offers no override. A price
 * that moved since the writeback moved for a reason this system does not know,
 * and rollback must not become a way to silently revert somebody else's change.
 */
export function canRollBackAfterRead(args: {
  log: WritebackLogLike;
  liveSalePrice: number | null;
}): RollbackVerdict | { allowed: true } {
  const written = args.log.newSalePrice;
  if (!positive(written)) {
    return refuse("missing_written_price", "The writeback log records no written price.");
  }
  if (!livePriceMatchesWritten(args.liveSalePrice, written)) {
    return refuse(
      "store_price_changed",
      "The BigCommerce sale price is now " +
        (args.liveSalePrice == null ? "unset" : "$" + args.liveSalePrice.toFixed(2)) +
        ", not the $" +
        written.toFixed(2) +
        " this writeback set. The store price has changed since, so rolling back would overwrite " +
        "a later change. Refusing.",
    );
  }
  return { allowed: true };
}

export function canUserRollBack(user: { permissions: string[] } | null | undefined): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(ROLLBACK_PERMISSION);
}
