/**
 * Comparison rules between supplier-portal captures and Command Center
 * records (Phase 7 — docs/19 §7, thresholds from docs/10 §8.2).
 *
 * Pure module — no I/O — so the tolerance bands are pinned by unit tests
 * and reviewers can reason about verdicts without a database.
 *
 * Verdict ladder:
 *   ok       → within tolerance; log only.
 *   warn     → drifted (price 2–5%); flagged on the run, medium exception.
 *   mismatch → beyond tolerance / contradictory; high-severity exception.
 *   unknown  → not comparable (missing data on either side); flagged so the
 *              gap is visible, but no exception is raised for it.
 */

export type ComparisonVerdict = "ok" | "warn" | "mismatch" | "unknown";

export type ComparisonFlag = {
  rule: "price" | "stock" | "sku";
  verdict: ComparisonVerdict;
  detail: string;
  /** Structured values for the run record / exception metadata. */
  expected: string | number | null;
  captured: string | number | null;
};

/** docs/10 §8.2 — 0–2% accept, 2–5% warn, >5% manual review. */
export const PRICE_WARN_PCT = 0.02;
export const PRICE_MISMATCH_PCT = 0.05;
/** Ignore sub-cent noise from currency formatting round-trips. */
export const PRICE_ABS_FLOOR = 0.01;

export function comparePrice(args: {
  /** Price captured from the supplier portal. */
  portalPrice: number | null;
  /** Expected cost from the SupplierProduct mapping. */
  expectedCost: number | null;
}): ComparisonFlag {
  const { portalPrice, expectedCost } = args;
  if (portalPrice == null || expectedCost == null || expectedCost <= 0) {
    return {
      rule: "price",
      verdict: "unknown",
      detail:
        portalPrice == null
          ? "Portal price could not be captured."
          : "No expected cost on the supplier mapping to compare against.",
      expected: expectedCost,
      captured: portalPrice,
    };
  }

  const diff = Math.abs(portalPrice - expectedCost);
  const pct = diff / expectedCost;
  const pctLabel = `${(pct * 100).toFixed(2)}%`;

  if (diff < PRICE_ABS_FLOOR || pct <= PRICE_WARN_PCT) {
    return {
      rule: "price",
      verdict: "ok",
      detail: `Portal price ${portalPrice.toFixed(2)} within ${(PRICE_WARN_PCT * 100).toFixed(0)}% of expected ${expectedCost.toFixed(2)} (${pctLabel}).`,
      expected: expectedCost,
      captured: portalPrice,
    };
  }
  if (pct <= PRICE_MISMATCH_PCT) {
    return {
      rule: "price",
      verdict: "warn",
      detail: `Portal price ${portalPrice.toFixed(2)} drifted ${pctLabel} from expected ${expectedCost.toFixed(2)} (warn band ${(PRICE_WARN_PCT * 100).toFixed(0)}–${(PRICE_MISMATCH_PCT * 100).toFixed(0)}%).`,
      expected: expectedCost,
      captured: portalPrice,
    };
  }
  return {
    rule: "price",
    verdict: "mismatch",
    detail: `Portal price ${portalPrice.toFixed(2)} differs ${pctLabel} from expected ${expectedCost.toFixed(2)} (> ${(PRICE_MISMATCH_PCT * 100).toFixed(0)}% requires manual review).`,
    expected: expectedCost,
    captured: portalPrice,
  };
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "unknown";

/**
 * Normalize free-text portal stock strings ("In Stock", "Out of stock",
 * "Backordered", "3 units", "Low — 2 left") into a comparable status.
 */
export function normalizeStockText(raw: string | null | undefined): StockStatus {
  if (!raw) return "unknown";
  const text = raw.trim().toLowerCase();
  if (/(out\s*of\s*stock|unavailable|backorder|discontinued|sold\s*out|no\s*stock)/.test(text)) {
    return "out_of_stock";
  }
  const qty = /(\d+)\s*(units?|left|available|in\s*stock)?/.exec(text);
  if (/low/.test(text)) return "low_stock";
  if (qty?.[1] != null) {
    const n = Number(qty[1]);
    if (n === 0) return "out_of_stock";
    return n <= 5 ? "low_stock" : "in_stock";
  }
  if (/(in\s*stock|available|yes)/.test(text)) return "in_stock";
  return "unknown";
}

/** Map the SupplierProduct.availabilityStatus values to the same scale. */
export function normalizeAvailabilityStatus(raw: string | null | undefined): StockStatus {
  switch (raw) {
    case "in_stock":
      return "in_stock";
    case "low_stock":
      return "low_stock";
    case "out_of_stock":
    case "discontinued":
      return "out_of_stock";
    default:
      return "unknown";
  }
}

export function compareStock(args: {
  portalStockText: string | null;
  expectedAvailability: string | null;
}): ComparisonFlag {
  const captured = normalizeStockText(args.portalStockText);
  const expected = normalizeAvailabilityStatus(args.expectedAvailability);

  if (captured === "unknown" || expected === "unknown") {
    return {
      rule: "stock",
      verdict: "unknown",
      detail:
        captured === "unknown"
          ? `Portal stock text ${args.portalStockText ? `"${args.portalStockText}"` : "(none)"} could not be classified.`
          : "Supplier mapping has no recorded availability to compare against.",
      expected: args.expectedAvailability,
      captured: args.portalStockText,
    };
  }
  if (captured === expected) {
    return {
      rule: "stock",
      verdict: "ok",
      detail: `Portal stock (${captured}) matches recorded availability.`,
      expected,
      captured,
    };
  }
  // Out-of-stock on either side when the other says sellable is the
  // operationally dangerous case; low-vs-in drift is a warning.
  const contradiction = captured === "out_of_stock" || expected === "out_of_stock";
  return {
    rule: "stock",
    verdict: contradiction ? "mismatch" : "warn",
    detail: `Portal stock is ${captured.replace(/_/g, " ")} but Command Center records ${expected.replace(/_/g, " ")}.`,
    expected,
    captured,
  };
}

export function compareSku(args: {
  found: boolean;
  supplierSku: string;
  portalName: string | null;
  mappedProductName: string | null;
}): ComparisonFlag {
  if (!args.found) {
    return {
      rule: "sku",
      verdict: "mismatch",
      detail: `SKU ${args.supplierSku} was not found in the supplier portal.`,
      expected: args.mappedProductName,
      captured: null,
    };
  }
  if (!args.portalName || !args.mappedProductName) {
    return {
      rule: "sku",
      verdict: "ok",
      detail: `SKU ${args.supplierSku} found in the portal${args.portalName ? ` as "${args.portalName}"` : ""}. No product-name comparison available.`,
      expected: args.mappedProductName,
      captured: args.portalName,
    };
  }
  const a = args.portalName.trim().toLowerCase();
  const b = args.mappedProductName.trim().toLowerCase();
  const related = a.includes(b) || b.includes(a) || sharedWordCount(a, b) >= 2;
  return {
    rule: "sku",
    verdict: related ? "ok" : "warn",
    detail: related
      ? `SKU ${args.supplierSku} found; portal name matches the mapped product.`
      : `SKU ${args.supplierSku} found, but portal name "${args.portalName}" does not resemble mapped product "${args.mappedProductName}" — verify the mapping.`,
    expected: args.mappedProductName,
    captured: args.portalName,
  };
}

function sharedWordCount(a: string, b: string): number {
  const stop = new Set(["the", "a", "an", "of", "and", "for", "with"]);
  const wordsA = new Set(a.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !stop.has(w)));
  let shared = 0;
  for (const w of b.split(/[^a-z0-9]+/)) {
    if (wordsA.has(w)) shared++;
  }
  return shared;
}

/**
 * Evaluate every applicable rule for one lookup. `workflow` decides which
 * rules apply: a price check compares price + sku, a stock check compares
 * stock + sku, a sku check compares sku only (plus reports whatever the
 * portal showed for context).
 */
export function evaluateSupplierCheck(args: {
  workflow: "price_check" | "stock_check" | "sku_check";
  found: boolean;
  supplierSku: string;
  portalPrice: number | null;
  portalStockText: string | null;
  portalName: string | null;
  expectedCost: number | null;
  expectedAvailability: string | null;
  mappedProductName: string | null;
}): ComparisonFlag[] {
  const flags: ComparisonFlag[] = [
    compareSku({
      found: args.found,
      supplierSku: args.supplierSku,
      portalName: args.portalName,
      mappedProductName: args.mappedProductName,
    }),
  ];
  if (!args.found) return flags; // nothing else comparable
  if (args.workflow === "price_check") {
    flags.push(comparePrice({ portalPrice: args.portalPrice, expectedCost: args.expectedCost }));
  }
  if (args.workflow === "stock_check") {
    flags.push(
      compareStock({
        portalStockText: args.portalStockText,
        expectedAvailability: args.expectedAvailability,
      }),
    );
  }
  return flags;
}

/** Highest-severity verdict across flags — drives the run status + summary. */
export function worstVerdict(flags: ComparisonFlag[]): ComparisonVerdict {
  const order: ComparisonVerdict[] = ["mismatch", "warn", "unknown", "ok"];
  for (const v of order) if (flags.some((f) => f.verdict === v)) return v;
  return "ok";
}
