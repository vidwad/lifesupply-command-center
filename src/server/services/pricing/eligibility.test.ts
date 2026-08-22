import { describe, expect, it } from "vitest";

import {
  canContactCompetitor,
  MAX_COMPETITOR_URLS_PER_ITEM,
  remainingHourlyAllowance,
  selectCompetitorUrlsForItem,
  type UrlCandidate,
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

describe("selectCompetitorUrlsForItem (DP-3A)", () => {
  const c = (over: Partial<UrlCandidate>): UrlCandidate => ({
    competitorId: "c1",
    competitorUrl: "https://a.example/p1",
    scope: "product",
    urlVerified: false,
    ...over,
  });

  it("allows up to five competitor URLs per product", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      c({ competitorId: "c" + i, competitorUrl: "https://s" + i + ".example/p" }),
    );
    expect(selectCompetitorUrlsForItem(many)).toHaveLength(MAX_COMPETITOR_URLS_PER_ITEM);
    expect(MAX_COMPETITOR_URLS_PER_ITEM).toBe(5);
  });

  it("prefers variant-level mappings over product-level", () => {
    // A product mapping may point at a different size or pack; the variant
    // mapping identifies the exact item being priced.
    const chosen = selectCompetitorUrlsForItem([
      c({ scope: "product", competitorUrl: "https://a.example/product" }),
      c({ scope: "variant", competitorUrl: "https://a.example/variant" }),
      c({ scope: "upload", competitorUrl: "https://a.example/uploaded" }),
    ]);
    expect(chosen.map((x) => x.scope)).toEqual(["variant", "product", "upload"]);
  });

  it("deduplicates the same URL so one product does not spend two requests", () => {
    const chosen = selectCompetitorUrlsForItem([
      c({ scope: "variant", competitorUrl: "https://a.example/p" }),
      c({ scope: "product", competitorUrl: "https://A.example/p" }),
      c({ scope: "upload", competitorUrl: "https://a.example/p " }),
    ]);
    expect(chosen).toHaveLength(1);
    expect(chosen[0]?.scope).toBe("variant");
  });

  it("ignores blank URLs", () => {
    expect(selectCompetitorUrlsForItem([c({ competitorUrl: "   " })])).toHaveLength(0);
  });

  it("honours a smaller explicit limit", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      c({ competitorUrl: "https://s" + i + ".example/p" }),
    );
    expect(selectCompetitorUrlsForItem(many, 2)).toHaveLength(2);
    expect(selectCompetitorUrlsForItem(many, 0)).toHaveLength(0);
  });
});

describe("remainingHourlyAllowance (DP-3A)", () => {
  it("reports what is left within the hour", () => {
    expect(remainingHourlyAllowance({ rateLimitPerHour: 60 }, 0)).toBe(60);
    expect(remainingHourlyAllowance({ rateLimitPerHour: 60 }, 59)).toBe(1);
  });

  it("never goes negative or grants credit for over-use", () => {
    expect(remainingHourlyAllowance({ rateLimitPerHour: 60 }, 60)).toBe(0);
    expect(remainingHourlyAllowance({ rateLimitPerHour: 60 }, 999)).toBe(0);
  });

  it("treats a non-positive limit as no allowance, not unlimited", () => {
    expect(remainingHourlyAllowance({ rateLimitPerHour: 0 }, 0)).toBe(0);
    expect(remainingHourlyAllowance({ rateLimitPerHour: -5 }, 0)).toBe(0);
  });

  it("matches the documented 60/hour spacing", () => {
    // 60 per hour means one request per minute; a truncated wait would breach
    // the very limit the setting exists to enforce.
    expect(minRequestSpacingMs(60)).toBe(60_000);
  });
});
