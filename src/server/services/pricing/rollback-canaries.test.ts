/**
 * DP-6B rollback source-level canaries.
 *
 * Rollback is a second live-price-change path, so it gets the same structural
 * policing as the forward write: one module reaching the store, one explicit
 * action reaching that module, no render path, no background path, no bulk.
 *
 * Helpers are deliberate copies of the ones in the writeback canaries. A canary
 * suite that imported its machinery from the code it polices would be weaker.
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
const allSource = () => collectSource(join(ROOT, "src"));

const SERVICE = "src/server/services/pricing/rollback.ts";
const RULES = "src/server/services/pricing/rollback-eligibility.ts";
const READ_ONLY = "src/server/services/pricing/rollback-read.ts";
const FORM = "src/app/(dashboard)/products/pricing/recommendations/rollback-form.tsx";
const ACTIONS = "src/app/(dashboard)/products/pricing/recommendations/actions.ts";
const BC_CLIENT_IMPORT = "integrations/bigcommerce/price-writeback";

const SELF = "rollback-canaries.test.ts";

/** `rollback-read` / `-eligibility` share the prefix; match the boundary. */
const importsRollbackService = (code: string): boolean =>
  /["']@?[^"']*services\/pricing\/rollback["']/.test(code);

describe("the rollback service is reachable from one action only", () => {
  it("is imported by recommendations/actions.ts and nothing else", () => {
    const allowed = new Set([
      join("src", "app", "(dashboard)", "products", "pricing", "recommendations", "actions.ts"),
    ]);
    const offenders: string[] = [];
    for (const file of allSource()) {
      if (file.endsWith(SELF)) continue;
      // A rollback-* sibling importing the service is not a call site.
      if (rel(file).startsWith(join("src", "server", "services", "pricing", "rollback"))) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (importsRollbackService(code) && !allowed.has(rel(file))) offenders.push(rel(file));
    }
    expect(offenders, "unexpected rollback-service importers: " + offenders.join(", ")).toEqual([]);
  });

  it("is never imported by a page or layout render", () => {
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src", "app"))) {
      const name = file.split(/[\\/]/).pop() ?? "";
      if (!/^(page|layout)\.tsx$/.test(name)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (importsRollbackService(code)) offenders.push(rel(file) + " (imports rollback service)");
      if (code.includes(BC_CLIENT_IMPORT)) offenders.push(rel(file) + " (imports BC client)");
      if (code.includes("rollBackWriteback(")) offenders.push(rel(file) + " (calls rollback)");
    }
    expect(offenders, "pages must not reach the rollback path: " + offenders.join(", ")).toEqual(
      [],
    );
  });

  it("keeps the read-only rollback module free of the write client", () => {
    const code = stripComments(read(READ_ONLY));
    expect(code).not.toContain(BC_CLIENT_IMPORT);
    expect(importsRollbackService(code)).toBe(false);
    for (const symbol of [
      "writeBigCommerceSalePrice",
      "readBigCommercePrice",
      "resolveStoreCredentials",
    ]) {
      expect(code, symbol).not.toContain(symbol);
    }
    // The render path must not mutate anything either.
    expect(code).not.toMatch(/prisma\./);
  });

  it("is unreachable from any background function or the worker", () => {
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src", "server", "inngest"))) {
      if (importsRollbackService(stripComments(readFileSync(file, "utf8")))) {
        offenders.push(rel(file));
      }
    }
    expect(offenders, "background functions must not roll back prices").toEqual([]);
    expect(importsRollbackService(stripComments(read("src/worker.ts")))).toBe(false);
  });

  it("is unreachable from approval or recommendation generation", () => {
    for (const path of [
      "src/server/services/pricing/approvals.ts",
      "src/server/services/pricing/approval.ts",
      "src/server/services/pricing/recommendations.ts",
      "src/server/services/pricing/recommendation.ts",
    ]) {
      const code = stripComments(read(path));
      expect(importsRollbackService(code), path).toBe(false);
      expect(code, path).not.toContain(BC_CLIENT_IMPORT);
    }
  });
});

describe("the rollback write is as narrow as the forward write", () => {
  it("writes sale_price only, through the shared client", () => {
    const code = stripComments(read(SERVICE));
    // It calls the same single-purpose helper rather than building its own
    // request, so the "sale_price only" proof in the client covers it too.
    expect(code).toContain("writeBigCommerceSalePrice(");
    expect(code).not.toContain("sale_price");
    expect(code).not.toMatch(/inventory_level|retail_price|cost_price|description|images/);
    expect(code).not.toMatch(/method:\s*"(PUT|POST|PATCH)"/);
  });

  it("reads the live price before rolling back", () => {
    const code = stripComments(read(SERVICE));
    const readAt = code.indexOf("readBigCommercePrice(");
    const writeAt = code.indexOf("writeBigCommerceSalePrice(");
    expect(readAt).toBeGreaterThan(-1);
    expect(readAt).toBeLessThan(writeAt);
    expect(code).toContain("pre_rollback_read_failed");
  });

  it("refuses when the live price no longer matches what was written", () => {
    const code = stripComments(read(SERVICE));
    const matchAt = code.indexOf("canRollBackAfterRead(");
    const writeAt = code.indexOf("writeBigCommerceSalePrice(");
    expect(matchAt).toBeGreaterThan(-1);
    expect(matchAt, "the mismatch gate must run before the write").toBeLessThan(writeAt);
    // No escape hatch: DP-6B offers no override for a changed store price.
    expect(code).not.toMatch(/force|override|ignoreMismatch/i);
  });

  it("marks rolled_back only after a successful call", () => {
    const code = stripComments(read(SERVICE));
    const failIdx = code.indexOf("if (!outcome.ok)");
    const successIdx = code.indexOf("const rolledBackAt = new Date()");
    expect(failIdx).toBeGreaterThan(-1);
    expect(successIdx).toBeGreaterThan(failIdx);
    const failureBranch = code.slice(failIdx, successIdx);
    expect(failureBranch, "a failed rollback must not claim success").not.toContain(
      'status: "rolled_back"',
    );
    expect(failureBranch).toContain("return {");
  });

  it("never touches the local ProductVariant price", () => {
    const code = stripComments(read(SERVICE));
    expect(code).not.toMatch(/prisma\.productVariant\./);
    expect(code).not.toMatch(/prisma\.product\./);
  });

  it("mutates only the writeback log", () => {
    const code = stripComments(read(SERVICE));
    const writes =
      code.match(/prisma\.[a-zA-Z]+\.(create|createMany|update|updateMany|upsert|delete)/g) ?? [];
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) {
      expect(write).toBe("prisma.priceWritebackLog.update");
    }
  });
});

describe("no bulk, scheduled, or autonomous rollback", () => {
  it("has no loop, scheduler, or background registration", () => {
    const code = stripComments(read(SERVICE));
    expect(code).not.toMatch(/inngest|createFunction|cron\b|\bschedule\(|setInterval/i);
    // A findMany feeding the rollback call would be a bulk path.
    expect(code).not.toMatch(/findMany[\s\S]{0,300}writeBigCommerceSalePrice/);
    expect(code).not.toMatch(/for\s*\([\s\S]{0,120}rollBackWriteback/);
  });

  it("exposes exactly one entry point", () => {
    const code = stripComments(read(SERVICE));
    const exported = [...code.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((m) => m[1]);
    expect(exported).toEqual(["rollBackWriteback"]);
  });

  it("offers no bulk rollback control in the UI", () => {
    const form = stripComments(read(FORM));
    expect(form).not.toMatch(/\.map\(/);
    expect(form).not.toMatch(/selectAll|checkbox|bulk/i);
  });
});

describe("no AI, search, or browser automation in the rollback path", () => {
  for (const path of [SERVICE, RULES, READ_ONLY, FORM]) {
    it(path.split("/").pop() + " stays free of them", () => {
      const code = stripComments(read(path));
      expect(code).not.toMatch(/openai|anthropic|web_search|googleapis|bing\./i);
      expect(code).not.toMatch(/playwright|puppeteer|chromium|cheerio|jsdom/i);
    });
  }
});

describe("the gates stay wired", () => {
  it("requires the same three flags and the writeback permission", () => {
    const rules = stripComments(read(RULES));
    expect(rules).toContain("FEATURE_FLAGS.PRICING_INTELLIGENCE");
    expect(rules).toContain("FEATURE_FLAGS.PRICING_WRITEBACKS");
    expect(rules).toContain("FEATURE_FLAGS.EXTERNAL_WRITEBACKS");
    expect(rules).toContain("PRICING_WRITEBACK_BIGCOMMERCE");

    const service = stripComments(read(SERVICE));
    expect(service).toContain("flagsBlockingWriteback()");
    // Re-asserted inside the service, not only at the action boundary.
    expect(service).toContain("pricing.writeback_bigcommerce");
    expect(stripComments(read(ACTIONS))).toContain("PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE");
  });

  it("audits every outcome of an attempted rollback", () => {
    const code = stripComments(read(SERVICE));
    for (const action of [
      "pricing.writeback_rollback_requested",
      "pricing.writeback_rollback_succeeded",
      "pricing.writeback_rollback_failed",
      "pricing.writeback_rollback_refused",
    ]) {
      expect(code, action).toContain(action);
    }
  });

  it("never guesses a cleared sale price", () => {
    const rules = stripComments(read(RULES));
    expect(rules).toContain("CLEARING_SALE_PRICE_SUPPORTED = false");
    expect(rules).toContain("null_prior_price_unsupported");
  });

  it("tells the operator this changes a live store price", () => {
    const copy = read(FORM).replace(/\s+/g, " ");
    expect(copy).toContain(
      "This will change the live BigCommerce sale price back to the previously recorded value from the writeback log.",
    );
    expect(copy).toContain(
      "Rollback requires pricing.intelligence, pricing.writebacks, external.writebacks, pricing.writeback_bigcommerce, a successful writeback log, rollback evidence, and a successful pre-rollback store read.",
    );
    expect(copy).toContain("Rollback this BigCommerce sale price");
  });
});
