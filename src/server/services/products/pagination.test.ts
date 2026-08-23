/**
 * Paging and filter-parity checks for the products list.
 *
 * The list previously had a hardcoded `take: 100` and no pagination, while the
 * page header rendered `products.length` as the total. With 14 seed rows that
 * was invisible; against a 36,000-product catalogue it would have reported
 * "100 products" and offered no way to reach the rest (docs/35 F-14).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRODUCTS_PAGE_SIZE } from "./index";

const service = readFileSync(join(__dirname, "index.ts"), "utf8").replace(/\r\n/g, "\n");
const page = readFileSync(
  join(__dirname, "..", "..", "..", "app", "(dashboard)", "products", "page.tsx"),
  "utf8",
).replace(/\r\n/g, "\n");

describe("products paging", () => {
  it("pages at the same size as the other list pages", () => {
    expect(PRODUCTS_PAGE_SIZE).toBe(50);
  });

  it("no longer caps the list at a hardcoded 100", () => {
    expect(service).not.toContain("take: 100");
    expect(service).toContain("take: PRODUCTS_PAGE_SIZE");
    expect(service).toContain("skip: (page - 1) * PRODUCTS_PAGE_SIZE");
  });

  it("orders by a unique tiebreaker so rows cannot swap between pages", () => {
    // Without a unique final sort key, two products sharing a name can
    // reorder between queries and one is never shown on any page.
    expect(service).toContain('{ id: "asc" }');
  });

  it("clamps a nonsensical page number instead of computing a negative skip", () => {
    // A negative skip is a Prisma error; page 0 or -3 must floor to page 1.
    expect(service).toContain("Math.max(1, Math.trunc(filters.page ?? 1))");
  });
});

describe("count and list agree", () => {
  it("builds both from one shared where clause", () => {
    // If these drifted, the footer would page through a different population
    // than the rows being listed.
    expect(service).toContain("function productWhere(");
    expect(service).toContain("prisma.product.count({ where: productWhere(filters) })");
    expect(service).toContain("const where = productWhere(filters);");
  });

  it("the header total comes from the count, not from the current page's length", () => {
    expect(page).toContain("countProducts(filters)");
    expect(page).toContain("totalProducts.toLocaleString()");
    expect(page).not.toContain("${products.length} ${products.length === 1");
  });
});

describe("division scoping", () => {
  it("is a real filter on the query", () => {
    expect(service).toContain("if (filters.divisionId) where.divisionId = filters.divisionId;");
  });

  it("is read from the shell's search param by the page", () => {
    expect(page).toContain("divisionId: params.division?.trim() || undefined");
  });

  it("treats an empty division param as all divisions", () => {
    // `?division=` with no value must not scope the list to nothing.
    expect(page).toContain("params.division?.trim() || undefined");
  });
});

describe("filters survive navigation", () => {
  it("carries the search term and division across the filter pills", () => {
    // Clicking "Missing images" used to drop both.
    expect(page).toContain("const pillHref =");
    expect(page).toContain('qs.set("q", params.q)');
    expect(page).toContain('qs.set("division", params.division)');
  });

  it("keeps the division on the search form", () => {
    expect(page).toContain('<input type="hidden" name="division" value={params.division} />');
  });

  it("passes every active filter to the pagination footer", () => {
    expect(page).toContain(
      "params={{ q: params.q, flag: params.flag, division: params.division }}",
    );
  });
});

describe("the empty state does not recommend an unsafe action", () => {
  it("no longer tells the operator to run a full seed", () => {
    // `pnpm db:seed` writes synthetic customers, orders and products —
    // catastrophic advice on a production catalogue page (docs/34 §4).
    expect(page).not.toContain("db:seed");
  });
});
