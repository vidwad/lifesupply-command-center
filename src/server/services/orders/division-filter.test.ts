/**
 * The Orders screen honours the app shell's Division selector (2026-11-03).
 *
 * The selector writes `?division=<id>` to the address. Before this the
 * Orders page ignored it, and every link the page built dropped it, so the
 * selector appeared to do nothing there. These pin the three places that
 * must agree: the service filter, the page, and the CSV export.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

describe("the orders service filters by division", () => {
  const service = read("src/server/services/orders/index.ts");

  it("accepts a divisionId and applies it in both the list and the count", () => {
    expect(service).toContain("divisionId?: string;");
    const applied = service.match(
      /if \(filters\.divisionId\) where\.divisionId = filters\.divisionId;/g,
    );
    expect(applied).toHaveLength(2);
  });
});

describe("the Orders page reads the selector and carries it everywhere", () => {
  const page = read("src/app/(dashboard)/orders/page.tsx");

  it("passes the division to the service", () => {
    expect(page).toContain("divisionId: params.division?.trim() || undefined,");
  });

  it("carries the division on the status chips, the exceptions toggle, the search form, pagination and the export", () => {
    // One helper builds every address from the carried set, which includes
    // the division; the rebuilt-from-scratch URLSearchParams are gone.
    expect(page).toContain("division: params.division?.trim() || undefined,");
    expect(page).toContain("ordersHref({ ...carry, status: f.value || undefined })");
    expect(page).toContain('ordersHref({ ...carry, exceptions: active ? undefined : "1" })');
    expect(page).toContain('<input type="hidden" name="division" value={carry.division} />');
    expect(page).toContain("params={carry}");
    expect(page).toContain("division: carry.division");
    expect(page).not.toMatch(/const next = new URLSearchParams\(\);\s*if \(f\.value\)/);
  });
});

describe("the orders export filters by the same division", () => {
  it("reads the division from the address and applies it", () => {
    const route = read("src/app/api/exports/orders/route.ts");
    expect(route).toContain('searchParams.get("division")');
    expect(route).toContain("...(divisionId ? { divisionId } : {}),");
  });
});
