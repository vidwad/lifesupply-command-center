/**
 * Stuck-sync classifier tests (Phase 11D — row 11D-20 / GATE-02).
 */
import { describe, expect, it } from "vitest";

import { classifySyncRun, STUCK_SYNC_THRESHOLD_MS } from "./stuck-syncs";

const NOW = new Date("2026-08-05T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const HOUR = 60 * 60 * 1000;

describe("classifySyncRun", () => {
  it("terminal statuses are never stuck, regardless of age", () => {
    for (const status of ["success", "failed", "partial"]) {
      expect(classifySyncRun({ status, startedAt: ago(100 * HOUR) }, NOW)).toBe("terminal");
    }
  });

  it("a recent running sync is fresh", () => {
    expect(classifySyncRun({ status: "running", startedAt: ago(HOUR) }, NOW)).toBe("running_fresh");
  });

  it("a running sync just under the threshold is still fresh", () => {
    expect(
      classifySyncRun({ status: "running", startedAt: ago(STUCK_SYNC_THRESHOLD_MS - 1) }, NOW),
    ).toBe("running_fresh");
  });

  it("a running sync at or past the threshold is stuck", () => {
    expect(
      classifySyncRun({ status: "running", startedAt: ago(STUCK_SYNC_THRESHOLD_MS) }, NOW),
    ).toBe("running_stuck");
    expect(classifySyncRun({ status: "running", startedAt: ago(48 * HOUR) }, NOW)).toBe(
      "running_stuck",
    );
  });

  it("threshold is six hours — bounded full syncs finish well within it", () => {
    expect(STUCK_SYNC_THRESHOLD_MS).toBe(6 * HOUR);
  });

  it("a custom threshold is respected", () => {
    expect(classifySyncRun({ status: "running", startedAt: ago(HOUR) }, NOW, HOUR)).toBe(
      "running_stuck",
    );
  });
});
