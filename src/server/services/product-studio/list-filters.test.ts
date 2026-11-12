/**
 * Project list status filter and sort (product owner, 2026-10-27).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseListingFilter,
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
    expect(page).toContain("countProductStudioProjectsByStatus({ batchId, includeIds })");
    expect(page).toContain(
      "const carried = { batch: batchId ?? undefined, view, status, listing };",
    );
    // Date added is offered in both layouts, newest and oldest.
    expect(page).toContain('{ key: "created", dir: "desc", label: "Newest first" }');
    expect(page).toContain('{ key: "created", dir: "asc", label: "Oldest first" }');
  });
});

describe("projects whose product the store no longer lists (product owner, 2026-11-11)", () => {
  it("accepts only 'removed'", () => {
    expect(parseListingFilter("removed")).toBe("removed");
    expect(parseListingFilter("deleted")).toBeUndefined();
    expect(parseListingFilter(undefined)).toBeUndefined();
  });

  it("are out of every status view and the pill counts, and listed only under their own pill", () => {
    // The shared where clause excludes them unless the listing filter asks
    // for them; an unlinked project has no product and stays.
    expect(service).toContain('if (filter.listing === "removed") {');
    expect(service).toContain("where.product = { deletedAt: { not: null } };");
    expect(service).toContain("where.NOT = { product: { deletedAt: { not: null } } };");
    expect(service).toContain(
      'prisma.productStudioProject.count({ where: projectWhere({ ...filter, listing: "removed" }) })',
    );
    // The page: its own pill, a status never combines with it, the list and
    // the cards say so on the row.
    expect(page).toContain('label="Removed from store"');
    expect(page).toContain(
      "const status = listing ? undefined : parseProjectStatusFilter(params.status);",
    );
    expect(page).toContain(
      "listProductStudioProjects({ batchId, includeIds, status, listing, sort, dir })",
    );
    expect(page.match(/Removed from store/g)?.length).toBe(3);
  });
});
