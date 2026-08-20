/**
 * Pricing Intelligence DP-1 tests (docs/22 PRD §17).
 *
 * Validation is pure; the registry and no-execution-path checks are
 * source-level canaries in the same style as the security suites.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALL_FEATURE_FLAG_KEYS } from "@/lib/feature-flags";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";

import {
  PricingValidationError,
  validateCompetitorInput,
  validatePricingRuleInput,
  type CompetitorInput,
  type PricingRuleInput,
} from "./validation";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("pricing registries", () => {
  it("registers all nine pricing permissions", () => {
    for (const key of [
      "pricing.view",
      "pricing.manage_rules",
      "pricing.manage_competitors",
      "pricing.create_runs",
      "pricing.run_checks",
      "pricing.review_recommendations",
      "pricing.approve_recommendations",
      "pricing.writeback_bigcommerce",
      "pricing.export",
    ]) {
      expect(ALL_PERMISSION_KEYS).toContain(key);
    }
  });

  it("registers both pricing feature flags", () => {
    expect(ALL_FEATURE_FLAG_KEYS).toContain("pricing.intelligence");
    expect(ALL_FEATURE_FLAG_KEYS).toContain("pricing.writebacks");
  });

  it("keeps pricing.writebacks in the kill switch and health probe", () => {
    expect(read("src/server/services/feature-flags/kill-switch.ts")).toContain(
      "PRICING_WRITEBACKS",
    );
    expect(read("src/app/api/health/route.ts")).toContain("PRICING_WRITEBACKS");
  });

  it("flags are seeded OFF by default (governance seed creates enabled: false)", () => {
    expect(read("prisma/seed/governance.ts")).toContain("enabled: false");
  });
});

describe("competitor validation", () => {
  const valid: CompetitorInput = {
    name: "Example Medical Supply",
    baseUrl: "https://competitor.example",
    country: "Canada",
    currency: "cad",
    searchUrlTemplate: "https://competitor.example/search?q={sku}",
    productUrlPattern: "/products/*",
    rateLimitPerHour: 60,
    termsReviewStatus: "pending",
    requiresManualUrlMapping: false,
    enabled: true,
    notes: null,
  };

  it("accepts and normalizes a valid competitor", () => {
    const result = validateCompetitorInput(valid);
    expect(result.currency).toBe("CAD");
    expect(result.name).toBe("Example Medical Supply");
  });

  it("rejects invalid base URLs", () => {
    for (const baseUrl of ["not-a-url", "ftp://competitor.example", "javascript:alert(1)"]) {
      expect(() => validateCompetitorInput({ ...valid, baseUrl })).toThrow(PricingValidationError);
    }
  });

  it("rejects a search template without a placeholder", () => {
    expect(() =>
      validateCompetitorInput({
        ...valid,
        searchUrlTemplate: "https://competitor.example/search",
      }),
    ).toThrow(PricingValidationError);
  });

  it("rejects bad currencies and rate limits", () => {
    expect(() => validateCompetitorInput({ ...valid, currency: "DOLLARS" })).toThrow(
      PricingValidationError,
    );
    expect(() => validateCompetitorInput({ ...valid, rateLimitPerHour: 0 })).toThrow(
      PricingValidationError,
    );
    expect(() => validateCompetitorInput({ ...valid, rateLimitPerHour: 2.5 })).toThrow(
      PricingValidationError,
    );
  });

  it("rejects unknown terms-review statuses", () => {
    expect(() => validateCompetitorInput({ ...valid, termsReviewStatus: "whatever" })).toThrow(
      PricingValidationError,
    );
  });
});

describe("pricing rule validation", () => {
  const valid: PricingRuleInput = {
    name: "Global default",
    storeId: null,
    minCostMultiplier: 1.4,
    defaultUndercutAmount: 0.01,
    defaultUndercutPct: null,
    maxIncreasePct: 10,
    maxDecreasePct: 20,
    dailyBatchSize: 300,
    minConfidence: 0.85,
    evidenceFreshnessHours: 48,
    requiresApproval: true,
    autoApproveEligible: false,
    enabled: true,
    notes: null,
  };

  it("accepts the seeded default global rule values", () => {
    const result = validatePricingRuleInput(valid);
    expect(result.minCostMultiplier).toBe(1.4);
    expect(result.dailyBatchSize).toBe(300);
    expect(result.requiresApproval).toBe(true);
  });

  it("rejects a multiplier that would allow selling below cost", () => {
    for (const minCostMultiplier of [0.99, 0, -1.4, Number.NaN]) {
      expect(() => validatePricingRuleInput({ ...valid, minCostMultiplier })).toThrow(
        PricingValidationError,
      );
    }
  });

  it("rejects zero or negative batch sizes and non-integers", () => {
    for (const dailyBatchSize of [0, -300, 10.5]) {
      expect(() => validatePricingRuleInput({ ...valid, dailyBatchSize })).toThrow(
        PricingValidationError,
      );
    }
  });

  it("rejects out-of-range confidence thresholds", () => {
    for (const minConfidence of [-0.1, 1.1]) {
      expect(() => validatePricingRuleInput({ ...valid, minConfidence })).toThrow(
        PricingValidationError,
      );
    }
  });

  it("refuses to disable approval in this phase", () => {
    expect(() => validatePricingRuleInput({ ...valid, requiresApproval: false })).toThrow(
      PricingValidationError,
    );
  });
});

describe("DP-1 execution-path canaries", () => {
  function collectFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...collectFiles(full));
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
    return out;
  }
  const pricingFiles = [
    ...collectFiles(join(ROOT, "src", "server", "services", "pricing")),
    ...collectFiles(join(ROOT, "src", "app", "(dashboard)", "products", "pricing")),
  ].filter((file) => !file.endsWith("pricing.test.ts"));

  it("contains no competitor crawling or outbound HTTP", () => {
    for (const file of pricingFiles) {
      const src = readFileSync(file, "utf8");
      expect(src, `${file} must not fetch external content`).not.toMatch(
        /\bfetch\(|axios|playwright|puppeteer|chromium/i,
      );
    }
  });

  it("contains no BigCommerce write path", () => {
    for (const file of pricingFiles) {
      const src = readFileSync(file, "utf8");
      expect(src, `${file} must not touch the BigCommerce integration`).not.toContain(
        "integrations/bigcommerce",
      );
      expect(src).not.toMatch(/X-Auth-Token|bcFetch/);
    }
  });

  it("audits every competitor and rule mutation", () => {
    const service = read("src/server/services/pricing/index.ts");
    for (const action of [
      "pricing.competitor_created",
      "pricing.competitor_updated",
      "pricing.competitor_disabled",
      "pricing.competitor_deleted",
      "pricing.rule_created",
      "pricing.rule_updated",
      "pricing.rule_disabled",
      "pricing.rule_deleted",
    ]) {
      expect(service, `service must write audit action ${action}`).toContain(action);
    }
  });

  it("gates mutations on the module flag and actions on pricing permissions", () => {
    const service = read("src/server/services/pricing/index.ts");
    expect(service).toContain("requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE)");
    const actions = read("src/app/(dashboard)/products/pricing/actions.ts");
    expect(actions).toContain("PERMISSIONS.PRICING_MANAGE_COMPETITORS");
    expect(actions).toContain("PERMISSIONS.PRICING_MANAGE_RULES");
    for (const page of [
      "src/app/(dashboard)/products/pricing/page.tsx",
      "src/app/(dashboard)/products/pricing/competitors/page.tsx",
      "src/app/(dashboard)/products/pricing/rules/page.tsx",
    ]) {
      expect(read(page), `${page} must require pricing.view`).toContain(
        "requirePermission(PERMISSIONS.PRICING_VIEW)",
      );
    }
  });

  it("pricing.writebacks has no enforcement call sites — no write path exists", () => {
    // Mirrors the QuickBooks read-only canary: a reference outside flag
    // infrastructure implies someone added a writeback path, which requires
    // the full DP-6 control design and a conscious update here.
    const ALLOWED = new Set([
      join("src", "lib", "feature-flags.ts"),
      join("src", "server", "services", "feature-flags", "kill-switch.ts"),
      join("src", "app", "api", "health", "route.ts"),
      // The landing page DISPLAYS the flag's state (a read); it enforces nothing.
      join("src", "app", "(dashboard)", "products", "pricing", "page.tsx"),
      join("src", "server", "security", "chokepoints.test.ts"),
      join("src", "server", "security", "reliability-canaries.test.ts"),
      join("src", "server", "services", "pricing", "pricing.test.ts"),
    ]);
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
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src"))) {
      const rel = file.slice(ROOT.length + 1);
      if (ALLOWED.has(rel)) continue;
      if (readFileSync(file, "utf8").includes("PRICING_WRITEBACKS")) offenders.push(rel);
    }
    expect(offenders, `unexpected PRICING_WRITEBACKS references: ${offenders.join(", ")}`).toEqual(
      [],
    );
  });
});
