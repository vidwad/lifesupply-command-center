/**
 * The open-exception count is shared by the shell's bell and the dashboard
 * (2026-11-05). These hold the statuses it counts, how long it is held, and
 * that both readers take it from here rather than counting themselves.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPEN_EXCEPTION_COUNT_TTL_MS, OPEN_EXCEPTION_STATUSES } from "./open-exceptions";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const service = read("src/server/services/orders/open-exceptions.ts");
const orders = read("src/server/services/orders/index.ts");
const notifications = read("src/server/services/notifications/index.ts");
const dashboard = read("src/server/services/dashboard/index.ts");
const instrumentation = read("src/instrumentation.ts");

describe("the open-exception count", () => {
  it("counts flagged and in-review orders, and nothing resolved", () => {
    expect(OPEN_EXCEPTION_STATUSES).toEqual(["flagged", "in_review"]);
    expect(OPEN_EXCEPTION_STATUSES).not.toContain("resolved");
    expect(OPEN_EXCEPTION_STATUSES).not.toContain("none");
  });

  it("is held for a minute and served stale while the next count runs", () => {
    expect(OPEN_EXCEPTION_COUNT_TTL_MS).toBe(60_000);
    expect(service).toContain("createTtlCache<number>(OPEN_EXCEPTION_COUNT_TTL_MS, {");
    expect(service).toContain("staleWhileRevalidate: true,");
  });

  it("serves the bell and the dashboard, which no longer count for themselves", () => {
    expect(notifications).toContain("canViewOrders ? countOpenExceptions() : Promise.resolve(0)");
    expect(notifications).not.toContain("exceptionsWhere");
    expect(dashboard).toContain("const exceptionOrders = await countOpenExceptions();");
  });

  it("is marked stale when an exception is resolved", () => {
    const resolve = orders.indexOf("export async function resolveOrderException(");
    const afterUpdate = orders.indexOf('data: { exceptionStatus: "resolved"', resolve);
    const tail = orders.slice(afterUpdate, afterUpdate + 600);
    expect(tail).toContain("expireOpenExceptionCount();");
    expect(tail).toContain("expireDashboardCache();");
  });

  it("is counted as the web process starts", () => {
    expect(instrumentation).toContain("await warmOpenExceptionCount();");
  });
});
