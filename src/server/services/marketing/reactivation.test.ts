import { describe, expect, it } from "vitest";

import { scoreReactivation } from "./reactivation";

describe("scoreReactivation", () => {
  it("scores a high-LTV recently-lapsed subscribed customer in the hot bucket", () => {
    const r = scoreReactivation({
      lifetimeValue: 7_500,
      orderCount: 8,
      daysSinceLastOrder: 120,
      consentStatus: "subscribed",
    });
    // 35 (vip) + 35 (90-180d) + 20 (5+ orders) + 10 (subscribed) = 100
    expect(r.score).toBe(100);
    expect(r.reasons).toEqual(
      expect.arrayContaining([
        "VIP lifetime value (>$5k)",
        "Recently lapsed (90–180 days) — best reactivation odds",
        "5+ orders historically (loyal)",
        "Subscribed to marketing",
      ]),
    );
  });

  it("flags an active customer (last order < 90d) as not a candidate", () => {
    const r = scoreReactivation({
      lifetimeValue: 1_500,
      orderCount: 3,
      daysSinceLastOrder: 30,
      consentStatus: "subscribed",
    });
    // 25 (high LTV) + 0 (active) + 12 (2-4 orders) + 10 (subscribed) = 47
    expect(r.score).toBe(47);
    expect(r.reasons).toEqual(
      expect.arrayContaining(["Active in last 90 days (excluded as candidate)"]),
    );
  });

  it("scores a never-ordered prospect at 0", () => {
    const r = scoreReactivation({
      lifetimeValue: 0,
      orderCount: 0,
      daysSinceLastOrder: null,
      consentStatus: "unknown",
    });
    expect(r.score).toBe(0);
    expect(r.reasons).toEqual(
      expect.arrayContaining(["Never ordered — not eligible for reactivation"]),
    );
  });

  it("clamps score at 100 even when all components fire", () => {
    const r = scoreReactivation({
      lifetimeValue: 50_000,
      orderCount: 99,
      daysSinceLastOrder: 150,
      consentStatus: "subscribed",
    });
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("treats transactional consent as lower than subscribed", () => {
    const subscribed = scoreReactivation({
      lifetimeValue: 1_000,
      orderCount: 2,
      daysSinceLastOrder: 200,
      consentStatus: "subscribed",
    });
    const transactional = scoreReactivation({
      lifetimeValue: 1_000,
      orderCount: 2,
      daysSinceLastOrder: 200,
      consentStatus: "transactional",
    });
    expect(transactional.score).toBeLessThan(subscribed.score);
  });

  it("does not award consent points to unknown / unsubscribed customers", () => {
    const unknown = scoreReactivation({
      lifetimeValue: 1_000,
      orderCount: 2,
      daysSinceLastOrder: 200,
      consentStatus: "unknown",
    });
    const unsubscribed = scoreReactivation({
      lifetimeValue: 1_000,
      orderCount: 2,
      daysSinceLastOrder: 200,
      consentStatus: "unsubscribed",
    });
    expect(unknown.score).toBe(unsubscribed.score);
    expect(unknown.reasons).not.toContain("Subscribed to marketing");
  });
});
