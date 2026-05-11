import { describe, expect, it } from "vitest";

import { hasSchema, validateAiOutput } from "./output-schemas";

describe("output-schemas", () => {
  it("returns ok with null parsed for templates that have no registered schema", () => {
    expect(hasSchema("dashboard_briefing")).toBe(false);
    const r = validateAiOutput("dashboard_briefing", "anything at all");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed).toBeNull();
  });

  it("returns ok with null parsed for an unknown template key", () => {
    expect(hasSchema("__nonexistent__")).toBe(false);
    const r = validateAiOutput("__nonexistent__", "{}");
    expect(r.ok).toBe(true);
  });
});
