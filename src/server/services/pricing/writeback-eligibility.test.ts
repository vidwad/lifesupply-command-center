/**
 * DP-6 writeback eligibility tests.
 *
 * This is the last gate before a price reaches a live storefront, so every
 * refusal is asserted behaviourally rather than by canary. The source-shape
 * canaries proving the writeback path is the only BigCommerce door live in
 * pricing.test.ts.
 */
import { describe, expect, it } from "vitest";

import { FEATURE_FLAGS } from "@/lib/feature-flags";

import {
  canUserWriteBack,
  canWriteBack,
  describeMissingMapping,
  hasSuccessfulWriteback,
  REQUIRED_WRITEBACK_FLAGS,
  resolveBigCommerceTarget,
  WRITEBACK_PERMISSION,
  type ExistingWriteback,
  type ResolvedTarget,
  type WritebackItem,
  type WritebackRecommendation,
} from "./writeback-eligibility";

const NOW = new Date("2026-08-22T12:00:00.000Z");
const future = new Date(NOW.getTime() + 60 * 60 * 1000);
const past = new Date(NOW.getTime() - 60 * 60 * 1000);

function rec(overrides: Partial<WritebackRecommendation> = {}): WritebackRecommendation {
  return {
    status: "approved",
    approvedById: "user-1",
    approvedAt: past,
    recommendedSalePrice: 99.99,
    floorPrice: 70,
    costPrice: 50,
    expiresAt: future,
    ...overrides,
  };
}

const item: WritebackItem = { status: "approved", blockedReason: null, storeId: "store-1" };
const target: ResolvedTarget = { scope: "product", productId: "1234" };

const check = (
  overrides: Partial<WritebackRecommendation> = {},
  opts: {
    item?: WritebackItem;
    existingLogs?: ExistingWriteback[];
    target?: ResolvedTarget | null;
  } = {},
) =>
  canWriteBack({
    recommendation: rec(overrides),
    item: opts.item === undefined ? item : opts.item,
    existingLogs: opts.existingLogs ?? [],
    target: opts.target === undefined ? target : opts.target,
    now: NOW,
  });

describe("writeback is allowed", () => {
  it("for an approved, unexpired, above-floor, mapped recommendation", () => {
    expect(check()).toEqual({ allowed: true });
  });

  it("for a price exactly at the floor", () => {
    expect(check({ recommendedSalePrice: 70, floorPrice: 70 }).allowed).toBe(true);
  });

  it("for a recommendation with no expiry", () => {
    expect(check({ expiresAt: null }).allowed).toBe(true);
  });

  it("when an earlier writeback failed but none succeeded", () => {
    // A failed attempt must not permanently block a retry.
    expect(check({}, { existingLogs: [{ status: "failed" }] }).allowed).toBe(true);
  });
});

describe("writeback is refused", () => {
  for (const status of [
    "ready_for_review",
    "rejected",
    "expired",
    "written_back",
    "failed",
    "draft",
  ] as const) {
    it("for a " + status + " recommendation", () => {
      const verdict = check({ status });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("not_approved");
    });
  }

  it("when the row says approved but records no approver", () => {
    expect(check({ approvedById: null }).allowed).toBe(false);
    expect(check({ approvedAt: null }).allowed).toBe(false);
    const verdict = check({ approvedById: null });
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_approver");
  });

  it("when a successful writeback already exists", () => {
    const verdict = check({}, { existingLogs: [{ status: "succeeded" }] });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("already_written");
  });

  it("when a success exists alongside later failures", () => {
    const verdict = check({}, { existingLogs: [{ status: "failed" }, { status: "succeeded" }] });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("already_written");
  });

  it("for expired evidence", () => {
    const verdict = check({ expiresAt: past });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("expired");
  });

  it("for a price below the floor", () => {
    const verdict = check({ recommendedSalePrice: 69.99, floorPrice: 70 });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.reason).toBe("below_floor");
      expect(verdict.message).toContain("below the $70.00 floor");
    }
  });

  it("for a missing recommended price", () => {
    for (const price of [null, 0, -5]) {
      const verdict = check({ recommendedSalePrice: price });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("missing_recommended_price");
    }
  });

  it("for a missing cost", () => {
    const verdict = check({ costPrice: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_cost");
  });

  it("for a missing floor", () => {
    const verdict = check({ floorPrice: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_floor");
  });

  it("when the run item is gone", () => {
    const verdict = check({}, { item: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("item_missing");
  });

  it("when the run item is blocked", () => {
    const verdict = check({}, { item: { status: "blocked", blockedReason: "x", storeId: "s" } });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("item_blocked");
  });

  it("when the run item has no store", () => {
    const verdict = check({}, { item: { status: "approved", blockedReason: null, storeId: null } });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_store");
  });

  it("when there is no BigCommerce mapping", () => {
    const verdict = check({}, { target: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_mapping");
  });

  it("reports an already-successful writeback before an expiry problem", () => {
    // Both true; "you already wrote this" is the more important fact.
    const verdict = check({ expiresAt: past }, { existingLogs: [{ status: "succeeded" }] });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("already_written");
  });
});

describe("resolving the BigCommerce target", () => {
  const bc = (id: string) => ({ sourceSystem: "bigcommerce", sourceId: id });

  it("targets a variant when both ids resolve", () => {
    expect(
      resolveBigCommerceTarget({ product: bc("10"), variant: bc("20"), variantScoped: true }),
    ).toEqual({ scope: "variant", productId: "10", variantId: "20" });
  });

  it("targets the product when the item is not variant-scoped", () => {
    expect(
      resolveBigCommerceTarget({ product: bc("10"), variant: null, variantScoped: false }),
    ).toEqual({ scope: "product", productId: "10" });
  });

  /**
   * The important one. A variant-scoped item whose parent product id is missing
   * must NOT silently fall back to the product endpoint — that would reprice
   * every variant of the product instead of the one that was approved.
   */
  it("refuses to fall back to the product for a variant-scoped item", () => {
    expect(
      resolveBigCommerceTarget({ product: null, variant: bc("20"), variantScoped: true }),
    ).toBeNull();
    expect(
      resolveBigCommerceTarget({
        product: { sourceSystem: "manual", sourceId: "10" },
        variant: bc("20"),
        variantScoped: true,
      }),
    ).toBeNull();
  });

  it("refuses a variant-scoped item with no variant source id", () => {
    expect(
      resolveBigCommerceTarget({ product: bc("10"), variant: null, variantScoped: true }),
    ).toBeNull();
  });

  it("ignores ids from another source system", () => {
    expect(
      resolveBigCommerceTarget({
        product: { sourceSystem: "amazon", sourceId: "10" },
        variant: null,
        variantScoped: false,
      }),
    ).toBeNull();
  });

  it("ignores blank source ids", () => {
    expect(
      resolveBigCommerceTarget({
        product: { sourceSystem: "bigcommerce", sourceId: "   " },
        variant: null,
        variantScoped: false,
      }),
    ).toBeNull();
  });

  it("names the missing field so an operator can fix it", () => {
    const message = describeMissingMapping({
      product: null,
      variant: null,
      variantScoped: false,
    });
    expect(message).toContain("Product.sourceId");
    expect(message).toContain("BigCommerce product sync");
  });
});

describe("gates enumerated for the UI and the service", () => {
  it("requires all three flags", () => {
    expect([...REQUIRED_WRITEBACK_FLAGS]).toEqual([
      FEATURE_FLAGS.PRICING_INTELLIGENCE,
      FEATURE_FLAGS.PRICING_WRITEBACKS,
      FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
    ]);
  });

  it("requires pricing.writeback_bigcommerce, which approval does not grant", () => {
    expect(WRITEBACK_PERMISSION).toBe("pricing.writeback_bigcommerce");
    expect(canUserWriteBack({ permissions: ["pricing.writeback_bigcommerce"] })).toBe(true);
    expect(canUserWriteBack({ permissions: ["pricing.approve_recommendations"] })).toBe(false);
    expect(
      canUserWriteBack({
        permissions: [
          "pricing.view",
          "pricing.review_recommendations",
          "pricing.approve_recommendations",
        ],
      }),
    ).toBe(false);
    expect(canUserWriteBack(null)).toBe(false);
  });
});

describe("successful-writeback detection", () => {
  it("is true only when a succeeded log exists", () => {
    expect(hasSuccessfulWriteback([])).toBe(false);
    expect(hasSuccessfulWriteback([{ status: "queued" }, { status: "failed" }])).toBe(false);
    expect(hasSuccessfulWriteback([{ status: "succeeded" }])).toBe(true);
    // A rolled-back write is not a live one, so it does not block a re-write.
    expect(hasSuccessfulWriteback([{ status: "rolled_back" }])).toBe(false);
  });
});
