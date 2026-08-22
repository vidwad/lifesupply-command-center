/**
 * DP-6C reconciliation rule tests.
 *
 * The expectation differs per writeback-log status, and getting it wrong in the
 * unsafe direction — reporting `matched` where we have no expectation, or
 * `not_applicable` where a write may actually have landed — is what these pin.
 */
import { describe, expect, it } from "vitest";

import {
  hasFailedRollbackAttempt,
  latestRollbackAttempt,
  OPERATIONS_FILTERS,
  parseOperationsFilter,
  reconcileWritebackLog,
} from "./reconciliation";
import { type WritebackLogLike } from "./rollback-eligibility";

function log(overrides: Partial<WritebackLogLike> = {}): WritebackLogLike {
  return {
    status: "succeeded",
    rollbackAt: null,
    rollbackPayload: { liveBefore: { salePrice: 110 } },
    sourceSystem: "bigcommerce",
    sourceProductId: "77",
    sourceVariantId: null,
    oldSalePrice: 110,
    newSalePrice: 99.99,
    ...overrides,
  };
}

const check = (observed: number | null, overrides: Partial<WritebackLogLike> = {}) =>
  reconcileWritebackLog({ log: log(overrides), observedSalePrice: observed });

describe("a successful writeback that was never rolled back", () => {
  it("matches when the store still holds the written price", () => {
    const result = check(99.99);
    expect(result.status).toBe("matched");
    expect(result.expectedSalePrice).toBe(99.99);
    expect(result.requiredAction).toBeNull();
  });

  it("tolerates sub-cent drift", () => {
    expect(check(99.99000001).status).toBe("matched");
  });

  it("flags a mismatch when the store price has moved", () => {
    const result = check(89.99);
    expect(result.status).toBe("mismatch");
    expect(result.reason).toContain("Store price changed after writeback");
    expect(result.reason).toContain("$99.99");
    expect(result.reason).toContain("$89.99");
    // Must not tell the operator to just re-write it.
    expect(result.requiredAction).toContain("Find out what changed this price");
  });

  it("flags a mismatch when the store now has no sale price", () => {
    const result = check(null);
    expect(result.status).toBe("mismatch");
    expect(result.reason).toContain("found unset");
  });

  it("asks for manual verification when no written price was recorded", () => {
    const result = check(50, { newSalePrice: null });
    expect(result.status).toBe("manual_verification_required");
  });
});

describe("a rolled-back writeback", () => {
  const rolled = { status: "rolled_back", rollbackAt: new Date() } as Partial<WritebackLogLike>;

  it("matches when the store holds the restored price", () => {
    const result = check(110, rolled);
    expect(result.status).toBe("matched");
    expect(result.expectedSalePrice).toBe(110);
  });

  it("flags a mismatch when the store does not hold the restored price", () => {
    const result = check(99.99, rolled);
    expect(result.status).toBe("mismatch");
    expect(result.requiredAction).toContain("whether the rollback took effect");
  });

  it("asks for manual verification when the prior state was no sale price", () => {
    // DP-6B cannot clear a sale price, so this rollback was necessarily partial.
    const result = check(99.99, {
      ...rolled,
      rollbackPayload: { liveBefore: { salePrice: null } },
      oldSalePrice: null,
    });
    expect(result.status).toBe("manual_verification_required");
    expect(result.reason).toContain("cannot clear automatically");
  });
});

describe("a failed writeback", () => {
  const failed = { status: "failed" } as Partial<WritebackLogLike>;

  it("expects no change when the store price is unrelated", () => {
    const result = check(110, failed);
    expect(result.status).toBe("not_applicable");
    expect(result.requiredAction).toBeNull();
  });

  /**
   * The most important case in this module: the API reported failure but the
   * store holds the value anyway. Calling that "nothing happened" would leave
   * an unrecorded live change on the storefront.
   */
  it("flags a possible landed write when the store holds the attempted price", () => {
    const result = check(99.99, failed);
    expect(result.status).toBe("possible_landed_write");
    expect(result.reason).toContain("may have landed despite the error");
    expect(result.requiredAction).toContain("The log does not reflect it");
  });

  it("does not flag a landed write when no price was recorded", () => {
    expect(check(99.99, { ...failed, newSalePrice: null }).status).toBe("not_applicable");
  });
});

describe("a log with nothing to reconcile", () => {
  it("reports not applicable for a queued log rather than a false match", () => {
    const result = check(99.99, { status: "queued" });
    expect(result.status).toBe("not_applicable");
    expect(result.reason).toContain("the log is queued");
  });
});

describe("rollback attempt reporting", () => {
  const withAttempts = (attempts: unknown[]) => ({ rollbackAttempts: attempts });

  it("reads the most recent attempt", () => {
    const attempt = latestRollbackAttempt(
      withAttempts([
        { outcome: "refused", reason: "store_price_changed" },
        { outcome: "failed", errorMessage: "HTTP 500" },
      ]),
    );
    expect(attempt?.outcome).toBe("failed");
    expect(attempt?.errorMessage).toBe("HTTP 500");
  });

  it("returns null when there are no attempts", () => {
    expect(latestRollbackAttempt(null)).toBeNull();
    expect(latestRollbackAttempt({})).toBeNull();
    expect(latestRollbackAttempt(withAttempts([]))).toBeNull();
  });

  it("counts refused and failed attempts as needing attention, but not success", () => {
    expect(hasFailedRollbackAttempt(withAttempts([{ outcome: "failed" }]))).toBe(true);
    expect(hasFailedRollbackAttempt(withAttempts([{ outcome: "refused" }]))).toBe(true);
    expect(hasFailedRollbackAttempt(withAttempts([{ outcome: "rolled_back" }]))).toBe(false);
    expect(hasFailedRollbackAttempt(null)).toBe(false);
  });

  it("reports only the latest, so a fixed problem stops showing", () => {
    expect(
      hasFailedRollbackAttempt(withAttempts([{ outcome: "failed" }, { outcome: "rolled_back" }])),
    ).toBe(false);
  });
});

describe("operations filters", () => {
  it("accepts every supported filter", () => {
    for (const value of OPERATIONS_FILTERS) {
      expect(parseOperationsFilter(value)).toBe(value);
    }
  });

  it("falls back to all on anything unexpected", () => {
    expect(parseOperationsFilter("bogus")).toBe("all");
    expect(parseOperationsFilter(undefined)).toBe("all");
    expect(parseOperationsFilter(42)).toBe("all");
  });
});
