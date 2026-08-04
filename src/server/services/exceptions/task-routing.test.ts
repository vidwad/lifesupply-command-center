import { describe, expect, it } from "vitest";

import { BULK_TASK_CAP, buildTaskDraftFromException } from "./task-routing";

const base = {
  id: "ex_1",
  title: "Order delayed (unshipped): LS-1042",
  description: "Unshipped 9 days after order date (threshold 7d).",
  severity: "high" as const,
  entityType: "order",
  entityId: "ord_1",
};

describe("buildTaskDraftFromException", () => {
  it("maps severity to priority and entity to a Task relation", () => {
    const draft = buildTaskDraftFromException(base);
    expect(draft.priority).toBe("high");
    expect(draft.relatedEntityType).toBe("Order");
    expect(draft.relatedEntityId).toBe("ord_1");
    expect(draft.title).toBe("Resolve exception: Order delayed (unshipped): LS-1042");
    expect(draft.description).toContain("Unshipped 9 days");
    expect(draft.description).toContain("ex_1");
  });

  it("maps every severity level", () => {
    for (const [severity, priority] of [
      ["low", "low"],
      ["medium", "medium"],
      ["high", "high"],
      ["urgent", "urgent"],
    ] as const) {
      expect(buildTaskDraftFromException({ ...base, severity }).priority).toBe(priority);
    }
  });

  it("drops the relation for entity types Task cannot reference", () => {
    const draft = buildTaskDraftFromException({
      ...base,
      entityType: "supplier_product",
      entityId: "sp_1",
    });
    expect(draft.relatedEntityType).toBeNull();
    expect(draft.relatedEntityId).toBeNull();
  });

  it("handles null entity and description", () => {
    const draft = buildTaskDraftFromException({
      ...base,
      description: null,
      entityType: null,
      entityId: null,
    });
    expect(draft.relatedEntityType).toBeNull();
    expect(draft.description).toContain("Created from exception");
  });

  it("truncates absurd titles to the Task limit", () => {
    const draft = buildTaskDraftFromException({ ...base, title: "x".repeat(500) });
    expect(draft.title.length).toBe(200);
  });
});

describe("BULK_TASK_CAP", () => {
  it("is pinned so 'select all' stays bounded", () => {
    expect(BULK_TASK_CAP).toBe(20);
  });
});
