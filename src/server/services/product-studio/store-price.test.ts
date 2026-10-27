import { describe, expect, it } from "vitest";

import { describeStorePrice, storePriceContext } from "./store-price";

const market = {
  currency: "CAD",
  low: 10,
  high: 20,
  median: 15,
  observations: [
    { price: 10, currency: "CAD" },
    { price: 14, currency: "CAD" },
    { price: 20, currency: "CAD" },
    { price: 9, currency: "USD" },
  ],
};

describe("the store price against the market", () => {
  it("places the listed price, computes the margin and counts cheaper sellers", () => {
    const context = storePriceContext({
      storeName: "LifeSupply",
      currency: "CAD",
      price: 18,
      cost: 9,
      market,
    });
    expect(context).toMatchObject({
      price: 18,
      cost: 9,
      margin: 0.5,
      position: "within",
      vsMedian: 0.2,
      cheaperSellers: 2,
      observedSellers: 3,
    });
    expect(describeStorePrice(context!)).toBe(
      "within the researched range; 20% above the market median; 2 of 3 observed sellers ask less.",
    );
  });
  it("treats a zero cost as unknown and a missing price as no context", () => {
    expect(
      storePriceContext({ storeName: null, currency: "CAD", price: 12, cost: 0, market })!.margin,
    ).toBeNull();
    expect(
      storePriceContext({ storeName: null, currency: "CAD", price: 0, cost: 5, market }),
    ).toBeNull();
  });
  it("reports below and above the range", () => {
    expect(
      storePriceContext({ storeName: null, currency: "CAD", price: 8, cost: null, market })!
        .position,
    ).toBe("below");
    expect(
      storePriceContext({ storeName: null, currency: "CAD", price: 25, cost: null, market })!
        .position,
    ).toBe("above");
  });
  it("does not compare across currencies", () => {
    const context = storePriceContext({
      storeName: null,
      currency: "USD",
      price: 15,
      cost: 7,
      market,
    })!;
    expect(context).toMatchObject({ position: null, vsMedian: null, cheaperSellers: null });
    expect(context.margin).toBeCloseTo(0.533, 3);
    expect(describeStorePrice(context)).toContain("different currency");
  });
});
