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

  // WIDENED IN DP-5. Through DP-4 every decided status regenerated freely,
  // which meant rejecting a recommendation just brought it back on the next
  // pass. These pin the new posture.
  it("suppresses regeneration while a recommendation is approved", () => {
    // An approved row is waiting on DP-6 writeback. A competing proposal for
    // the same item alongside it would make the queue ambiguous.
    expect(isStillLive({ status: "approved", expiresAt: later }, NOW)).toBe(true);
    expect(isStillLive({ status: "approved", expiresAt: earlier }, NOW)).toBe(true);
    expect(isStillLive({ status: "approved", expiresAt: null }, NOW)).toBe(true);
  });

  it("suppresses regeneration after a write-back", () => {
    expect(isStillLive({ status: "written_back", expiresAt: earlier }, NOW)).toBe(true);
  });

  it("suppresses regeneration of a rejection until its evidence goes stale", () => {
    // The reviewer rejected a price derived from THAT evidence, so re-asking
    // on the same evidence is not allowed...
    expect(isStillLive({ status: "rejected", expiresAt: later }, NOW)).toBe(true);
    // ...but once the evidence horizon passes, a fresh check may legitimately
    // produce a new proposal.
    expect(isStillLive({ status: "rejected", expiresAt: earlier }, NOW)).toBe(false);
  });

  it("still regenerates when nothing live remains to protect", () => {
    for (const status of ["expired", "failed", "draft"]) {
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
