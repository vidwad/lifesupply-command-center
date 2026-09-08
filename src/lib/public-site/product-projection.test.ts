import { describe, expect, it } from "vitest";

import {
  isStaleProjection,
  productProjectionSchema,
  projectionDisplay,
} from "./product-projection";

const fresh = {
  store: "lifesupply",
  sku: "ABC-123",
  variant: "Box of 100",
  manufacturerRef: null,
  currency: "CAD",
  region: "CA",
  availability: "in_stock",
  price: 12.5,
  destinationUrl: "https://lifesupply.ca/products/abc-123/",
  updatedAt: "2026-09-08T12:00:00Z",
} as const;

describe("product projection contract", () => {
  it("accepts a complete row and refuses unknown fields, foreign currencies, and non-URL destinations", () => {
    expect(productProjectionSchema.parse(fresh).sku).toBe("ABC-123");
    expect(productProjectionSchema.safeParse({ ...fresh, extra: 1 }).success).toBe(false);
    expect(productProjectionSchema.safeParse({ ...fresh, currency: "EUR" }).success).toBe(false);
    expect(
      productProjectionSchema.safeParse({ ...fresh, destinationUrl: "not a url" }).success,
    ).toBe(false);
  });

  it("never shows a stale price or availability, and never invents either", () => {
    const now = new Date("2026-09-08T12:30:00Z");
    expect(isStaleProjection(fresh, now)).toBe(false);
    expect(projectionDisplay(fresh, now)).toMatchObject({
      stale: false,
      showPrice: true,
      showAvailability: true,
    });
    const later = new Date("2026-09-08T13:30:01Z");
    expect(isStaleProjection(fresh, later)).toBe(true);
    expect(projectionDisplay(fresh, later)).toMatchObject({
      stale: true,
      showPrice: false,
      showAvailability: false,
    });
    expect(
      projectionDisplay({ ...fresh, price: null, availability: "unknown" }, now),
    ).toMatchObject({
      showPrice: false,
      showAvailability: false,
    });
  });
});
