/**
 * Project list status filter and sort (product owner, 2026-10-27).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseProjectStatusFilter,
  PROJECT_STATUS_FILTER_KEYS,
  PROJECT_STATUS_FILTERS,
} from "./index";

const service = readFileSync(join(__dirname, "index.ts"), "utf8").replace(/\r\n/g, "\n");
const page = readFileSync(
  join(__dirname, "..", "..", "..", "app", "(dashboard)", "products", "studio", "page.tsx"),
  "utf8",
).replace(/\r\n/g, "\n");

describe("the project status filter", () => {
  it("covers every status exactly once, except archived", () => {
    const all = PROJECT_STATUS_FILTER_KEYS.flatMap((key) => [...PROJECT_STATUS_FILTERS[key]]);
    expect(new Set(all).size).toBe(all.length);
    expect(all.sort()).toEqual(
      [
        "draft",
        "research_queued",
        "researching",
        "ready_to_generate",
        "generating",
        "needs_review",
        "approved",
        "failed",
      ].sort(),
    );
  });

  it("accepts only its own keys", () => {
    expect(parseProjectStatusFilter("approved")).toBe("approved");
    expect(parseProjectStatusFilter("in_progress")).toBe("in_progress");
    expect(parseProjectStatusFilter("researching")).toBeUndefined();
    expect(parseProjectStatusFilter("toString")).toBeUndefined();
    expect(parseProjectStatusFilter(undefined)).toBeUndefined();
  });

  it("the list and the pill counts share one where clause, and the page carries the filter", () => {
    expect(service.match(/where: projectWhere\(filter\)/g)?.length).toBe(2);
    expect(page).toContain("countProductStudioProjectsByStatus({ batchId })");
    expect(page).toContain("const carried = { batch: batchId ?? undefined, view, status };");
    // Date added is offered in both layouts, newest and oldest.
    expect(page).toContain('{ key: "created", dir: "desc", label: "Newest first" }');
    expect(page).toContain('{ key: "created", dir: "asc", label: "Oldest first" }');
  });
});
