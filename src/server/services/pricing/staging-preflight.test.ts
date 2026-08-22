/**
 * Staging preflight tests.
 *
 * The preflight is a readiness check that runs on a page render, so what has
 * to be proved is that it reads and reports and does nothing else. The
 * constants it exports are also the contract the certification workbook
 * (docs/29 §5) documents, so a drift between them is a documentation bug.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { ALL_PERMISSION_KEYS, PERMISSIONS } from "@/lib/permissions";

import { EXERCISE_PERMISSIONS, MUST_BE_OFF_AT_PREFLIGHT } from "./staging-preflight";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const SERVICE = "src/server/services/pricing/staging-preflight.ts";
const WORKBOOK = "docs/29_PRICING_INTELLIGENCE_CERTIFICATION_WORKBOOK.md";

describe("the flags the preflight insists are off", () => {
  it("are exactly the two that permit a live price change", () => {
    expect([...MUST_BE_OFF_AT_PREFLIGHT]).toEqual([
      FEATURE_FLAGS.PRICING_WRITEBACKS,
      FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
    ]);
  });

  /**
   * pricing.intelligence must NOT be in the must-be-off list — the exercise
   * needs it ON from step B. Listing it would make the preflight demand a
   * posture that blocks its own procedure.
   */
  it("does not include pricing.intelligence", () => {
    expect([...MUST_BE_OFF_AT_PREFLIGHT]).not.toContain(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  });
});

describe("the permissions the exercise needs", () => {
  it("are all real keys in the registry", () => {
    for (const permission of EXERCISE_PERMISSIONS) {
      expect(ALL_PERMISSION_KEYS, permission).toContain(permission);
    }
  });

  it("covers every pricing permission the workflow uses", () => {
    // If a future phase adds a pricing permission, the preflight should ask
    // about it too rather than silently omitting it from readiness.
    const pricingKeys = ALL_PERMISSION_KEYS.filter((key) => key.startsWith("pricing."));
    for (const key of pricingKeys) {
      expect([...EXERCISE_PERMISSIONS], key + " is missing from the preflight").toContain(key);
    }
  });

  it("includes the writeback permission, which gates the dangerous steps", () => {
    expect([...EXERCISE_PERMISSIONS]).toContain(PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE);
  });
});

describe("the preflight only reads", () => {
  it("performs no Prisma mutation", () => {
    const code = stripComments(read(SERVICE));
    const writes =
      code.match(/prisma\.[a-zA-Z]+\.(create|createMany|update|updateMany|upsert|delete)/g) ?? [];
    expect(writes, "the preflight must not write").toEqual([]);
  });

  it("makes no outbound request and reaches no dangerous service", () => {
    const code = stripComments(read(SERVICE));
    expect(code).not.toMatch(/fetch\(/);
    expect(code).not.toContain("integrations/bigcommerce");
    expect(code).not.toMatch(/["']@?[^"']*services\/pricing\/writeback["']/);
    expect(code).not.toMatch(/["']@?[^"']*services\/pricing\/rollback["']/);
    expect(code).not.toContain("reconciliation-service");
  });

  it("cannot enable a flag", () => {
    const code = stripComments(read(SERVICE));
    expect(code).not.toContain("setFeatureFlag");
    expect(code).not.toContain("featureFlag.update");
    expect(code).not.toContain("featureFlag.upsert");
  });
});

describe("the workbook and the code agree", () => {
  it("the workbook names the flags the preflight checks", () => {
    const workbook = read(WORKBOOK);
    for (const flag of MUST_BE_OFF_AT_PREFLIGHT) {
      expect(workbook, flag).toContain(flag);
    }
    expect(workbook).toContain(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  });

  it("the workbook states nothing is certified", () => {
    const workbook = read(WORKBOOK).replace(/\s+/g, " ");
    expect(workbook).toContain("Nothing in this workbook is certified");
    // The claim this project must never make casually.
    expect(workbook).not.toMatch(/is production[- ]ready/i);
  });

  it("the workbook records the Super Admin permission finding", () => {
    // If a later change grants the writeback permission to a narrower role,
    // this should be revisited rather than left as stale documentation.
    const workbook = read(WORKBOOK);
    expect(workbook).toContain("Super Admin only");
    expect(workbook).toContain("DEC-PI-01");
  });

  it("the readiness register carries all twelve certification rows as Evidence Required", () => {
    const register = read("docs/RELEASE_READINESS_STATUS.md");
    for (let i = 1; i <= 12; i += 1) {
      const id = "PI-CERT-" + String(i).padStart(2, "0");
      expect(register, id).toContain("| " + id + " |");
    }
    // None may be pre-marked Accepted — only the product owner does that.
    const section = register.slice(register.indexOf("### 5.8"), register.indexOf("## 6."));
    expect(section).not.toContain("| Accepted |");
  });
});
