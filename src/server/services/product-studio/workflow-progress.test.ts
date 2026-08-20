import { describe, expect, it } from "vitest";

import {
  approvedSlotCount,
  buildWorkflowSteps,
  isWorkflowBusy,
  type WorkflowProgressInput,
} from "./workflow-progress";

const base: WorkflowProgressInput = { status: "draft", compositions: [], assets: [] };

const compositions = (statuses: string[]): WorkflowProgressInput["compositions"] =>
  statuses.map((status, index) => ({ slot: index + 1, status }));

describe("buildWorkflowSteps", () => {
  it("returns research plus four image steps", () => {
    const steps = buildWorkflowSteps(base);
    expect(steps).toHaveLength(5);
    expect(steps[0]?.key).toBe("research");
    expect(steps.slice(1).map((s) => s.key)).toEqual(["slot-1", "slot-2", "slot-3", "slot-4"]);
  });

  it("marks a fresh draft as entirely pending", () => {
    expect(buildWorkflowSteps(base).every((s) => s.state === "pending")).toBe(true);
  });

  it("shows research running before any composition exists", () => {
    for (const status of ["research_queued", "researching"]) {
      const steps = buildWorkflowSteps({ ...base, status });
      expect(steps[0]?.state).toBe("running");
    }
  });

  it("treats research as done once composition briefs exist", () => {
    const steps = buildWorkflowSteps({
      ...base,
      status: "ready_to_generate",
      compositions: compositions(["planned", "planned", "planned", "planned"]),
    });
    expect(steps[0]?.state).toBe("done");
    expect(steps[0]?.detail).toContain("4 composition briefs");
  });

  it("reports research failure only when no composition was produced", () => {
    expect(buildWorkflowSteps({ ...base, status: "failed" })[0]?.state).toBe("failed");
    const afterResearch = buildWorkflowSteps({
      ...base,
      status: "failed",
      compositions: compositions(["generated", "failed", "planned", "planned"]),
    });
    expect(afterResearch[0]?.state).toBe("done");
    expect(afterResearch[2]?.state).toBe("failed");
  });

  it("maps composition status onto the matching image step", () => {
    const steps = buildWorkflowSteps({
      ...base,
      status: "generating",
      compositions: compositions(["generated", "generating", "failed", "planned"]),
    });
    expect(steps[1]?.state).toBe("done");
    expect(steps[2]?.state).toBe("running");
    expect(steps[3]?.state).toBe("failed");
    expect(steps[4]?.state).toBe("pending");
  });

  it("surfaces the review state of a generated image", () => {
    const input: WorkflowProgressInput = {
      status: "needs_review",
      compositions: compositions(["generated", "generated", "generated", "generated"]),
      assets: [
        { kind: "generated", compositionSlot: 1, status: "approved" },
        { kind: "generated", compositionSlot: 2, status: "rejected" },
        { kind: "generated", compositionSlot: 3, status: "needs_review" },
      ],
    };
    const steps = buildWorkflowSteps(input);
    expect(steps[1]?.detail).toBe("Approved");
    expect(steps[2]?.detail).toContain("Rejected");
    expect(steps[3]?.detail).toBe("Awaiting your review");
  });

  it("uses the newest revision, which sorts first", () => {
    const input: WorkflowProgressInput = {
      status: "needs_review",
      compositions: compositions(["generated"]),
      assets: [
        { kind: "generated", compositionSlot: 1, status: "needs_review" },
        { kind: "generated", compositionSlot: 1, status: "rejected" },
      ],
    };
    expect(buildWorkflowSteps(input)[1]?.detail).toBe("Awaiting your review");
  });

  it("ignores source photographs when reading review state", () => {
    const input: WorkflowProgressInput = {
      status: "needs_review",
      compositions: compositions(["generated"]),
      assets: [
        { kind: "source", compositionSlot: 1, status: "uploaded" },
        { kind: "generated", compositionSlot: 1, status: "approved" },
      ],
    };
    expect(buildWorkflowSteps(input)[1]?.detail).toBe("Approved");
  });
});

describe("isWorkflowBusy", () => {
  it("is true while research runs, even though no composition exists yet", () => {
    // Regression: the page previously derived busyness from compositions only,
    // so the whole research phase rendered as idle with no progress shown.
    expect(isWorkflowBusy({ ...base, status: "researching" })).toBe(true);
    expect(isWorkflowBusy({ ...base, status: "research_queued" })).toBe(true);
  });

  it("is true while any composition is queued or generating", () => {
    expect(
      isWorkflowBusy({ ...base, status: "generating", compositions: compositions(["queued"]) }),
    ).toBe(true);
  });

  it("is false at rest", () => {
    expect(isWorkflowBusy(base)).toBe(false);
    expect(
      isWorkflowBusy({
        ...base,
        status: "needs_review",
        compositions: compositions(["generated", "generated"]),
      }),
    ).toBe(false);
    expect(isWorkflowBusy({ ...base, status: "failed" })).toBe(false);
  });
});

describe("approvedSlotCount", () => {
  it("counts only approved current revisions", () => {
    expect(
      approvedSlotCount({
        ...base,
        assets: [
          { kind: "generated", compositionSlot: 1, status: "approved" },
          { kind: "generated", compositionSlot: 2, status: "approved" },
          { kind: "generated", compositionSlot: 3, status: "needs_review" },
          { kind: "source", compositionSlot: null, status: "uploaded" },
        ],
      }),
    ).toBe(2);
  });

  it("is zero for an untouched project", () => {
    expect(approvedSlotCount(base)).toBe(0);
  });
});

describe("isWorkflowBusy as the delete guard", () => {
  // deleteProductStudioProject refuses while a worker job is in flight, or the
  // job would write to rows that no longer exist. It calls isWorkflowBusy with
  // an empty assets list, so the guard must not depend on assets at all.
  const guard = (status: string, compositionStatuses: string[] = []) =>
    isWorkflowBusy({
      status,
      compositions: compositionStatuses.map((s, i) => ({ slot: i + 1, status: s })),
      assets: [],
    });

  it("blocks deletion while research or generation is running", () => {
    expect(guard("research_queued")).toBe(true);
    expect(guard("researching")).toBe(true);
    expect(guard("ready_to_generate", ["queued"])).toBe(true);
    expect(guard("generating", ["generated", "generating"])).toBe(true);
  });

  it("allows deletion at every resting state", () => {
    expect(guard("draft")).toBe(false);
    expect(guard("failed")).toBe(false);
    expect(guard("ready_to_generate", ["planned", "planned"])).toBe(false);
    expect(guard("needs_review", ["generated", "generated"])).toBe(false);
    expect(guard("approved", ["generated", "generated", "generated", "generated"])).toBe(false);
    expect(guard("archived")).toBe(false);
  });

  it("allows deletion of a half-finished project that is not running", () => {
    expect(guard("needs_review", ["generated", "failed", "planned", "planned"])).toBe(false);
  });
});
