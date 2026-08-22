/**
 * DP-6B rollback eligibility tests.
 *
 * Rollback is a live price change, so every refusal is proved behaviourally.
 * The structural canaries proving rollback opens no second door to a store are
 * in writeback-canaries.test.ts.
 */
import { describe, expect, it } from "vitest";

import { FEATURE_FLAGS } from "@/lib/feature-flags";

import {
  canRollBackAfterRead,
  canRollBackBeforeRead,
  canUserRollBack,
  CLEARING_SALE_PRICE_SUPPORTED,
  livePriceMatchesWritten,
  REQUIRED_ROLLBACK_FLAGS,
  resolveRollbackTarget,
  ROLLBACK_PERMISSION,
  selectPriorSalePrice,
  type WritebackLogLike,
} from "./rollback-eligibility";

function log(overrides: Partial<WritebackLogLike> = {}): WritebackLogLike {
  return {
    status: "succeeded",
    rollbackAt: null,
    rollbackPayload: { liveBefore: { salePrice: 110, price: 120 } },
    sourceSystem: "bigcommerce",
    sourceProductId: "77",
    sourceVariantId: null,
    oldSalePrice: 110,
    newSalePrice: 99.99,
    ...overrides,
  };
}

const check = (
  overrides: Partial<WritebackLogLike> = {},
  recStatus: string | null = "written_back",
) =>
  canRollBackBeforeRead({
    log: log(overrides),
    recommendation: recStatus == null ? null : { status: recStatus },
  });

describe("rollback is allowed", () => {
  it("for a succeeded, un-rolled-back log with evidence", () => {
    const verdict = check();
    expect(verdict.allowed).toBe(true);
    if (verdict.allowed) {
      expect(verdict.salePrice).toBe(110);
      expect(verdict.target).toEqual({ scope: "product", productId: "77" });
    }
  });

  it("targets the exact variant when the writeback was variant-scoped", () => {
    const verdict = check({ sourceVariantId: "88" });
    expect(verdict.allowed).toBe(true);
    if (verdict.allowed) {
      expect(verdict.target).toEqual({ scope: "variant", productId: "77", variantId: "88" });
    }
  });
});

describe("rollback is refused", () => {
  for (const status of ["queued", "failed", "rolled_back"] as const) {
    it("when the log status is " + status, () => {
      const verdict = check({ status });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("not_succeeded");
    });
  }

  it("when the log is already rolled back by timestamp", () => {
    const verdict = check({ rollbackAt: new Date() });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("already_rolled_back");
  });

  it("without rollback evidence", () => {
    const verdict = check({ rollbackPayload: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_rollback_evidence");
  });

  it("when the writeback was not against BigCommerce", () => {
    const verdict = check({ sourceSystem: "amazon" });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("wrong_source_system");
  });

  it("without a source product id", () => {
    for (const id of [null, "", "  "]) {
      const verdict = check({ sourceProductId: id });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("missing_source_product");
    }
  });

  /**
   * A variant-scoped log with a blank variant id must NOT fall back to the
   * product endpoint — that would reprice every variant of the product.
   */
  it("for a variant-scoped log with no usable variant id", () => {
    const verdict = check({ sourceVariantId: "   " });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_variant_target");
  });

  it("without a recorded written price", () => {
    const verdict = check({ newSalePrice: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_written_price");
  });

  it("when the recommendation is gone", () => {
    const verdict = check({}, null);
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("recommendation_missing");
  });

  for (const status of ["approved", "ready_for_review", "rejected", "failed"] as const) {
    it("when the recommendation is " + status + " rather than written_back", () => {
      const verdict = check({}, status);
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("recommendation_not_written_back");
    });
  }

  it("when no prior price was recorded anywhere", () => {
    const verdict = check({ rollbackPayload: { liveBefore: {} }, oldSalePrice: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_prior_price");
  });
});

describe("a prior state of 'no sale price'", () => {
  it("refuses, because clearing a sale price is not supported", () => {
    expect(CLEARING_SALE_PRICE_SUPPORTED).toBe(false);
    const verdict = check({ rollbackPayload: { liveBefore: { salePrice: null } } });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.reason).toBe("null_prior_price_unsupported");
      // The refusal must tell the operator what to do instead.
      expect(verdict.message).toContain("Clear it manually in BigCommerce");
    }
  });

  it("never silently converts a null prior price to zero", () => {
    const verdict = check({
      rollbackPayload: { liveBefore: { salePrice: null } },
      oldSalePrice: 0,
    });
    expect(verdict.allowed).toBe(false);
  });

  it("refuses a recorded prior price of zero rather than writing $0.00", () => {
    const verdict = check({ rollbackPayload: { liveBefore: { salePrice: 0 } } });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_prior_price");
  });
});

describe("choosing the price to restore", () => {
  it("prefers the live pre-write reading over the stored column", () => {
    expect(
      selectPriorSalePrice(
        log({ rollbackPayload: { liveBefore: { salePrice: 95 } }, oldSalePrice: 110 }),
      ),
    ).toEqual({ kind: "value", salePrice: 95 });
  });

  it("falls back to the stored old sale price when no live reading exists", () => {
    expect(selectPriorSalePrice(log({ rollbackPayload: {}, oldSalePrice: 110 }))).toEqual({
      kind: "value",
      salePrice: 110,
    });
  });

  /**
   * An ABSENT key is not evidence of "no sale price". Only an explicitly
   * recorded null is — otherwise a rollback could clear a price on no evidence.
   */
  it("treats an explicitly recorded null as 'no sale price', and an absent key as unknown", () => {
    expect(
      selectPriorSalePrice(log({ rollbackPayload: { liveBefore: { salePrice: null } } })),
    ).toEqual({ kind: "null_price" });
    expect(
      selectPriorSalePrice(log({ rollbackPayload: { liveBefore: {} }, oldSalePrice: null })),
    ).toEqual({ kind: "unavailable" });
  });

  it("reports unavailable when there is no evidence at all", () => {
    expect(selectPriorSalePrice(log({ rollbackPayload: null, oldSalePrice: null }))).toEqual({
      kind: "unavailable",
    });
  });
});

describe("the live-price mismatch gate", () => {
  it("allows rollback when the live price still equals what was written", () => {
    expect(canRollBackAfterRead({ log: log(), liveSalePrice: 99.99 }).allowed).toBe(true);
  });

  it("tolerates sub-cent floating point drift", () => {
    expect(livePriceMatchesWritten(99.99000001, 99.99)).toBe(true);
    expect(livePriceMatchesWritten(99.98, 99.99)).toBe(false);
  });

  /**
   * The rule that stops rollback becoming a way to clobber someone else's
   * change. There is deliberately no override in DP-6B.
   */
  it("refuses when the store price has moved since the writeback", () => {
    const verdict = canRollBackAfterRead({ log: log(), liveSalePrice: 89.99 });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.reason).toBe("store_price_changed");
      expect(verdict.message).toContain("would overwrite a later change");
    }
  });

  it("refuses when the store now has no sale price at all", () => {
    const verdict = canRollBackAfterRead({ log: log(), liveSalePrice: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("store_price_changed");
  });
});

describe("target resolution", () => {
  it("preserves variant scope and never widens it", () => {
    expect(resolveRollbackTarget(log({ sourceVariantId: "88" }))).toEqual({
      scope: "variant",
      productId: "77",
      variantId: "88",
    });
    expect(resolveRollbackTarget(log({ sourceVariantId: "" }))).toBeNull();
    expect(resolveRollbackTarget(log({ sourceProductId: null }))).toBeNull();
  });
});

describe("gates", () => {
  it("requires the same three flags as the forward write", () => {
    expect([...REQUIRED_ROLLBACK_FLAGS]).toEqual([
      FEATURE_FLAGS.PRICING_INTELLIGENCE,
      FEATURE_FLAGS.PRICING_WRITEBACKS,
      FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
    ]);
  });

  it("requires pricing.writeback_bigcommerce", () => {
    expect(ROLLBACK_PERMISSION).toBe("pricing.writeback_bigcommerce");
    expect(canUserRollBack({ permissions: ["pricing.writeback_bigcommerce"] })).toBe(true);
    expect(canUserRollBack({ permissions: ["pricing.approve_recommendations"] })).toBe(false);
    expect(canUserRollBack({ permissions: ["pricing.view"] })).toBe(false);
    expect(canUserRollBack(null)).toBe(false);
  });
});
