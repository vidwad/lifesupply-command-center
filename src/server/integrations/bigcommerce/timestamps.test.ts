import { describe, expect, it } from "vitest";

import { bigCommerceTimestamp, bigCommerceTimestampOrUndefined } from "./timestamps";

describe("bigCommerceTimestamp", () => {
  it("drops the milliseconds BigCommerce rejects", () => {
    // The exact watermark that produced HTTP 422 in production on 2026-08-23.
    expect(bigCommerceTimestamp(new Date("2026-05-15T01:57:42.796Z"))).toBe("2026-05-15T01:57:42Z");
  });

  it("never emits a fractional second, whatever the input", () => {
    for (const ms of [0, 1, 499, 500, 501, 999]) {
      const out = bigCommerceTimestamp(new Date(Date.UTC(2026, 4, 15, 1, 57, 42, ms)));
      expect(out).toBe("2026-05-15T01:57:42Z");
      expect(out).not.toContain(".");
    }
  });

  it("truncates rather than rounds, so the watermark never moves forward", () => {
    // Rounding 999ms up would advance the watermark a full second and could
    // skip a record modified inside that gap.
    const at999 = new Date("2026-05-15T01:57:42.999Z");
    expect(bigCommerceTimestamp(at999)).toBe("2026-05-15T01:57:42Z");
    expect(new Date(bigCommerceTimestamp(at999)).getTime()).toBeLessThanOrEqual(at999.getTime());
  });

  it("produces a value the API's own grammar accepts", () => {
    const out = bigCommerceTimestamp(new Date("2026-01-02T03:04:05.678Z"));
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    // Round-trips to the same second.
    expect(new Date(out).toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });

  it("keeps UTC regardless of the host timezone", () => {
    // Constructed from a non-UTC offset; the output must still be Z.
    expect(bigCommerceTimestamp(new Date("2026-05-15T01:57:42.796+05:00"))).toBe(
      "2026-05-14T20:57:42Z",
    );
  });

  it("refuses an invalid date instead of emitting 'Invalid Date'", () => {
    expect(() => bigCommerceTimestamp(new Date("nonsense"))).toThrow(RangeError);
  });

  it("refuses a year outside the four-digit form rather than emitting a malformed filter", () => {
    // toISOString() switches to ±YYYYYY here, which would silently produce a
    // filter value BigCommerce cannot parse.
    expect(() => bigCommerceTimestamp(new Date(Date.UTC(12026, 0, 1)))).toThrow(RangeError);
  });
});

describe("bigCommerceTimestampOrUndefined", () => {
  it("passes through null and undefined so it can be spread into optional args", () => {
    expect(bigCommerceTimestampOrUndefined(null)).toBeUndefined();
    expect(bigCommerceTimestampOrUndefined(undefined)).toBeUndefined();
  });

  it("formats a real date the same way", () => {
    expect(bigCommerceTimestampOrUndefined(new Date("2026-05-15T01:57:42.796Z"))).toBe(
      "2026-05-15T01:57:42Z",
    );
  });
});
