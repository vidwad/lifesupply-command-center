/**
 * DP-6 writeback source-level canaries.
 *
 * Split out of pricing.test.ts, which is already long. These are the structural
 * guarantees that cannot be expressed as unit tests: that exactly one module
 * can reach a store, that the log is written before the request, that no
 * background or bulk path exists, and that approval and generation remain
 * incapable of publishing a price.
 *
 * The two helpers below are deliberate copies of the ones in pricing.test.ts.
 * A canary suite that imported its own reading machinery from the code it
 * polices would be weaker for it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..", "..");

/** Reads a repo file with line endings normalised (core.autocrlf is on). */
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

/** Strips comments so a canary tests CODE, not the prose describing it. */
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

const SERVICE = "src/server/services/pricing/writeback.ts";
const RULES = "src/server/services/pricing/writeback-eligibility.ts";
const CLIENT = "src/server/integrations/bigcommerce/price-writeback.ts";
const FORM = "src/app/(dashboard)/products/pricing/recommendations/writeback-form.tsx";
const ACTIONS = "src/app/(dashboard)/products/pricing/recommendations/actions.ts";

const SELF = "writeback-canaries.test.ts";

describe("only one module can write a price", () => {
  it("creates PriceWritebackLog rows only in the DP-6 writeback service", () => {
    const allowed = new Set([
      join("src", "server", "services", "pricing", "writeback.ts"),
      // Asserts the call EXISTS as a wiring check — the opposite of a breach.
      join("src", "server", "security", "chokepoints.test.ts"),
    ]);
    const offenders: string[] = [];
    for (const file of allSource()) {
      if (file.endsWith(SELF)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (code.includes("priceWritebackLog.create") && !allowed.has(rel(file))) {
        offenders.push(rel(file));
      }
    }
    expect(offenders, "unexpected writeback-log writers: " + offenders.join(", ")).toEqual([]);
  });

  /**
   * Mentioning `sale_price` is not the same as sending it. The inbound sync
   * mappers, the CSV exports, and the upload parser all READ that field, and
   * forbidding the string outright would push those toward obscurity for no
   * safety gain. What must be unique is a module that puts sale_price into an
   * outbound WRITE.
   */
  it("sends sale_price in a request body from the one client module only", () => {
    const allowed = new Set([
      join("src", "server", "integrations", "bigcommerce", "price-writeback.ts"),
      join("src", "server", "integrations", "bigcommerce", "price-writeback.test.ts"),
    ]);
    const offenders: string[] = [];
    for (const file of allSource()) {
      if (file.endsWith(SELF)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (!code.includes("sale_price")) continue;
      const mutating =
        /method:\s*"(PUT|POST|PATCH)"/.test(code) || /body:\s*JSON\.stringify/.test(code);
      if (mutating && !allowed.has(rel(file))) offenders.push(rel(file));
    }
    expect(offenders, "unexpected sale_price writers: " + offenders.join(", ")).toEqual([]);
  });

  it("writes sale_price and no other catalogue field", () => {
    const code = stripComments(read(CLIENT));
    expect(code).toContain("const payload = { sale_price: args.salePrice }");
    for (const forbidden of [
      "inventory_level",
      "retail_price:",
      "cost_price:",
      "is_visible",
      "description:",
      "images:",
    ]) {
      expect(code, forbidden).not.toContain(forbidden);
    }
    // No generic update helper for a later phase to reach for.
    expect(code).not.toMatch(/updateProduct\(|patchProduct\(/);
  });
});

describe("the gates stay wired", () => {
  it("requires all three flags and the writeback permission", () => {
    const rules = stripComments(read(RULES));
    expect(rules).toContain("FEATURE_FLAGS.PRICING_INTELLIGENCE");
    expect(rules).toContain("FEATURE_FLAGS.PRICING_WRITEBACKS");
    expect(rules).toContain("FEATURE_FLAGS.EXTERNAL_WRITEBACKS");
    expect(rules).toContain("PRICING_WRITEBACK_BIGCOMMERCE");

    const service = stripComments(read(SERVICE));
    expect(service).toContain("REQUIRED_WRITEBACK_FLAGS");
    // Re-asserted inside the service, not only at the action boundary.
    expect(service).toContain("pricing.writeback_bigcommerce");
    expect(stripComments(read(ACTIONS))).toContain("PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE");
  });

  it("writes the log row before the request goes out", () => {
    const code = stripComments(read(SERVICE));
    const logAt = code.indexOf("priceWritebackLog.create");
    const writeAt = code.indexOf("writeBigCommerceSalePrice(");
    expect(logAt).toBeGreaterThan(-1);
    expect(writeAt).toBeGreaterThan(-1);
    expect(logAt, "the log must be created before the API call").toBeLessThan(writeAt);
  });

  it("refuses to write without a successful pre-write read", () => {
    const code = stripComments(read(SERVICE));
    const readAt = code.indexOf("readBigCommercePrice(");
    const writeAt = code.indexOf("writeBigCommerceSalePrice(");
    expect(readAt).toBeGreaterThan(-1);
    expect(readAt).toBeLessThan(writeAt);
    expect(code).toContain("pre_write_read_failed");
  });

  it("marks written_back only after a success", () => {
    const code = stripComments(read(SERVICE));
    const failIdx = code.indexOf("if (!outcome.ok)");
    // The success path begins at the writtenAt stamp. Slicing to the
    // written_back update instead would swallow the success log update and
    // report a false breach — the failure branch ends well before it.
    const successIdx = code.indexOf("const writtenAt = new Date()");
    const writtenBackIdx = code.indexOf('status: "written_back"');
    expect(failIdx).toBeGreaterThan(-1);
    expect(successIdx).toBeGreaterThan(failIdx);
    expect(writtenBackIdx).toBeGreaterThan(successIdx);

    const failureBranch = code.slice(failIdx, successIdx);
    expect(failureBranch, "the failure branch must record a failure").toContain('status: "failed"');
    expect(failureBranch, "and must never mark anything succeeded").not.toContain(
      'status: "succeeded"',
    );
    expect(failureBranch).not.toContain('status: "written_back"');
    // The failure branch must return, so control cannot fall into the success
    // path after a failed write.
    expect(failureBranch).toContain("return {");
  });

  it("audits every outcome of an attempted write", () => {
    const code = stripComments(read(SERVICE));
    for (const action of [
      "pricing.writeback_requested",
      "pricing.writeback_succeeded",
      "pricing.writeback_failed",
      "pricing.writeback_refused",
    ]) {
      expect(code, action).toContain(action);
    }
  });
});

describe("no autonomous, scheduled, or bulk writeback exists", () => {
  it("has no loop, scheduler, or background registration in the service", () => {
    const code = stripComments(read(SERVICE));
    expect(code).not.toMatch(/inngest/i);
    expect(code).not.toMatch(/createFunction|cron\b|\bschedule\(/i);
    // A findMany feeding the write call would be a bulk path.
    expect(code).not.toMatch(/findMany[\s\S]{0,300}writeBigCommerceSalePrice/);
  });

  it("is unreachable from any background function", () => {
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src", "server", "inngest"))) {
      if (readFileSync(file, "utf8").includes("services/pricing/writeback")) {
        offenders.push(rel(file));
      }
    }
    expect(offenders, "background functions must not write prices").toEqual([]);
  });

  it("is unreachable from the worker entrypoint", () => {
    expect(read("src/worker.ts")).not.toContain("services/pricing/writeback");
  });

  it("is never invoked from a page or layout render", () => {
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src", "app"))) {
      const name = file.split(/[\\/]/).pop() ?? "";
      if (!/^(page|layout)\.tsx$/.test(name)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (code.includes("writeRecommendationToBigCommerce(")) offenders.push(rel(file));
      if (code.includes("integrations/bigcommerce/price-writeback")) offenders.push(rel(file));
    }
    expect(offenders, "pages must not write prices: " + offenders.join(", ")).toEqual([]);
  });
});

describe("approval and generation cannot publish a price", () => {
  for (const path of [
    "src/server/services/pricing/approvals.ts",
    "src/server/services/pricing/approval.ts",
    "src/server/services/pricing/recommendations.ts",
    "src/server/services/pricing/recommendation.ts",
  ]) {
    it(path.split("/").pop() + " reaches neither BigCommerce nor the writeback path", () => {
      const code = stripComments(read(path));
      expect(code).not.toContain("integrations/bigcommerce");
      expect(code).not.toContain("priceWritebackLog");
      expect(code).not.toContain("services/pricing/writeback");
    });
  }
});

describe("no AI, search, or browser automation in the writeback path", () => {
  for (const path of [SERVICE, RULES, CLIENT, FORM]) {
    it(path.split("/").pop() + " stays free of them", () => {
      const code = stripComments(read(path));
      expect(code).not.toMatch(/openai|anthropic|web_search|googleapis|bing\./i);
      expect(code).not.toMatch(/playwright|puppeteer|chromium|cheerio|jsdom/i);
      expect(code).not.toContain("competitorPriceObservation");
    });
  }
});

describe("the operator is told what this button does", () => {
  it("states plainly that it changes a live store price", () => {
    const copy = read(FORM).replace(/\s+/g, " ");
    expect(copy).toContain(
      "This will update the BigCommerce sale price. This is the first phase that can change store pricing.",
    );
    expect(copy).toContain(
      "The writeback requires pricing.intelligence, pricing.writebacks, external.writebacks, pricing.writeback_bigcommerce, an approved recommendation, and a complete audit log.",
    );
    expect(copy).toContain("Write approved price to BigCommerce");
  });
});
