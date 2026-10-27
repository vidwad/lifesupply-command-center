/**
 * The store's own listed price against the researched market range
 * (product owner, 2026-10-26). Pure, for the project page and the report.
 *
 * Price and cost come from the linked catalogue product as the products
 * list reads them: the primary variant's price, and its cost or the preferred
 * supplier's cost, where a zero cost means "not known", never "free". The
 * comparison is made only when the store price is in the market currency.
 */

export type StorePriceInput = {
  storeName: string | null;
  currency: string | null;
  price: number | null;
  cost: number | null;
  market: {
    currency: string;
    low: number | null;
    high: number | null;
    median: number | null;
    observations: readonly { price: number; currency: string }[];
  };
};

export type StorePriceContext = {
  storeName: string | null;
  currency: string;
  price: number;
  cost: number | null;
  /** Gross margin on the listed price, 0..1, when the cost is known. */
  margin: number | null;
  /** Where the listed price sits against the researched range. */
  position: "below" | "within" | "above" | null;
  /** Listed price relative to the market median, as a fraction (0.1 = 10% above). */
  vsMedian: number | null;
  /** How many observed sellers, in the market currency, ask less than the store. */
  cheaperSellers: number | null;
  observedSellers: number | null;
};

const positive = (value: number | null | undefined): number | null =>
  value != null && Number.isFinite(value) && value > 0 ? value : null;

export function storePriceContext(input: StorePriceInput): StorePriceContext | null {
  const price = positive(input.price);
  if (price == null) return null;
  const currency = (input.currency ?? input.market.currency).toUpperCase();
  const cost = positive(input.cost);
  const comparable = currency === input.market.currency.toUpperCase();
  const low = positive(input.market.low);
  const high = positive(input.market.high);
  const median = positive(input.market.median);
  const observed = comparable
    ? input.market.observations.filter((item) => item.currency.toUpperCase() === currency)
    : [];
  return {
    storeName: input.storeName,
    currency,
    price,
    cost,
    margin: cost != null ? (price - cost) / price : null,
    position:
      comparable && low != null && high != null
        ? price < low
          ? "below"
          : price > high
            ? "above"
            : "within"
        : null,
    vsMedian: comparable && median != null ? (price - median) / median : null,
    cheaperSellers:
      observed.length > 0 ? observed.filter((item) => item.price < price).length : null,
    observedSellers: observed.length > 0 ? observed.length : null,
  };
}

/** One sentence a reader can act on, for the page and the report. */
export function describeStorePrice(context: StorePriceContext): string {
  const parts: string[] = [];
  if (context.position === "below") parts.push("below the researched range");
  if (context.position === "within") parts.push("within the researched range");
  if (context.position === "above") parts.push("above the researched range");
  if (context.vsMedian != null) {
    const pct = Math.round(Math.abs(context.vsMedian) * 100);
    parts.push(
      pct === 0
        ? "at the market median"
        : `${pct}% ${context.vsMedian > 0 ? "above" : "below"} the market median`,
    );
  }
  if (context.cheaperSellers != null && context.observedSellers != null) {
    parts.push(
      `${context.cheaperSellers} of ${context.observedSellers} observed seller${
        context.observedSellers === 1 ? "" : "s"
      } ask less`,
    );
  }
  if (parts.length === 0) return "Not comparable: the store price is in a different currency.";
  return parts.join("; ") + ".";
}
