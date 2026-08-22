/**
 * DP-4 recommendation engine — pure calculation, no Prisma, no I/O.
 *
 * Given one run item, its competitor observations, and the active rule, decide
 * what to propose and why. Kept free of the database so every guardrail below
 * is unit-testable in isolation:
 *
 *  - a proposal never falls below the item's stored floor;
 *  - stale, low-confidence, and non-valid observations cannot influence price;
 *  - an increase is capped by the rule's maxIncreasePct and must still land
 *    under the cheapest competitor;
 *  - a missing input produces a blocked outcome with a stated reason rather
 *    than a guessed number.
 *
 * Every outcome carries a human-readable `reason`. A price with no explanation
 * is not reviewable, and DP-4's whole output is a review queue.
 */

/** Outcomes. Only `reduce`, `increase`, and `no_change` carry a price. */
export type RecommendationType =
  | "increase"
  | "reduce"
  | "no_change"
  | "blocked_margin_floor"
  | "blocked_missing_cost"
  | "blocked_low_confidence"
  | "blocked_no_valid_observation"
  | "blocked_stale_evidence"
  | "manual_review";

export const PRICED_RECOMMENDATION_TYPES: readonly RecommendationType[] = [
  "increase",
  "reduce",
  "no_change",
];

/**
 * Run statuses that may produce recommendations.
 *
 * `cancelled` and `failed` are excluded: an operator who cancelled a run should
 * not find recommendations appearing from it afterwards.
 */
export const RECOMMENDABLE_RUN_STATUSES = [
  "draft",
  "queued",
  "running",
  "paused",
  "completed",
] as const;

/** Observation statuses whose price may be used. Deliberately just one. */
const USABLE_OBSERVATION_STATUS = "valid";

export type RuleSettings = {
  /** Fallback floor multiplier, used ONLY when the item has no stored floor. */
  minCostMultiplier: number;
  /** Dollars to undercut the cheapest competitor by. */
  undercutAmount: number;
  /** Percentage POINTS, e.g. 10 means 10%. Matches PricingRule storage. */
  maxIncreasePct: number;
  /** Percentage POINTS. See the note on decrease guarding below. */
  maxDecreasePct: number;
  minConfidence: number;
  evidenceFreshnessHours: number;
};

export type ObservationInput = {
  id: string;
  competitorId: string;
  status: string;
  observedEffectivePrice: number | null;
  currency: string | null;
  matchConfidence: number | null;
  checkedAt: Date | null;
};

export type ItemInput = {
  id: string;
  sku: string;
  status: string;
  blockedReason: string | null;
  costPrice: number | null;
  floorPrice: number | null;
  currentRegularPrice: number | null;
  currentSalePrice: number | null;
  currentEffectivePrice: number | null;
};

export type Recommendation = {
  type: RecommendationType;
  /** Null for every blocked outcome: a blocked item has no proposed price. */
  recommendedSalePrice: number | null;
  lowestCompetitorPrice: number | null;
  floorPrice: number | null;
  costPrice: number | null;
  marginBefore: number | null;
  marginAfter: number | null;
  confidence: number | null;
  undercutAmount: number;
  reason: string;
  /** Observations that actually influenced the number, for traceability. */
  usedObservationIds: string[];
  /** Freshness horizon of the driving evidence. */
  expiresAt: Date | null;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10_000) / 10_000;

const positive = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/** Sale price wins when present and positive; mirrors DP-2's effectivePrice. */
export function currentEffective(item: ItemInput): number | null {
  if (positive(item.currentEffectivePrice)) return item.currentEffectivePrice;
  if (positive(item.currentSalePrice)) return item.currentSalePrice;
  if (positive(item.currentRegularPrice)) return item.currentRegularPrice;
  return null;
}

/**
 * Margin as a fraction of selling price, not of cost.
 *
 * Returns null rather than 0 when the price is missing or zero: a divide-by-
 * zero dressed up as "0% margin" would read as a real, terrible margin.
 */
export function margin(price: number | null, cost: number | null): number | null {
  if (!positive(price)) return null;
  if (cost == null || !Number.isFinite(cost)) return null;
  return round4((price - cost) / price);
}

/**
 * Why an observation could not be used. Reported so an operator can tell a
 * competitor that never responds from one whose price simply looks wrong.
 */
export type ObservationRejection =
  | "not_valid_status"
  | "no_price"
  | "currency_mismatch"
  | "stale"
  | "low_confidence";

export type ObservationScreen = {
  usable: ObservationInput[];
  rejected: Record<ObservationRejection, number>;
  /** True when at least one observation was dropped only for being stale. */
  staleOnly: boolean;
  /** True when at least one fresh observation was dropped only for confidence. */
  lowConfidenceOnly: boolean;
};

/**
 * Screens observations in a fixed order so the blocked reason is the FIRST
 * thing that went wrong, not the last check to run. An observation that is
 * both stale and low-confidence reports as stale, which is the actionable one:
 * re-check it and the confidence question may resolve itself.
 */
export function screenObservations(args: {
  observations: readonly ObservationInput[];
  rule: RuleSettings;
  runCurrency: string | null;
  now: Date;
}): ObservationScreen {
  const { observations, rule, runCurrency, now } = args;
  const rejected: Record<ObservationRejection, number> = {
    not_valid_status: 0,
    no_price: 0,
    currency_mismatch: 0,
    stale: 0,
    low_confidence: 0,
  };
  const freshnessMs = Math.max(0, rule.evidenceFreshnessHours) * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - freshnessMs);
  const usable: ObservationInput[] = [];
  let staleOnly = false;
  let lowConfidenceOnly = false;

  for (const observation of observations) {
    if (observation.status !== USABLE_OBSERVATION_STATUS) {
      rejected.not_valid_status += 1;
      continue;
    }
    if (!positive(observation.observedEffectivePrice)) {
      rejected.no_price += 1;
      continue;
    }
    // A null currency is treated as matching: DP-3 records currency only when
    // the page stated one, and refusing every silent page would discard most
    // usable evidence. A STATED and different currency is always refused.
    if (
      observation.currency != null &&
      runCurrency != null &&
      observation.currency.toUpperCase() !== runCurrency.toUpperCase()
    ) {
      rejected.currency_mismatch += 1;
      continue;
    }
    if (observation.checkedAt == null || observation.checkedAt < cutoff) {
      rejected.stale += 1;
      staleOnly = true;
      continue;
    }
    if (observation.matchConfidence == null || observation.matchConfidence < rule.minConfidence) {
      rejected.low_confidence += 1;
      lowConfidenceOnly = true;
      continue;
    }
    usable.push(observation);
  }

  return { usable, rejected, staleOnly, lowConfidenceOnly };
}

/** The cheapest usable observation. Ties resolve to the more confident one. */
export function lowestUsable(usable: readonly ObservationInput[]): ObservationInput | null {
  let best: ObservationInput | null = null;
  for (const observation of usable) {
    if (best == null) {
      best = observation;
      continue;
    }
    const price = observation.observedEffectivePrice as number;
    const bestPrice = best.observedEffectivePrice as number;
    if (price < bestPrice) best = observation;
    else if (
      price === bestPrice &&
      (observation.matchConfidence ?? 0) > (best.matchConfidence ?? 0)
    ) {
      best = observation;
    }
  }
  return best;
}

function blocked(
  type: RecommendationType,
  reason: string,
  partial: Partial<Recommendation> = {},
): Recommendation {
  return {
    type,
    recommendedSalePrice: null,
    lowestCompetitorPrice: null,
    floorPrice: null,
    costPrice: null,
    marginBefore: null,
    marginAfter: null,
    confidence: null,
    undercutAmount: 0,
    reason,
    usedObservationIds: [],
    expiresAt: null,
    ...partial,
  };
}

/**
 * Decides what to propose for one item.
 *
 * The order of the guards is the contract: cost, then floor, then a current
 * price, then evidence. Each one that fails stops the calculation rather than
 * substituting a default, because every default here would be a number a human
 * might later act on.
 */
export function calculateRecommendation(args: {
  item: ItemInput;
  observations: readonly ObservationInput[];
  rule: RuleSettings;
  runStatus: string;
  runCurrency?: string | null;
  now?: Date;
}): Recommendation {
  const { item, observations, rule, runStatus } = args;
  const now = args.now ?? new Date();
  const runCurrency = args.runCurrency ?? null;

  if (!(RECOMMENDABLE_RUN_STATUSES as readonly string[]).includes(runStatus)) {
    return blocked(
      "manual_review",
      "Run status is " +
        runStatus +
        "; recommendations are generated only for " +
        RECOMMENDABLE_RUN_STATUSES.join(", ") +
        " runs.",
    );
  }

  if (item.status === "blocked" || item.blockedReason != null) {
    return blocked(
      "manual_review",
      "Item is blocked" +
        (item.blockedReason ? " (" + item.blockedReason + ")" : "") +
        "; resolve the block before pricing it.",
    );
  }

  const cost = positive(item.costPrice) ? item.costPrice : null;
  if (cost == null) {
    return blocked(
      "blocked_missing_cost",
      "No cost price, so no floor can be defended and no margin can be stated.",
    );
  }

  // DP-2 snapshots the floor at run creation on purpose: recomputing it here
  // from a rule someone edited mid-run would silently move the guardrail the
  // list was built against. The fallback exists only for older rows.
  let floor: number | null = positive(item.floorPrice) ? item.floorPrice : null;
  let floorNote = "";
  if (floor == null) {
    const fallback =
      Number.isFinite(rule.minCostMultiplier) && rule.minCostMultiplier > 0
        ? round2(cost * rule.minCostMultiplier)
        : null;
    if (fallback == null) {
      return blocked(
        "manual_review",
        "No floor stored on the run item and no usable cost multiplier to derive one.",
        { costPrice: cost },
      );
    }
    floor = fallback;
    floorNote =
      " Floor was not stored on this run item, so it was derived as cost x " +
      String(rule.minCostMultiplier) +
      " = $" +
      floor.toFixed(2) +
      ".";
  }

  const current = currentEffective(item);
  if (current == null) {
    return blocked(
      "manual_review",
      "No current effective price, so there is nothing to compare a competitor price against." +
        floorNote,
      { costPrice: cost, floorPrice: floor },
    );
  }

  const screen = screenObservations({ observations, rule, runCurrency, now });
  if (screen.usable.length === 0) {
    const detail =
      " Screened " +
      String(observations.length) +
      " observation(s): " +
      Object.entries(screen.rejected)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => String(count) + " " + key)
        .join(", ") +
      ".";

    if (screen.staleOnly) {
      return blocked(
        "blocked_stale_evidence",
        "No competitor observation is fresh enough (limit " +
          String(rule.evidenceFreshnessHours) +
          "h). Re-run a competitor check before pricing this item." +
          detail +
          floorNote,
        { costPrice: cost, floorPrice: floor, marginBefore: margin(current, cost) },
      );
    }
    if (screen.lowConfidenceOnly) {
      return blocked(
        "blocked_low_confidence",
        "Every fresh observation is below the required match confidence of " +
          String(rule.minConfidence) +
          ". Verify the competitor URL mapping." +
          detail +
          floorNote,
        { costPrice: cost, floorPrice: floor, marginBefore: margin(current, cost) },
      );
    }
    return blocked(
      "blocked_no_valid_observation",
      "No valid competitor observation with a usable price." + detail + floorNote,
      { costPrice: cost, floorPrice: floor, marginBefore: margin(current, cost) },
    );
  }

  // No Store.currency column exists yet, so `runCurrency` is usually null and
  // the per-observation currency screen above cannot fire. This catches the
  // unsafe case that does not need a known base: two competitors quoting in
  // different currencies cannot both be compared to one price.
  const statedCurrencies = new Set(
    screen.usable
      .map((observation) => observation.currency?.toUpperCase())
      .filter((currency): currency is string => currency != null),
  );
  if (statedCurrencies.size > 1) {
    return blocked(
      "manual_review",
      "Observations quote more than one currency (" +
        [...statedCurrencies].sort().join(", ") +
        "), so the cheapest competitor cannot be determined safely." +
        floorNote,
      { costPrice: cost, floorPrice: floor, marginBefore: margin(current, cost) },
    );
  }

  const driver = lowestUsable(screen.usable);
  const lowest = driver?.observedEffectivePrice as number;
  const confidence = driver?.matchConfidence ?? null;
  const usedObservationIds = screen.usable.map((observation) => observation.id);
  const expiresAt =
    driver?.checkedAt != null
      ? new Date(driver.checkedAt.getTime() + rule.evidenceFreshnessHours * 60 * 60 * 1000)
      : null;
  const undercut = Number.isFinite(rule.undercutAmount) ? Math.max(0, rule.undercutAmount) : 0;
  const target = round2(lowest - undercut);
  const marginBefore = margin(current, cost);

  const base = {
    lowestCompetitorPrice: lowest,
    floorPrice: floor,
    costPrice: cost,
    marginBefore,
    confidence,
    undercutAmount: undercut,
    usedObservationIds,
    expiresAt,
  };

  const evidence =
    " Based on " +
    String(screen.usable.length) +
    " fresh observation(s); cheapest competitor $" +
    lowest.toFixed(2) +
    " at confidence " +
    (confidence == null ? "unknown" : confidence.toFixed(3)) +
    ".";

  // ---- We are more expensive than the cheapest competitor: consider a cut ---
  if (current > lowest) {
    if (target < floor) {
      return blocked(
        "blocked_margin_floor",
        "Undercutting to $" +
          target.toFixed(2) +
          " would break the $" +
          floor.toFixed(2) +
          " floor. Holding at $" +
          current.toFixed(2) +
          " instead." +
          evidence +
          floorNote,
        { ...base, marginAfter: null },
      );
    }

    // maxDecreasePct annotates rather than blocks. The floor is the real rail
    // on a cut, and DP-4's spec is explicit that a target at or above the floor
    // becomes a reduce; turning a large drop into a block would withhold the
    // very rows a reviewer most needs to see. Every row needs approval anyway,
    // so the useful thing is to say the drop is unusually large.
    const maxDrop = round2(current * (1 - rule.maxDecreasePct / 100));
    const dropNote =
      Number.isFinite(rule.maxDecreasePct) && rule.maxDecreasePct > 0 && target < maxDrop
        ? " NOTE: this is a drop of more than the " +
          String(rule.maxDecreasePct) +
          "% guideline — confirm the competitor match before approving."
        : "";

    return {
      type: "reduce",
      recommendedSalePrice: target,
      marginAfter: margin(target, cost),
      reason:
        "Reduce from $" +
        current.toFixed(2) +
        " to $" +
        target.toFixed(2) +
        " to undercut the cheapest competitor by $" +
        undercut.toFixed(2) +
        ", holding above the $" +
        floor.toFixed(2) +
        " floor." +
        dropNote +
        evidence +
        floorNote,
      ...base,
    };
  }

  // ---- We are already at or below the cheapest competitor: consider a rise --
  const cap = round2(current * (1 + rule.maxIncreasePct / 100));
  let proposed = target;
  let capNote = "";
  if (proposed > cap) {
    // The spec asks that a capped value be used "only if it remains below the
    // lowest competitor". Inside this branch that is guaranteed, not something
    // to test: proposed = lowest - undercut and undercut >= 0, so
    // proposed > cap implies lowest > cap. A cap that reached the competitor
    // would have to be below the target, which contradicts the branch.
    proposed = cap;
    capNote =
      " Capped by the " +
      String(rule.maxIncreasePct) +
      "% maximum increase from $" +
      current.toFixed(2) +
      ".";
  }

  const gain = round2(proposed - current);
  if (proposed <= current || gain < undercut) {
    return {
      type: "no_change",
      recommendedSalePrice: current,
      marginAfter: marginBefore,
      reason:
        "Already at or below the cheapest competitor and the available move of $" +
        gain.toFixed(2) +
        " is smaller than the $" +
        undercut.toFixed(2) +
        " undercut amount, so it is not worth a price change." +
        evidence +
        floorNote,
      ...base,
    };
  }

  if (proposed < floor) {
    return blocked(
      "blocked_margin_floor",
      "The only available price of $" +
        proposed.toFixed(2) +
        " is below the $" +
        floor.toFixed(2) +
        " floor." +
        evidence +
        floorNote,
      { ...base, marginAfter: null },
    );
  }

  return {
    type: "increase",
    recommendedSalePrice: proposed,
    marginAfter: margin(proposed, cost),
    reason:
      "Increase from $" +
      current.toFixed(2) +
      " to $" +
      proposed.toFixed(2) +
      ", staying below the cheapest competitor at $" +
      lowest.toFixed(2) +
      "." +
      capNote +
      evidence +
      floorNote,
    ...base,
  };
}
