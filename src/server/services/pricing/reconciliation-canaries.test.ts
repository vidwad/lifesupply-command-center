/**
 * DP-6C reconciliation source-level canaries.
 *
 * DP-6C adds a third module that contacts BigCommerce. The guarantee that
 * matters is that this one only ever READS: it must import no write symbol,
 * issue no mutating method, and offer no bulk entry point. These assert that
 * structurally, since a read-only claim is only as good as what the code can
 * reach.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..", "..");

const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

function collectSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSource(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const rel = (file: string) => file.slice(ROOT.length + 1);

const SERVICE = "src/server/services/pricing/reconciliation-service.ts";
const RULES = "src/server/services/pricing/reconciliation.ts";
const READ_ONLY = "src/server/services/pricing/operations-read.ts";
const PAGE = "src/app/(dashboard)/products/pricing/operations/page.tsx";
const ACTIONS = "src/app/(dashboard)/products/pricing/operations/actions.ts";
const FORM = "src/app/(dashboard)/products/pricing/operations/reconcile-form.tsx";
const EXPORT_ROUTE = "src/app/api/exports/pricing/writebacks/route.ts";

const DP6C = [SERVICE, RULES, READ_ONLY, PAGE, ACTIONS, FORM, EXPORT_ROUTE];

const importsWriteService = (code: string): boolean =>
  /["']@?[^"']*services\/pricing\/writeback["']/.test(code);
const importsRollbackService = (code: string): boolean =>
  /["']@?[^"']*services\/pricing\/rollback["']/.test(code);

describe("reconciliation reads and never writes", () => {
  /**
   * The load-bearing assertion of DP-6C. The reconciliation service imports the
   * same module that holds the write function, so "read-only" has to mean it
   * pulls in no write symbol — not merely that it currently avoids calling one.
   */
  it("imports no write symbol from the BigCommerce client", () => {
    const code = stripComments(read(SERVICE));
    expect(code).toContain("readBigCommercePrice");
    for (const symbol of ["writeBigCommerceSalePrice", "buildSalePriceRequestPayload"]) {
      expect(code, symbol).not.toContain(symbol);
    }
  });

  it("issues no mutating HTTP method anywhere in the path", () => {
    for (const path of DP6C) {
      const code = stripComments(read(path));
      expect(code, path).not.toMatch(/method:\s*"(PUT|POST|PATCH|DELETE)"/);
      expect(code, path).not.toMatch(/body:\s*JSON\.stringify/);
    }
  });

  /**
   * `sale_price` is BigCommerce's field name. The export legitimately has CSV
   * COLUMNS with sale_price in the name (old_sale_price, new_sale_price, …),
   * which are our labels, not the API's field. What must be absent is the API
   * shape: a request body naming that field.
   */
  it("never builds a BigCommerce sale_price payload", () => {
    for (const path of DP6C) {
      const code = stripComments(read(path));
      expect(code, path).not.toMatch(/\{\s*sale_price\s*:/);
      expect(code, path).not.toMatch(/"sale_price"\s*:/);
    }
  });

  it("mutates no pricing row — the audit entry is the only record written", () => {
    const code = stripComments(read(SERVICE));
    const writes =
      code.match(/prisma\.[a-zA-Z]+\.(create|createMany|update|updateMany|upsert|delete)/g) ?? [];
    expect(writes, "reconciliation must not write pricing rows").toEqual([]);
    // It records what it saw through the audit helper, not a column.
    expect(code).toContain("writeAudit");
  });

  /**
   * Reconciliation must not disturb the evidence a future rollback depends on.
   * Reading `row.rollbackPayload` into a shape is fine and necessary — what
   * must be absent is any UPDATE of the log.
   */
  it("never touches the writeback log's rollback evidence", () => {
    const code = stripComments(read(SERVICE));
    expect(code).not.toContain("priceWritebackLog.update");
    expect(code).not.toMatch(/priceWritebackLog\.(create|upsert|delete)/);
    // Reading it is expected; assert that is all it does with it.
    expect(code).toContain("rollbackPayload: row.rollbackPayload");
  });

  it("leaves product and variant rows alone", () => {
    for (const path of DP6C) {
      const code = stripComments(read(path));
      expect(code, path).not.toMatch(/prisma\.(product|productVariant)\./);
    }
  });
});

describe("the operations surface reaches no dangerous service", () => {
  it("is not imported by, and does not import, the write or rollback services", () => {
    for (const path of [PAGE, ACTIONS, FORM, EXPORT_ROUTE, READ_ONLY, RULES]) {
      const code = stripComments(read(path));
      expect(importsWriteService(code), path).toBe(false);
      expect(importsRollbackService(code), path).toBe(false);
      expect(code, path).not.toContain("integrations/bigcommerce/price-writeback");
    }
  });

  it("keeps the operations page free of any service that can change a price", () => {
    const code = stripComments(read(PAGE));
    expect(code).not.toContain("reconciliation-service");
    expect(code).not.toContain("writeRecommendationToBigCommerce");
    expect(code).not.toContain("rollBackWriteback");
  });

  it("keeps the read module free of Prisma writes and outbound calls", () => {
    const code = stripComments(read(READ_ONLY));
    expect(code).not.toMatch(/prisma\.[a-zA-Z]+\.(create|update|upsert|delete)/);
    expect(code).not.toMatch(/fetch\(/);
    expect(code).not.toContain("integrations/bigcommerce");
  });

  it("routes the reconcile action through the service and nothing else", () => {
    const code = stripComments(read(ACTIONS));
    expect(code).toContain("reconcileOneWriteback");
    expect(importsWriteService(code)).toBe(false);
    expect(importsRollbackService(code)).toBe(false);
  });
});

describe("no bulk, scheduled, or automatic reconciliation", () => {
  it("exposes one entry point and no loop over logs", () => {
    const code = stripComments(read(SERVICE));
    const exported = [...code.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((m) => m[1]);
    expect(exported).toEqual(["reconcileOneWriteback"]);
    expect(code).not.toMatch(/findMany/);
    expect(code).not.toMatch(/for\s*\(/);
  });

  it("is unreachable from any background function or the worker", () => {
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src", "server", "inngest"))) {
      const code = readFileSync(file, "utf8");
      if (code.includes("reconciliation-service") || code.includes("reconcileOneWriteback")) {
        offenders.push(rel(file));
      }
    }
    expect(offenders, "background functions must not reconcile pricing").toEqual([]);
    expect(read("src/worker.ts")).not.toContain("reconciliation-service");
  });

  it("has no scheduler in the path", () => {
    for (const path of DP6C) {
      const code = stripComments(read(path));
      expect(code, path).not.toMatch(/createFunction|cron\b|setInterval|\bschedule\(/i);
    }
  });

  it("offers no bulk control in the UI", () => {
    const form = stripComments(read(FORM));
    expect(form).not.toMatch(/\.map\(/);
    expect(form).not.toMatch(/selectAll|checkbox|bulk/i);
    // The page must not carry writeback or rollback buttons either.
    const page = stripComments(read(PAGE));
    expect(page).not.toContain("WritebackForm");
    expect(page).not.toContain("RollbackForm");
  });
});

describe("no AI, search, or browser automation in the reporting path", () => {
  for (const path of DP6C) {
    it(path.split("/").pop() + " stays free of them", () => {
      const code = stripComments(read(path));
      expect(code).not.toMatch(/openai|anthropic|web_search|googleapis|bing\./i);
      expect(code).not.toMatch(/playwright|puppeteer|chromium|cheerio|jsdom/i);
    });
  }
});

describe("permissions and copy", () => {
  it("requires the pricing BigCommerce permission to read a live price", () => {
    expect(stripComments(read(ACTIONS))).toContain("PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE");
    // Re-asserted inside the service, matching the write and rollback services.
    expect(stripComments(read(SERVICE))).toContain("pricing.writeback_bigcommerce");
  });

  it("requires only view and export permissions to read the report", () => {
    const page = stripComments(read(PAGE));
    expect(page).toContain("PERMISSIONS.PRICING_VIEW");
    expect(page).toContain("PERMISSIONS.PRICING_EXPORT");
    expect(stripComments(read(EXPORT_ROUTE))).toContain("PERMISSIONS.PRICING_EXPORT");
  });

  it("audits every reconciliation outcome", () => {
    const code = stripComments(read(SERVICE));
    for (const action of [
      "pricing.writeback_reconciliation_requested",
      "pricing.writeback_reconciliation_completed",
      "pricing.writeback_reconciliation_failed",
    ]) {
      expect(code, action).toContain(action);
    }
  });

  it("tells the operator the page changes nothing by itself", () => {
    const copy = read(PAGE).replace(/\s+/g, " ");
    expect(copy).toContain(
      "This is an operator review and reconciliation dashboard. It does not automatically change prices.",
    );
    expect(copy).toContain(
      "This page is read-only except for explicit one-record reconciliation checks. It does not automatically change BigCommerce prices.",
    );
  });
});

describe("the export is a report, not an action", () => {
  it("makes no outbound request of its own", () => {
    const code = stripComments(read(EXPORT_ROUTE));
    expect(code).not.toMatch(/fetch\(/);
    expect(code).not.toContain("reconcileOneWriteback");
    expect(code).not.toContain("integrations/bigcommerce");
  });

  it("carries the operational columns an operator needs", () => {
    const code = read(EXPORT_ROUTE);
    for (const column of [
      "writeback_log_id",
      "writeback_status",
      "rollback_at",
      "rollback_sale_price",
      "current_reconciliation_status",
      "last_reconciled_at",
      "live_sale_price_observed",
      "mismatch_reason",
      "error_message",
      "required_action",
    ]) {
      expect(code, column).toContain('label: "' + column + '"');
    }
  });
});
