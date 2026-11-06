import { describe, expect, it } from "vitest";

import { draftsFromToolCalls, normaliseTaskDraft } from "./task-draft";

describe("normaliseTaskDraft", () => {
  it("keeps the task fields, defaults the priority, and drops what does not fit the schema", () => {
    expect(
      normaliseTaskDraft({
        title: "  Call Dr. Lee about order 76507 ",
        description: "Confirm the delivery date.",
        priority: "high",
        dueDate: "2026-11-10",
        relatedEntityType: "Order",
        relatedEntityId: "ord_1",
        extra: "ignored",
      }),
    ).toEqual({
      title: "Call Dr. Lee about order 76507",
      description: "Confirm the delivery date.",
      priority: "high",
      dueDate: "2026-11-10",
      relatedEntityType: "Order",
      relatedEntityId: "ord_1",
    });
    expect(normaliseTaskDraft({ title: "x", priority: "asap", dueDate: "tomorrow" })).toEqual({
      title: "x",
      priority: "medium",
    });
    expect(
      normaliseTaskDraft({ title: "x", relatedEntityType: "Invoice", relatedEntityId: "1" }),
    ).toEqual({
      title: "x",
      priority: "medium",
    });
  });

  it("is null without a title", () => {
    expect(normaliseTaskDraft({ description: "no title" })).toBeNull();
    expect(normaliseTaskDraft(null)).toBeNull();
    expect(normaliseTaskDraft("x")).toBeNull();
  });
});

describe("draftsFromToolCalls", () => {
  it("takes every draft_task that ran, in order, and nothing else", () => {
    expect(
      draftsFromToolCalls([
        { name: "sales_overview", arguments: {} },
        { name: "draft_task", arguments: { title: "First" } },
        { name: "draft_task", arguments: { title: "Refused" }, skipped: "not permitted" },
        { name: "draft_task", arguments: { title: "Second", priority: "low" } },
        { name: "draft_task", arguments: {} },
      ]),
    ).toEqual([
      { title: "First", priority: "medium" },
      { title: "Second", priority: "low" },
    ]);
  });
});
