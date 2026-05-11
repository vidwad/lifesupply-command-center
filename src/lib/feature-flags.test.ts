import { describe, expect, it } from "vitest";

import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAGS,
  FEATURE_FLAG_DESCRIPTIONS,
} from "./feature-flags";

describe("FEATURE_FLAGS catalog", () => {
  it("exposes a flag for each high-risk capability called out in CLAUDE.md §16", () => {
    expect(FEATURE_FLAGS.SUPPLIER_AUTOMATION).toBe("supplier.automation");
    expect(FEATURE_FLAGS.EXTERNAL_WRITEBACKS).toBe("external.writebacks");
    expect(FEATURE_FLAGS.AI_ACTIONS).toBe("ai.actions");
    expect(FEATURE_FLAGS.MAILCHIMP_SEND).toBe("mailchimp.send");
  });

  it("uses module.action key shape for every flag", () => {
    for (const key of ALL_FEATURE_FLAG_KEYS) {
      expect(key).toMatch(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/);
    }
  });

  it("has no duplicate keys", () => {
    const set = new Set(ALL_FEATURE_FLAG_KEYS);
    expect(set.size).toBe(ALL_FEATURE_FLAG_KEYS.length);
  });

  it("has a description for every flag (used by the admin UI)", () => {
    for (const key of ALL_FEATURE_FLAG_KEYS) {
      expect(FEATURE_FLAG_DESCRIPTIONS[key]).toBeTruthy();
      expect(FEATURE_FLAG_DESCRIPTIONS[key].length).toBeGreaterThan(10);
    }
  });
});
