import { describe, expect, it } from "vitest";

import { DELAY_THRESHOLDS, delaySeverity, evaluateOrderDelay } from "./delay-rules";

const NOW = new Date("2026-08-04T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("DELAY_THRESHOLDS", () => {
  it("pins the published thresholds", () => {
    expect(DELAY_THRESHOLDS).toEqual({
      UNSHIPPED_WARN_DAYS: 3,
      UNSHIPPED_DELAY_DAYS: 7,
      REVIEW_DELAY_DAYS: 2,
      DELIVERY_DELAY_DAYS: 14,
    });
  });
});

describe("evaluateOrderDelay — unshipped clock", () => {
  it("fresh orders are neither warned nor delayed", () => {
    const v = evaluateOrderDelay({
      status: "processing",
      orderDate: daysAgo(1),
      shipmentDates: [],
      now: NOW,
    });
    expect(v).toMatchObject({ delayed: false, warning: false, kind: "none" });
  });

  it("warns from day 3, delays from day 7", () => {
    const warn = evaluateOrderDelay({
      status: "processing",
      orderDate: daysAgo(4),
      shipmentDates: [],
      now: NOW,
    });
    expect(warn).toMatchObject({ delayed: false, warning: true, kind: "unshipped" });

    const delayed = evaluateOrderDelay({
      status: "awaiting_supplier",
      orderDate: daysAgo(8),
      shipmentDates: [],
      now: NOW,
    });
    expect(delayed).toMatchObject({ delayed: true, kind: "unshipped", daysOutstanding: 8 });
    expect(delayed.reason).toMatch(/Unshipped 8 days/);
  });
});

describe("evaluateOrderDelay — review clock", () => {
  it("awaiting_human_review is delayed from day 2", () => {
    const v = evaluateOrderDelay({
      status: "awaiting_human_review",
      orderDate: daysAgo(2),
      shipmentDates: [],
      now: NOW,
    });
    expect(v).toMatchObject({ delayed: true, kind: "in_review", daysOutstanding: 2 });
  });

  it("awaiting_human_review under 2 days only warns via the unshipped rule", () => {
    const v = evaluateOrderDelay({
      status: "awaiting_human_review",
      orderDate: daysAgo(1),
      shipmentDates: [],
      now: NOW,
    });
    expect(v.delayed).toBe(false);
  });
});

describe("evaluateOrderDelay — delivery clock", () => {
  it("shipped orders are fine before 14 days", () => {
    const v = evaluateOrderDelay({
      status: "shipped",
      orderDate: daysAgo(20),
      shipmentDates: [daysAgo(10)],
      now: NOW,
    });
    expect(v.delayed).toBe(false);
  });

  it("shipped with no delivery after 14 days is delayed, clocked from latest shipment", () => {
    const v = evaluateOrderDelay({
      status: "shipped",
      orderDate: daysAgo(30),
      shipmentDates: [daysAgo(25), daysAgo(15)],
      now: NOW,
    });
    expect(v).toMatchObject({ delayed: true, kind: "delivery", daysOutstanding: 15 });
  });

  it("a recorded shipment switches a pre-ship status onto the delivery clock", () => {
    const v = evaluateOrderDelay({
      status: "processing",
      orderDate: daysAgo(30),
      shipmentDates: [daysAgo(3)],
      now: NOW,
    });
    expect(v.delayed).toBe(false); // shipped 3 days ago — not an unshipped delay
  });
});

describe("evaluateOrderDelay — terminal statuses", () => {
  it.each(["delivered", "completed", "cancelled", "refunded"])("%s is never delayed", (status) => {
    const v = evaluateOrderDelay({
      status,
      orderDate: daysAgo(90),
      shipmentDates: [],
      now: NOW,
    });
    expect(v).toMatchObject({ delayed: false, warning: false, kind: "none" });
  });
});

describe("delaySeverity", () => {
  it("review + delivery delays are high; unshipped escalates at 2× threshold", () => {
    const mk = (kind: "unshipped" | "in_review" | "delivery", days: number) => ({
      delayed: true,
      warning: false,
      kind,
      daysOutstanding: days,
      reason: "",
    });
    expect(delaySeverity(mk("in_review", 2))).toBe("high");
    expect(delaySeverity(mk("delivery", 15))).toBe("high");
    expect(delaySeverity(mk("unshipped", 8))).toBe("medium");
    expect(delaySeverity(mk("unshipped", 14))).toBe("high");
  });
});
