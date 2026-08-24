/**
 * Canaries for the backfill planner.
 *
 * The script is pointed at a production database and named "backfill", which
 * is precisely the kind of thing that acquires a write path later. These assert
 * it has none — and no way to reach BigCommerce either.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SCRIPT = join(__dirname, "plan-historical-backfill.ts");
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
const code = stripComments(readFileSync(SCRIPT, "utf8").replace(/\r\n/g, "\n"));

/**
 * Blanks out string and template literals, leaving executable code.
 *
 * The script prints prose recommending `syncOrderItemsForOrder()` as the
 * backfill source — parentheses and all. Naming a function inside a message is
 * not calling it, so the call-site canary has to look past string contents or
 * it fires on the script's own documentation.
 */
const stripStrings = (source: string): string =>
  source
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");

const executable = stripStrings(code);

describe("the planner writes nothing", () => {
  it("calls no Prisma mutation", () => {
    const writes =
      code.match(
        /prisma\.[a-zA-Z]+\.(createMany|create|updateMany|update|upsert|deleteMany|delete)\b/g,
      ) ?? [];
    expect(writes).toEqual([]);
  });

  it("uses only counting and finding queries", () => {
    const queries = code.match(/prisma\.[a-zA-Z]+\.[a-zA-Z]+/g) ?? [];
    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) {
      expect(q).toMatch(/\.(count|findFirst|findMany|findUnique|groupBy|aggregate)$/);
    }
  });

  it("has no raw execute path", () => {
    for (const forbidden of ["$executeRaw", "$executeRawUnsafe", "$queryRawUnsafe"]) {
      expect(code, forbidden).not.toContain(forbidden);
    }
  });

  it("has no --apply flag, because there is nothing to apply", () => {
    // The real backfill is the existing order sync, run deliberately by a
    // person. A dry-run/apply pair here would imply this script can import.
    expect(code).not.toContain("--apply");
    expect(code).not.toContain("applyPlan");
  });
});

describe("the planner calls nothing external", () => {
  it("makes no HTTP request", () => {
    expect(code).not.toMatch(/\bfetch\s*\(/);
    expect(code).not.toContain("api.bigcommerce.com");
    expect(code).not.toContain("https://");
  });

  it("imports no BigCommerce or sync code", () => {
    // Assert on the import statements, not on any mention: the script's own
    // output names syncOrderItemsForOrder() when recommending it as the
    // backfill source, and describing a thing is not calling it.
    const imports = code.match(/^import .*$/gm) ?? [];
    expect(imports).toHaveLength(1);
    expect(imports[0]).toBe('import { PrismaClient } from "@prisma/client";');
    for (const path of ["integrations/bigcommerce", "services/sync", "bigcommerce-dispatch"]) {
      expect(code, path).not.toMatch(new RegExp(`from ["'][^"']*${path}`));
    }
  });

  it("invokes no sync function, however it might be referenced", () => {
    // Scanned with string literals blanked: the script's own output names
    // syncOrderItemsForOrder() as the recommended source, and describing a
    // function is not invoking it.
    expect(executable).not.toMatch(/\bsyncOrderItemsForOrder\s*\(/);
    expect(executable).not.toMatch(/\bsyncBigCommerce[A-Za-z]*\s*\(/);
    expect(executable).not.toMatch(/\bdispatchBigCommerce[A-Za-z]*\s*\(/);
    expect(executable).not.toMatch(/inngest\.send/);
  });

  it("the string-stripper actually strips, so the check above is not vacuous", () => {
    // A stripper that silently returned its input would make every assertion
    // using `executable` pass for the wrong reason.
    expect(code).toMatch(/\bsyncOrderItemsForOrder\s*\(/);
    expect(executable).not.toContain("syncOrderItemsForOrder");
    expect(executable).toContain("prisma.order.count");
  });

  it("touches no credential", () => {
    expect(code).not.toContain("integrationConnection");
    expect(code).not.toContain("resolveCredential");
    expect(code).not.toMatch(/apiToken|storeHash|MASTER_ENCRYPTION_KEY/);
  });

  it("changes no feature flag", () => {
    expect(code).not.toContain("featureFlag");
    expect(code).not.toContain("setFeatureFlag");
  });
});

describe("the planner is honest about what it found", () => {
  it("states plainly that it wrote nothing", () => {
    expect(code).toContain("Nothing was written, no API was called, no flag was changed");
  });

  it("names CSV import as insufficient for line items", () => {
    // importBigCommerceOrders() has no OrderItem write path — verified by
    // grep against the import service, which contains zero `orderItem` uses.
    expect(code).toContain("NOT SUFFICIENT");
    expect(code).toContain("headers only");
  });

  it("warns that a backfill cannot recover cost data", () => {
    // Units and revenue are recoverable; margin is not, because BigCommerce
    // carries almost no cost_price. Saying so prevents a 90k-order import
    // being run in the expectation of margin analysis.
    expect(code).toContain("does NOT recover cost");
  });
});
