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

import {
  parseProductSort,
  parseSortDirection,
  PRODUCT_SORT_KEYS,
  PRODUCTS_PAGE_SIZE,
} from "./index";

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

  it("passes every active filter AND the sort to the pagination footer", () => {
    // Paging must not silently drop the chosen column or direction.
    expect(page).toContain("params={{ ...carried, sort: params.sort, dir: params.dir }}");
    expect(page).toContain("const carried = {");
    for (const key of ["q: params.q", "flag: params.flag", "division: params.division"]) {
      expect(page).toContain(key);
    }
  });
});

describe("the empty state does not recommend an unsafe action", () => {
  it("no longer tells the operator to run a full seed", () => {
    // `pnpm db:seed` writes synthetic customers, orders and products —
    // catastrophic advice on a production catalogue page (docs/34 §4).
    expect(page).not.toContain("db:seed");
  });
});

describe("zero cost is unknown, not free", () => {
  it("does not use truthiness to test a Decimal cost", () => {
    // `Decimal(0)` is an object and therefore truthy. The old
    // `primary?.costPrice ? … : …` treated it as a real cost of $0.00 and
    // reported a 100% margin on 50,024 of 50,053 production variants.
    expect(service).not.toContain("const cost = primary?.costPrice\n      ? Number");
    expect(service).toContain("positiveOrNull(primary?.costPrice)");
  });

  it("requires a strictly positive value", () => {
    expect(service).toContain("Number.isFinite(n) && n > 0 ? n : null");
  });

  it("falls through to the preferred supplier cost, and only then to null", () => {
    expect(service).toContain(
      "positiveOrNull(primary?.costPrice) ?? positiveOrNull(p.supplierProducts[0]?.cost) ?? null",
    );
  });

  it("leaves margin null when cost is unknown, so the column renders as a dash", () => {
    expect(service).toContain("cost != null && price > 0 ? (price - cost) / price : null");
    expect(page).toContain('{p.cost != null ? formatCurrency(p.cost) : "—"}');
  });

  it("agrees with how the pricing engine reads cost", () => {
    // One definition of "has a cost" across the app: strictly positive.
    const engine = readFileSync(
      join(__dirname, "..", "pricing", "recommendation.ts"),
      "utf8",
    ).replace(/\r\n/g, "\n");
    expect(engine).toContain("Number.isFinite(value) && value > 0");
  });
});

describe("sortable columns", () => {
  it("only offers sort keys the database can actually order by", () => {
    expect([...PRODUCT_SORT_KEYS]).toEqual(["name", "sku", "category", "store", "quality"]);
  });

  it("excludes the columns derived after the query", () => {
    // Price, Cost, Margin and Stock come from variants; Supplier from
    // supplierProducts. Prisma cannot order by a to-many aggregate, and
    // reordering the fetched page would present a page-local shuffle as a
    // catalogue-wide sort — the failure shape of F-14.
    for (const derived of ["price", "cost", "margin", "stock", "supplier"]) {
      expect([...PRODUCT_SORT_KEYS]).not.toContain(derived);
    }
  });

  it("rejects an unknown sort key instead of passing it to Prisma", () => {
    // Guards against a hand-edited URL reaching orderBy.
    expect(parseProductSort("name")).toBe("name");
    expect(parseProductSort("margin")).toBeUndefined();
    expect(parseProductSort("id; drop table")).toBeUndefined();
    expect(parseProductSort(undefined)).toBeUndefined();
  });

  it("defaults to ascending and only accepts an explicit desc", () => {
    expect(parseSortDirection(undefined)).toBe("asc");
    expect(parseSortDirection("asc")).toBe("asc");
    expect(parseSortDirection("desc")).toBe("desc");
    expect(parseSortDirection("sideways")).toBe("asc");
  });

  it("keeps the id tiebreaker on every sort branch", () => {
    // A sort without a unique final key lets rows swap between pages.
    const branches = service.slice(
      service.indexOf("function productOrderBy"),
      service.indexOf("/** Total matching the same filters"),
    );
    const returns = branches.match(/return \[[^\]]*\];/g) ?? [];
    expect(returns.length).toBeGreaterThanOrEqual(6);
    for (const r of returns) expect(r).toContain('{ id: "asc" }');
  });

  it("sorts absent SKUs last rather than first", () => {
    // A missing SKU is an absence, not the smallest value.
    expect(service).toContain('{ sku: { sort: dir, nulls: "last" } }');
  });

  it("drops the page number when the sort changes", () => {
    // Page 7 of a different ordering is an unrelated slice.
    const header = readFileSync(
      join(__dirname, "..", "..", "..", "components", "data", "SortHeader.tsx"),
      "utf8",
    ).replace(/\r\n/g, "\n");
    expect(header).not.toMatch(/qs\.set\("page"/);
    expect(header).toContain('qs.set("sort", sortKey)');
  });
});

describe("filter pill counts", () => {
  it("counts ignore the quality filter but honour the others", () => {
    // Each pill must answer "what would I get if I clicked this", so the
    // active quality filter is stripped before counting.
    expect(service).toContain("const { imageStatus: _ignored, ...rest } = filters;");
    expect(service).toContain("where: productWhere(rest)");
  });

  it("derives every pill count from one grouped query", () => {
    expect(service).toContain('by: ["imageStatus"]');
    expect(service).toContain('missingImage: by.get("missing") ?? 0');
    expect(service).toContain('needsReview: by.get("needs_review") ?? 0');
  });

  it("renders a count on each pill", () => {
    expect(page).toContain("count={qualityCounts.all}");
    expect(page).toContain("count={qualityCounts.missingImage}");
    expect(page).toContain("count={qualityCounts.needsReview}");
    expect(page).toContain("{count.toLocaleString()}");
  });

  it("preserves the sort when a pill is clicked", () => {
    // Sort is a view preference, not a filter — changing filter should not
    // silently reset the column the user chose.
    expect(page).toContain('if (sort) qs.set("sort", sort);');
  });
});
