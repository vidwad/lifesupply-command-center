/**
 * DP-4 service-level rules that can be tested without a database.
 *
 * Duplicate suppression and currency resolution decide whether work happens at
 * all, so they are worth pinning independently of the calculation engine.
 */
import { describe, expect, it } from "vitest";

import { isStillLive, runCurrencyFrom } from "./recommendations";

const NOW = new Date("2026-08-21T12:00:00.000Z");
const later = new Date(NOW.getTime() + 60 * 60 * 1000);
const earlier = new Date(NOW.getTime() - 60 * 60 * 1000);

describe("duplicate suppression", () => {
  it("treats an unexpired ready_for_review recommendation as live", () => {
    expect(isStillLive({ status: "ready_for_review", expiresAt: later }, NOW)).toBe(true);
  });

  it("treats a ready_for_review recommendation with no expiry as live", () => {
    expect(isStillLive({ status: "ready_for_review", expiresAt: null }, NOW)).toBe(true);
  });

  it("does not treat an expired recommendation as live", () => {
    expect(isStillLive({ status: "ready_for_review", expiresAt: earlier }, NOW)).toBe(false);
  });

  it("does not block regeneration after a decision or expiry", () => {
    for (const status of ["approved", "rejected", "expired", "written_back", "failed", "draft"]) {
      expect(isStillLive({ status, expiresAt: later }, NOW), status).toBe(false);
    }
  });
});

describe("run currency", () => {
  it("reads a configured currency and normalises its case", () => {
    expect(runCurrencyFrom({ currency: "cad" })).toBe("CAD");
  });

  it("returns null when nothing is configured", () => {
    expect(runCurrencyFrom(null)).toBeNull();
    expect(runCurrencyFrom({})).toBeNull();
    expect(runCurrencyFrom({ currency: "  " })).toBeNull();
    expect(runCurrencyFrom([{ currency: "CAD" }])).toBeNull();
    expect(runCurrencyFrom("CAD")).toBeNull();
  });
});
