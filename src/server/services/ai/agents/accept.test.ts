import { describe, expect, it } from "vitest";

import { buildTaskDraftFromRecommendation } from "./accept";

describe("buildTaskDraftFromRecommendation", () => {
  const base = {
    agentName: "Fulfillment Exception Agent",
    runId: "run_1",
    recommendation: {
      title: "Chase BBM01 backlog",
      detail: "Three orders are stuck awaiting supplier confirmation.",
      suggestedTask: { title: "Call BBM01 about backlog", priority: "high" as const },
      requiresApproval: false,
    },
  };

  it("prefers the suggested task title and priority", () => {
    const draft = buildTaskDraftFromRecommendation(base);
    expect(draft.title).toBe("Call BBM01 about backlog");
    expect(draft.priority).toBe("high");
    expect(draft.description).toContain("stuck awaiting supplier");
    expect(draft.description).toContain("run_1");
    expect(draft.description).toMatch(/suggestions, not decisions/);
  });

  it("falls back to the recommendation title and medium priority", () => {
    const draft = buildTaskDraftFromRecommendation({
      ...base,
      recommendation: { title: "Review margins", detail: "Margins slipped." },
    });
    expect(draft.title).toBe("Review margins");
    expect(draft.priority).toBe("medium");
  });

  it("flags approval-required recommendations in the task description", () => {
    const draft = buildTaskDraftFromRecommendation({
      ...base,
      recommendation: { ...base.recommendation, requiresApproval: true },
    });
    expect(draft.description).toMatch(/approval workflow/);
  });
});
