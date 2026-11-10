/**
 * Sorting and filtering the customers list (product owner, 2026-11-02).
 *
 * Every column header sorts in the database across the whole matching set,
 * the type, consent and store filters narrow it, and the default order has
 * an index. These hold the order builder's invariants and the page's use of
 * the shared header in place.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CUSTOMER_COUNT_MAX_ENTRIES,
  CUSTOMER_COUNT_TTL_MS,
  CUSTOMER_SORT_KEYS,
  customerCountKey,
  customerOrderBy,
  LAST_ORDER_FILTER_LABELS,
  LAST_ORDER_FILTERS,
  lastOrderWhere,
  parseCustomerSort,
  parseLastOrderFilter,
  parseSortDirection,
} from "./index";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8").replace(/\r\n/g, "\n");
const page = read("src/app/(dashboard)/customers/page.tsx");
const migration = read(
  "prisma/migrations/20261102230000_customers_default_list_index/migration.sql",
);
const schema = read("prisma/schema.prisma");
const service = read("src/server/services/customers/index.ts");
const instrumentation = read("src/instrumentation.ts");
const exportRoute = read("src/app/api/exports/customers/route.ts");

describe("parsing the sort from the query string", () => {
  it("accepts the supported keys only", () => {
    for (const key of CUSTOMER_SORT_KEYS) expect(parseCustomerSort(key)).toBe(key);
    expect(parseCustomerSort("lifetimeValue")).toBeUndefined();
    expect(parseCustomerSort("")).toBeUndefined();
    expect(parseCustomerSort(undefined)).toBeUndefined();
  });

  it("reads descending only when asked, and ascending otherwise", () => {
    expect(parseSortDirection("desc")).toBe("desc");
    expect(parseSortDirection("asc")).toBe("asc");
    expect(parseSortDirection("DESC")).toBe("asc");
    expect(parseSortDirection(undefined)).toBe("asc");
  });
});

describe("the last-order filter (product owner, 2026-11-10)", () => {
  // A fixed instant, so the boundaries below are exact.
  const now = new Date("2026-11-10T15:00:00.000Z");

  it("accepts the seven buckets only, each with a label for the pill", () => {
    for (const key of LAST_ORDER_FILTERS) {
      expect(parseLastOrderFilter(key)).toBe(key);
      expect(LAST_ORDER_FILTER_LABELS[key]).toBeTruthy();
    }
    expect(parseLastOrderFilter("7d")).toBeUndefined();
    expect(parseLastOrderFilter("")).toBeUndefined();
    expect(parseLastOrderFilter(undefined)).toBeUndefined();
  });

  it("reads the day buckets as 'within the last N days'", () => {
    expect(lastOrderWhere("30d", now)).toEqual({ gte: new Date("2026-10-11T15:00:00.000Z") });
    expect(lastOrderWhere("60d", now)).toEqual({ gte: new Date("2026-09-11T15:00:00.000Z") });
    expect(lastOrderWhere("90d", now)).toEqual({ gte: new Date("2026-08-12T15:00:00.000Z") });
  });

  it("reads the month buckets as calendar months, and 'older' as the far side of 24", () => {
    expect(lastOrderWhere("12m", now)).toEqual({ gte: new Date("2025-11-10T15:00:00.000Z") });
    expect(lastOrderWhere("24m", now)).toEqual({ gte: new Date("2024-11-10T15:00:00.000Z") });
    // The two 24-month buckets share one boundary, so every customer who
    // has ordered is in exactly one of them.
    expect(lastOrderWhere("older", now)).toEqual({ lt: new Date("2024-11-10T15:00:00.000Z") });
  });

  it("reads 'never' as no last order at all", () => {
    expect(lastOrderWhere("never", now)).toBeNull();
  });

  it("is applied by the list and the count through the shared where clause", () => {
    expect(service).toContain(
      "if (filters.lastOrder) where.lastOrderAt = lastOrderWhere(filters.lastOrder);",
    );
  });

  it("narrows the CSV export the same way, and the audit row says so", () => {
    expect(exportRoute).toContain(
      "...(lastOrder ? { lastOrderAt: lastOrderWhere(lastOrder) } : {}),",
    );
    expect(exportRoute).toContain("consent, customerType, lastOrder }");
    expect(page).toContain("...(active.last && { last: active.last }),");
  });
});

describe("the order builder", () => {
  it("ends every ordering with the id, so paging is deterministic", () => {
    for (const key of [...CUSTOMER_SORT_KEYS, undefined]) {
      for (const dir of ["asc", "desc"] as const) {
        const order = customerOrderBy(key, dir);
        expect(order.at(-1)).toEqual({ id: "asc" });
      }
    }
  });

  it("begins every ordering with the soft-delete column, so the index can serve the sort", () => {
    // Postgres only drops a leading index column from the sort match on an
    // equality, and `deletedAt IS NULL` is not one; naming the column first
    // changes nothing about the result and lets the index stop after a page.
    for (const key of [...CUSTOMER_SORT_KEYS, undefined]) {
      for (const dir of ["asc", "desc"] as const) {
        expect(customerOrderBy(key, dir)[0]).toEqual({ deletedAt: "asc" });
      }
    }
  });

  it("puts customers with no last order or no score last in both directions", () => {
    expect(customerOrderBy("lastOrder", "desc")[1]).toEqual({
      lastOrderAt: { sort: "desc", nulls: "last" },
    });
    expect(customerOrderBy("lastOrder", "asc")[1]).toEqual({
      lastOrderAt: { sort: "asc", nulls: "last" },
    });
    expect(customerOrderBy("reactivation", "desc")[1]).toEqual({
      reactivationScore: { sort: "desc", nulls: "last" },
    });
  });

  it("orders names the way the display name is derived: company, then person, then email", () => {
    const keys = customerOrderBy("name", "asc").map((clause) => Object.keys(clause)[0]);
    expect(keys).toEqual(["deletedAt", "companyName", "lastName", "firstName", "email", "id"]);
  });

  it("defaults to the most recent order first, never-ordered customers last", () => {
    expect(customerOrderBy(undefined, "asc")).toEqual([
      { deletedAt: "asc" },
      { lastOrderAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });
});

describe("the shared count", () => {
  it("is held for a minute per filter combination, eight combinations at a time", () => {
    expect(CUSTOMER_COUNT_TTL_MS).toBe(60_000);
    expect(CUSTOMER_COUNT_MAX_ENTRIES).toBe(8);
    expect(service).toContain("createKeyedTtlCache<number>(CUSTOMER_COUNT_TTL_MS, {");
    expect(service).toContain("staleWhileRevalidate: true,");
    expect(service).toContain("countCache.get(customerCountKey(filters), () =>");
  });

  it("keys the count by the filters alone, not by page, sort or direction", () => {
    const base = customerCountKey({ customerType: "b2b", search: "clinic" });
    expect(customerCountKey({ customerType: "b2b", search: " clinic ", page: 7 })).toBe(base);
    expect(
      customerCountKey({ customerType: "b2b", search: "clinic", sort: "value", dir: "desc" }),
    ).toBe(base);
    expect(customerCountKey({ customerType: "retail", search: "clinic" })).not.toBe(base);
    expect(
      customerCountKey({ customerType: "b2b", search: "clinic", consent: "subscribed" }),
    ).not.toBe(base);
    expect(customerCountKey({ customerType: "b2b", search: "clinic", storeId: "s1" })).not.toBe(
      base,
    );
    expect(customerCountKey({ customerType: "b2b", search: "clinic", lastOrder: "90d" })).not.toBe(
      base,
    );
    // A blank search is no search.
    expect(customerCountKey({ search: "   " })).toBe(customerCountKey({}));
  });

  it("is counted as the web process starts, and the page says the total may trail a sync", () => {
    expect(instrumentation).toContain("await warmCustomerCount();");
    expect(page).toContain("the header total can trail a sync by that long");
  });
});

describe("the default order's index", () => {
  it("matches the default ORDER BY, nulls last included, in the migration and the schema", () => {
    expect(migration).toContain(
      'ON "customers"("deletedAt", "lastOrderAt" DESC NULLS LAST, "createdAt" DESC, "id")',
    );
    expect(schema).toContain(
      "@@index([deletedAt, lastOrderAt(sort: Desc), createdAt(sort: Desc), id])",
    );
  });
});

describe("the customers page", () => {
  it("sorts by every supported key through the shared header", () => {
    for (const key of CUSTOMER_SORT_KEYS) expect(page).toContain(`"${key}"`);
    expect(page).toContain("<SortHeader");
    // Money, counts, dates and scores open descending: ascending would lead
    // with every customer who has nothing.
    for (const key of ["value", "orders", "lastOrder", "reactivation"]) {
      expect(page).toMatch(new RegExp(`"${key}", \{[^}]*defaultDir: "desc"`));
    }
  });

  it("filters by type, consent, store and last order, and carries them through search, sort and paging", () => {
    expect(page).toContain("CONSENT_FILTERS");
    expect(page).toContain("storeId");
    expect(page).toContain('name="store"');
    expect(page).toContain("LAST_ORDER_FILTERS.map((f) => (");
    expect(page).toContain('name="last"');
    expect(page).toContain("last: active.last || undefined,");
    expect(page).toContain('filterHref({ type: "", consent: "", store: "", last: "", q: "" })');
    expect(page).toContain("params={carried}");
    expect(page).toContain("params={{ ...carried, sort");
  });
});
