/**
 * Bootstrap script safety tests and canaries.
 *
 * This script is designed to be pointed at a production database, so what has
 * to be proved is the shape of what it can possibly touch — not merely what it
 * does on a happy path. Every assertion below is about the write surface.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALL_PERMISSION_KEYS } from "@/lib/permissions";

import { DEFAULT_GLOBAL_RULE_NAME, pricingPermissionKeys } from "./bootstrap-pricing-production";

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const SCRIPT = "scripts/pricing/bootstrap-pricing-production.ts";
const code = () => stripComments(read(SCRIPT));

describe("what the bootstrap targets", () => {
  it("derives the pricing permissions from the registry rather than a hardcoded list", () => {
    const keys = pricingPermissionKeys();
    const expected = ALL_PERMISSION_KEYS.filter((k) => k.startsWith("pricing."));
    expect(keys).toEqual(expected);
    // Nine today. If a future phase adds one, the script picks it up rather
    // than silently bootstrapping an incomplete set.
    expect(keys.length).toBe(9);
  });

  it("names the same default rule the seed does", () => {
    expect(DEFAULT_GLOBAL_RULE_NAME).toBe("Global default");
    expect(read("prisma/seed/pricing.ts")).toContain('DEFAULT_GLOBAL_RULE_NAME = "Global default"');
  });

  it("uses the seed's own role policy rather than a second copy of it", () => {
    // A bootstrap that granted different permissions than the seed would be
    // worse than no bootstrap, so it imports the mapping.
    expect(code()).toContain('import { ROLE_PERMISSIONS } from "../../prisma/seed/auth"');
    expect(read("prisma/seed/auth.ts")).toContain("export const ROLE_PERMISSIONS");
  });
});

describe("the write surface is narrow", () => {
  /**
   * The load-bearing canary. Anything this script can write must be on this
   * list; a new model appearing here is a deliberate act that fails the build
   * until someone updates the allowlist.
   */
  it("writes only permissions, role grants, feature flags, and the pricing rule", () => {
    const writes =
      // Longest-first alternation: `create|createMany` would match "create"
      // and truncate "createMany", making the allowlist check meaningless.
      code().match(
        /prisma\.[a-zA-Z]+\.(createMany|create|updateMany|update|upsert|deleteMany|delete)/g,
      ) ?? [];
    const allowed = new Set([
      "prisma.permission.upsert",
      "prisma.rolePermission.createMany",
      "prisma.featureFlag.create",
      "prisma.pricingRule.upsert",
    ]);
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) expect([...allowed]).toContain(write);
  });

  it("creates no demo user, customer, order, product, variant, or competitor", () => {
    const c = code();
    for (const model of [
      "prisma.user.",
      "prisma.customer.",
      "prisma.order.",
      "prisma.orderItem.",
      "prisma.product.",
      "prisma.productVariant.",
      "prisma.pricingCompetitor.",
      "prisma.store.",
      "prisma.supplier.",
      "prisma.task.",
      "prisma.investor.",
      "prisma.campaign.",
    ]) {
      expect(c, model).not.toContain(model);
    }
  });

  it("touches no credential and no writeback log", () => {
    const c = code();
    expect(c).not.toContain("integrationConnection");
    // Not the bare word — the script's own success message says "no credential
    // touched", which is the opposite of a breach. Assert on real access.
    expect(c).not.toContain("resolveCredentialsBundle");
    expect(c).not.toMatch(/prisma\.[a-zA-Z]*[Cc]redential/);
    expect(c).not.toContain("MASTER_ENCRYPTION_KEY");
    expect(c).not.toContain("priceWritebackLog");
    expect(c).not.toContain("priceRecommendation");
  });

  it("makes no outbound request and imports no BigCommerce client", () => {
    const c = code();
    expect(c).not.toMatch(/fetch\(/);
    expect(c).not.toContain("integrations/bigcommerce");
    expect(c).not.toContain("services/pricing/writeback");
    expect(c).not.toContain("services/pricing/rollback");
  });

  it("does not import the four unsafe seed modules", () => {
    const c = code();
    // Importing any of these would pull synthetic-data creation into a script
    // pointed at production.
    for (const unsafe of [
      "seed/operating",
      "seed/transactions",
      "seed/management",
      "seed/strategic",
    ]) {
      expect(c, unsafe).not.toContain(unsafe);
    }
  });
});

describe("it can never enable a flag", () => {
  it("creates flags disabled and has no path that sets enabled true", () => {
    const c = code();
    expect(c).toContain("enabled: false");
    expect(c).not.toContain("enabled: true,\n        description");
    // No update path on featureFlag at all — an existing flag is reported and
    // left alone, in either direction.
    expect(c).not.toContain("featureFlag.update");
    expect(c).not.toContain("featureFlag.upsert");
    expect(c).not.toContain("setFeatureFlag");
  });

  it("leaves an already-existing flag untouched", () => {
    // The plan reports existing flags; applyPlan only iterates flagsToCreate.
    expect(code()).toContain("for (const key of plan.flagsToCreate)");
  });
});

describe("dry run is the default", () => {
  it("writes nothing without --apply", () => {
    const c = code();
    expect(c).toContain('const apply = args.includes("--apply")');
    expect(c).toContain("if (!apply)");
    // The early return must come before applyPlan is ever reached.
    const guard = c.indexOf("if (!apply)");
    const applyCall = c.indexOf("await applyPlan(plan)");
    expect(guard).toBeGreaterThan(-1);
    expect(applyCall).toBeGreaterThan(guard);
  });

  it("requires a second acknowledgement when DEPLOY_ENV=production", () => {
    const c = code();
    expect(c).toContain("--i-understand-this-writes-to-production");
    expect(c).toContain('(process.env.DEPLOY_ENV ?? "").toLowerCase() === "production"');
    expect(c).toContain("REFUSED");
    // The refusal must precede the write.
    const refuse = c.indexOf("REFUSED");
    const applyCall = c.indexOf("await applyPlan(plan)");
    expect(refuse).toBeLessThan(applyCall);
  });

  it("builds the plan by reading only", () => {
    const c = code();
    const planBody = c.slice(
      c.indexOf("async function buildPlan"),
      c.indexOf("function printPlan"),
    );
    expect(planBody).not.toMatch(
      /prisma\.[a-zA-Z]+\.(create|createMany|update|updateMany|upsert|delete)/,
    );
  });
});

describe("it is idempotent", () => {
  it("only creates what is absent", () => {
    const c = code();
    // Permissions and the rule use upsert; grants use skipDuplicates; flags are
    // filtered to those not already present.
    expect(c).toContain("permission.upsert");
    expect(c).toContain("skipDuplicates: true");
    expect(c).toContain("pricingRule.upsert");
    expect(c).toContain("flagsToCreate: PILOT_FLAGS.filter");
  });

  it("never updates an existing row's contents", () => {
    // `update: {}` on both upserts — a re-run must not overwrite a value an
    // operator has deliberately changed.
    const c = code();
    expect((c.match(/update: \{\}/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
