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
  CUSTOMER_SORT_KEYS,
  customerOrderBy,
  parseCustomerSort,
  parseSortDirection,
} from "./index";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8").replace(/\r\n/g, "\n");
const page = read("src/app/(dashboard)/customers/page.tsx");
const migration = read(
  "prisma/migrations/20261102230000_customers_default_list_index/migration.sql",
);
const schema = read("prisma/schema.prisma");

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

describe("the order builder", () => {
  it("ends every ordering with the id, so paging is deterministic", () => {
    for (const key of [...CUSTOMER_SORT_KEYS, undefined]) {
      for (const dir of ["asc", "desc"] as const) {
        const order = customerOrderBy(key, dir);
        expect(order.at(-1)).toEqual({ id: "asc" });
      }
    }
  });

  it("puts customers with no last order or no score last in both directions", () => {
    expect(customerOrderBy("lastOrder", "desc")[0]).toEqual({
      lastOrderAt: { sort: "desc", nulls: "last" },
    });
    expect(customerOrderBy("lastOrder", "asc")[0]).toEqual({
      lastOrderAt: { sort: "asc", nulls: "last" },
    });
    expect(customerOrderBy("reactivation", "desc")[0]).toEqual({
      reactivationScore: { sort: "desc", nulls: "last" },
    });
  });

  it("orders names the way the display name is derived: company, then person, then email", () => {
    const keys = customerOrderBy("name", "asc").map((clause) => Object.keys(clause)[0]);
    expect(keys).toEqual(["companyName", "lastName", "firstName", "email", "id"]);
  });

  it("defaults to the most recent order first, never-ordered customers last", () => {
    expect(customerOrderBy(undefined, "asc")).toEqual([
      { lastOrderAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
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

  it("filters by type, consent and store, and carries them through search, sort and paging", () => {
    expect(page).toContain("CONSENT_FILTERS");
    expect(page).toContain("storeId");
    expect(page).toContain('name="store"');
    expect(page).toContain("params={carried}");
    expect(page).toContain("params={{ ...carried, sort");
  });
});
