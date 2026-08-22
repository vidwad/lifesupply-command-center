/**
 * DP-6B rollback READ-ONLY helpers.
 *
 * Keeps the DP-6A boundary: a page render must never load rollback.ts, which
 * holds the BigCommerce write client two imports down. Everything here is a
 * pure computation over rows the page already has.
 *
 * Nothing in this file imports the BigCommerce client, the write service, or
 * the rollback service, and a canary enforces that.
 */
import {
  canRollBackBeforeRead,
  canUserRollBack,
  selectPriorSalePrice,
  type PriorSalePrice,
  type RollbackVerdict,
  type WritebackLogLike,
} from "./rollback-eligibility";

const num = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Narrows a Prisma PriceWritebackLog row to what the rules need. */
export function toLogLike(row: {
  status: string;
  rollbackAt: Date | null;
  rollbackPayload: unknown;
  sourceSystem: string | null;
  sourceProductId: string | null;
  sourceVariantId: string | null;
  oldSalePrice: unknown;
  newSalePrice: unknown;
}): WritebackLogLike {
  return {
    status: row.status,
    rollbackAt: row.rollbackAt,
    rollbackPayload: row.rollbackPayload,
    sourceSystem: row.sourceSystem,
    sourceProductId: row.sourceProductId,
    sourceVariantId: row.sourceVariantId,
    oldSalePrice: num(row.oldSalePrice),
    newSalePrice: num(row.newSalePrice),
  };
}

/**
 * Whether to offer a rollback control for one log, and why not if not.
 *
 * Deliberately stops short of the live-price check: that needs a BigCommerce
 * request, and a page render must not make one. A rollback the store price has
 * since moved away from will therefore still show a button, and the service
 * will refuse it with the mismatch explanation. Offering-then-refusing is the
 * right trade here — the alternative is an outbound request per log on every
 * page view.
 */
export function rollbackAvailability(args: {
  log: WritebackLogLike;
  recommendationStatus: string | null;
  user: { permissions: string[] } | null | undefined;
}): { canOffer: boolean; reason: string | null } {
  if (!canUserRollBack(args.user)) {
    return { canOffer: false, reason: null };
  }
  const verdict: RollbackVerdict = canRollBackBeforeRead({
    log: args.log,
    recommendation:
      args.recommendationStatus == null ? null : { status: args.recommendationStatus },
  });
  return verdict.allowed
    ? { canOffer: true, reason: null }
    : { canOffer: false, reason: verdict.message };
}

/** The prior price a rollback would restore, for display before acting. */
export function priorSalePriceFor(log: WritebackLogLike): PriorSalePrice {
  return selectPriorSalePrice(log);
}

export type WritebackState =
  | "rolled_back"
  | "written_back"
  | "writeback_failed"
  | "no_writeback_attempted";

/**
 * One-word state for the queue.
 *
 * Ordered most-recent-decisive-first: a rolled-back log describes the current
 * store state more accurately than the succeeded write that preceded it.
 */
export function writebackState(logs: readonly { status: string }[]): WritebackState {
  if (logs.some((log) => log.status === "rolled_back")) return "rolled_back";
  if (logs.some((log) => log.status === "succeeded")) return "written_back";
  if (logs.some((log) => log.status === "failed")) return "writeback_failed";
  return "no_writeback_attempted";
}
