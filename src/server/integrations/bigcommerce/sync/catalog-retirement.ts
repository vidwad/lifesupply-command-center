/**
 * Which synced products a full catalogue walk shows the store no longer
 * lists, and whether the walk is trustworthy enough to act on it (2026-11-11).
 *
 * The catalogue sync only ever upserted. A listing deleted in BigCommerce
 * therefore stayed in the Command Center as a live product, and seventeen
 * Product Studio projects over two weeks reached the publish step with a
 * BigCommerce id the store answered 404 to. These rules are pure so they can
 * be tested without a database or a store.
 *
 * The guard matters more than the arithmetic. A walk that stopped early (a
 * mid-walk 404, a page that failed to parse) would make every product after
 * the stop look absent; and a store whose total the walk did not reach would
 * do the same. Both refuse. So does a result that would retire more than a
 * fifth of the store's live products: no clean-up removes a fifth of a
 * catalogue in one go, so a share that large means the walk, the
 * credentials or the store mapping is wrong, and the operator must look.
 */

/** The largest share of a store's live products one walk may retire. */
export const MAX_RETIREMENT_SHARE = 0.2;

export type WalkOutcome = {
  /** The sync mode; only a full walk sees the whole catalogue. */
  mode: "full" | "incremental";
  /** True only when the walk ended on a short or empty page, never on an error. */
  walkComplete: boolean;
  /** Products the walk returned. */
  scanned: number;
  /** The store's own total from the first page's `meta.pagination.total`, when it gave one. */
  storeTotal: number | null;
};

export type RetirementDecision =
  | { retire: true; count: number }
  | { retire: false; reason: string; count: number };

/**
 * The live products the walk did not return. `live` is every non-retired
 * BigCommerce product of the store; `seen` the BigCommerce ids the walk
 * returned, as text, whether or not their upsert succeeded.
 */
export function absentProducts<T extends { sourceId: string | null }>(
  live: readonly T[],
  seen: ReadonlySet<string>,
): T[] {
  return live.filter((product) => product.sourceId != null && !seen.has(product.sourceId));
}

/** Whether the absent products may be retired, and if not, why not. */
export function retirementDecision(args: {
  walk: WalkOutcome;
  liveCount: number;
  absentCount: number;
}): RetirementDecision {
  const { walk, liveCount, absentCount } = args;
  const refuse = (reason: string): RetirementDecision => ({
    retire: false,
    reason,
    count: absentCount,
  });
  if (walk.mode !== "full") {
    return refuse("Only a full catalogue walk sees every listing; an incremental walk cannot.");
  }
  if (!walk.walkComplete) {
    return refuse("The walk stopped before the last page, so absence proves nothing.");
  }
  if (walk.scanned === 0) {
    return refuse("The walk returned no products; an empty store is not believed.");
  }
  if (walk.storeTotal != null && walk.scanned < walk.storeTotal) {
    return refuse(
      `The walk returned ${walk.scanned} products but the store reports ${walk.storeTotal}.`,
    );
  }
  if (absentCount === 0) return { retire: true, count: 0 };
  if (liveCount > 0 && absentCount / liveCount > MAX_RETIREMENT_SHARE) {
    return refuse(
      `${absentCount} of ${liveCount} live products are absent, more than ${Math.round(
        MAX_RETIREMENT_SHARE * 100,
      )}%; refusing to retire them until a person has looked.`,
    );
  }
  return { retire: true, count: absentCount };
}
