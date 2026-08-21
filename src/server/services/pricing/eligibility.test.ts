import { describe, expect, it } from "vitest";

import {
  canContactCompetitor,
  isItemEligible,
  isRunCheckable,
  minRequestSpacingMs,
  resolveBatchSize,
} from "./eligibility";

const competitor = (over: Partial<Parameters<typeof canContactCompetitor>[0]> = {}) => ({
  id: "c1",
  enabled: true,
  termsReviewStatus: "reviewed_allowed",
  rateLimitPerHour: 60,
  ...over,
});

const item = (over: Partial<Parameters<typeof isItemEligible>[0]> = {}) => ({
  id: "i1",
  status: "pending",
  blockedReason: null,
  costPrice: 10,
  floorPrice: 14,
  ...over,
});

const ok = { runStatus: "draft", hasCompetitorUrl: true };

describe("canContactCompetitor — terms review is a hard gate", () => {
  it("allows only reviewed_allowed", () => {
    expect(canContactCompetitor(competitor(), { checksInLastHour: 0 })).toEqual({ allowed: true });
  });

  it("refuses a competitor whose terms have never been reviewed", () => {
    // pending must not read as permission-by-default, or the review step is
    // decorative.
    expect(
      canContactCompetitor(competitor({ termsReviewStatus: "pending" }), { checksInLastHour: 0 }),
    ).toEqual({ allowed: false, reason: "terms_not_reviewed" });
  });

  it("refuses restricted and disabled terms statuses", () => {
    expect(
      canContactCompetitor(competitor({ termsReviewStatus: "reviewed_restricted" }), {
        checksInLastHour: 0,
      }),
    ).toEqual({ allowed: false, reason: "terms_restricted" });
    expect(
      canContactCompetitor(competitor({ termsReviewStatus: "disabled" }), { checksInLastHour: 0 }),
    ).toEqual({ allowed: false, reason: "terms_disabled" });
  });

  it("refuses an unknown status rather than falling through to allowed", () => {
    expect(
      canContactCompetitor(competitor({ termsReviewStatus: "something_new" }), {
        checksInLastHour: 0,
      }),
    ).toEqual({ allowed: false, reason: "terms_not_reviewed" });
  });

  it("refuses a disabled competitor even when terms are allowed", () => {
    expect(canContactCompetitor(competitor({ enabled: false }), { checksInLastHour: 0 })).toEqual({
      allowed: false,
      reason: "disabled",
    });
  });
});

describe("canContactCompetitor — rate limiting", () => {
  it("refuses once the hourly limit is reached", () => {
    expect(
      canContactCompetitor(competitor({ rateLimitPerHour: 10 }), { checksInLastHour: 10 }),
    ).toEqual({ allowed: false, reason: "rate_limited" });
    expect(
      canContactCompetitor(competitor({ rateLimitPerHour: 10 }), { checksInLastHour: 9 }),
    ).toEqual({ allowed: true });
  });

  it("treats a zero or negative limit as no permission, not unlimited", () => {
    for (const rateLimitPerHour of [0, -1]) {
      expect(
        canContactCompetitor(competitor({ rateLimitPerHour }), { checksInLastHour: 0 }),
      ).toEqual({ allowed: false, reason: "rate_limited" });
    }
  });

  it("derives request spacing from the hourly limit", () => {
    expect(minRequestSpacingMs(60)).toBe(60_000);
    expect(minRequestSpacingMs(3600)).toBe(1000);
    expect(minRequestSpacingMs(0)).toBe(0);
  });
});

describe("isItemEligible", () => {
  it("accepts a pending, costed, unblocked item with a URL", () => {
    expect(isItemEligible(item(), ok)).toEqual({ eligible: true });
  });

  it("skips a blocked item", () => {
    expect(isItemEligible(item({ status: "blocked" }), ok).eligible).toBe(false);
    expect(isItemEligible(item({ blockedReason: "missing_cost" }), ok)).toEqual({
      eligible: false,
      reason: "blocked",
    });
  });

  it("skips an item without a cost or floor", () => {
    // Without both, an observation cannot become a recommendation later
    // without re-deriving the floor DP-2 deliberately stored.
    expect(isItemEligible(item({ costPrice: null }), ok)).toEqual({
      eligible: false,
      reason: "missing_cost",
    });
    expect(isItemEligible(item({ costPrice: 0 }), ok)).toEqual({
      eligible: false,
      reason: "missing_cost",
    });
    expect(isItemEligible(item({ floorPrice: null }), ok)).toEqual({
      eligible: false,
      reason: "missing_floor",
    });
  });

  it("skips an item with no competitor URL", () => {
    expect(isItemEligible(item(), { ...ok, hasCompetitorUrl: false })).toEqual({
      eligible: false,
      reason: "no_competitor_url",
    });
  });

  it("skips an already-checked item", () => {
    expect(isItemEligible(item({ status: "checked" }), ok)).toEqual({
      eligible: false,
      reason: "not_pending",
    });
  });

  it("refuses any run that is not draft or queued", () => {
    expect(isRunCheckable("draft")).toBe(true);
    expect(isRunCheckable("queued")).toBe(true);
    for (const status of ["running", "completed", "cancelled", "failed", "paused"]) {
      expect(isRunCheckable(status), status).toBe(false);
      expect(isItemEligible(item(), { ...ok, runStatus: status }).eligible).toBe(false);
    }
  });
});

describe("resolveBatchSize", () => {
  it("defaults to the run's daily batch size", () => {
    expect(resolveBatchSize({ dailyBatchSize: 300 })).toBe(300);
    expect(resolveBatchSize({ requested: null, dailyBatchSize: 300 })).toBe(300);
  });

  it("allows a smaller test batch", () => {
    for (const requested of [5, 10, 25]) {
      expect(resolveBatchSize({ requested, dailyBatchSize: 300 })).toBe(requested);
    }
  });

  it("never exceeds the daily batch size, which is the operator's stated ceiling", () => {
    expect(resolveBatchSize({ requested: 10_000, dailyBatchSize: 300 })).toBe(300);
  });

  it("falls back to 300 for a nonsensical daily batch size", () => {
    expect(resolveBatchSize({ dailyBatchSize: 0 })).toBe(300);
  });
});
