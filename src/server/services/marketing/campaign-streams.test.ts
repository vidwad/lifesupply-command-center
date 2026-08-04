import { describe, expect, it } from "vitest";

import {
  ALL_STREAM_KEYS,
  assignStream,
  DEFAULT_B2B_SEQUENCE,
  DEFAULT_CONSUMER_SEQUENCE,
  HIGH_VALUE_LTV_THRESHOLD,
  sequenceToBodyOutline,
  STREAM_DEFINITIONS,
} from "./campaign-streams";

describe("assignStream", () => {
  it("high value beats everything — even a B2B account", () => {
    expect(
      assignStream({
        customerType: "b2b",
        lifetimeValue: HIGH_VALUE_LTV_THRESHOLD,
        daysSinceLastOrder: 30,
      }),
    ).toBe("high_value");
  });

  it("B2B / clinic / institutional route to the B2B stream regardless of recency", () => {
    for (const type of ["b2b", "clinic", "institutional"]) {
      expect(
        assignStream({ customerType: type, lifetimeValue: 100, daysSinceLastOrder: 500 }),
      ).toBe("b2b_institutional");
    }
  });

  it("consumers split by recency windows", () => {
    const consumer = (days: number | null) =>
      assignStream({ customerType: "retail", lifetimeValue: 100, daysSinceLastOrder: days });
    expect(consumer(0)).toBe("recent_buyers");
    expect(consumer(90)).toBe("recent_buyers");
    expect(consumer(91)).toBe("warm_lapsing");
    expect(consumer(365)).toBe("warm_lapsing");
    expect(consumer(366)).toBe("deep_lapsed");
    expect(consumer(730)).toBe("deep_lapsed");
    expect(consumer(731)).toBe("dormant_research");
    expect(consumer(null)).toBe("dormant_research");
  });

  it("deep-lapsed is the only stream flagged for consent review", () => {
    for (const key of ALL_STREAM_KEYS) {
      expect(STREAM_DEFINITIONS[key].requiresReview).toBe(key === "deep_lapsed");
    }
  });

  it("dormant/research is the only no-email stream; high-value is manual outreach", () => {
    expect(STREAM_DEFINITIONS.dormant_research.treatment).toBe("no_email");
    expect(STREAM_DEFINITIONS.high_value.treatment).toBe("manual_outreach");
    expect(STREAM_DEFINITIONS.b2b_institutional.treatment).toBe("email_b2b");
    expect(STREAM_DEFINITIONS.recent_buyers.treatment).toBe("email_consumer");
  });
});

describe("sequences", () => {
  it("consumer and B2B defaults are distinct sequences", () => {
    expect(DEFAULT_CONSUMER_SEQUENCE.length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_B2B_SEQUENCE.length).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_CONSUMER_SEQUENCE[0]!.subject).not.toBe(DEFAULT_B2B_SEQUENCE[0]!.subject);
  });

  it("sequenceToBodyOutline includes offer, focus, and every step", () => {
    const outline = sequenceToBodyOutline(DEFAULT_B2B_SEQUENCE, {
      offerStrategy: "10% off reorders",
      productFocus: "wound care",
    });
    expect(outline).toContain("10% off reorders");
    expect(outline).toContain("wound care");
    for (const step of DEFAULT_B2B_SEQUENCE) {
      expect(outline).toContain(step.subject);
      expect(outline).toContain(`day ${step.day}`);
    }
    expect(outline).toContain("edit before approval");
  });
});
