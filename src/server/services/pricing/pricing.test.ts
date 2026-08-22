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
/**
 * Reads a repo file with line endings normalised.
 *
 * core.autocrlf is on and there is no .gitattributes, so a file is LF in the
 * working tree it was written in and CRLF after a fresh checkout. Any assertion
 * spanning a line break would pass for its author and fail for everyone else —
 * which is exactly what happened to the flag-posture canary below.
 */
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

/**
 * Strips comments so a canary tests CODE, not prose.
 *
 * Without this, documenting a guardrail trips it: collector.ts explaining that
 * it sends no Authorization header would fail an assertion looking for
 * "Authorization". That would push the codebase toward undocumented guardrails,
 * which is the opposite of what these canaries are for.
 *
 * `://` is preserved so URLs in string literals are not mistaken for comments.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

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

  /**
   * NARROWED IN DP-3.
   *
   * Through DP-2 this asserted that NO file under the pricing tree performed
   * outbound HTTP. DP-3 collects competitor prices, so exactly one module is
   * now allowed to: services/pricing/collector.ts. Every other pricing file —
   * services, actions, pages, worker function — must still contain no fetch,
   * and no headless browser or scraping framework is permitted anywhere,
   * because DP-3 is a plain GET of pages LifeSupply configured, not a crawler.
   */
  const OUTBOUND_HTTP_ALLOWED = join("services", "pricing", "collector.ts");

  it("performs outbound HTTP in the collector only", () => {
    for (const file of pricingFiles) {
      if (file.endsWith(OUTBOUND_HTTP_ALLOWED)) continue;
      const src = readFileSync(file, "utf8");
      expect(src, file + " must not fetch external content").not.toMatch(/fetch\(/i);
    }
  });

  it("uses no headless browser or scraping framework anywhere", () => {
    for (const file of pricingFiles) {
      const src = readFileSync(file, "utf8");
      expect(src, file + " must not drive a browser").not.toMatch(
        /axios|playwright|puppeteer|chromium|cheerio|jsdom/i,
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

describe("auto-approval is unavailable in this phase (DP-1A)", () => {
  const validRule: PricingRuleInput = {
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

  it("rejects autoApproveEligible: true", () => {
    // The form previously exposed this as a checkbox labelled "future phase
    // only", but nothing stopped it being submitted and stored as true.
    expect(() => validatePricingRuleInput({ ...validRule, autoApproveEligible: true })).toThrow(
      PricingValidationError,
    );
  });

  it("names the phase in the refusal so the reason is actionable", () => {
    expect(() => validatePricingRuleInput({ ...validRule, autoApproveEligible: true })).toThrow(
      /product-owner-approved automation phase/,
    );
  });

  it("pins the stored value to false even on a valid input", () => {
    expect(validatePricingRuleInput(validRule).autoApproveEligible).toBe(false);
  });

  it("rejects rather than silently coercing, so the attempt is visible", () => {
    // Coercing to false would leave no trace that someone tried to enable it.
    let threw = false;
    try {
      validatePricingRuleInput({ ...validRule, autoApproveEligible: true });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("keeps the seeded default global rule at autoApproveEligible false", () => {
    const seed = read("prisma/seed/pricing.ts");
    expect(seed).toMatch(/autoApproveEligible:\s*false/);
    expect(seed).not.toMatch(/autoApproveEligible:\s*true/);
  });

  it("no longer offers the setting as a form control", () => {
    const form = read("src/app/(dashboard)/products/pricing/setup-forms.tsx");
    expect(form).not.toContain('name="autoApproveEligible"');
    expect(form).toContain("Auto-approval is unavailable until a later");
  });

  it("does not read the field from submitted form data", () => {
    const actions = read("src/app/(dashboard)/products/pricing/actions.ts");
    expect(actions).not.toContain('flag(formData, "autoApproveEligible")');
  });
});

describe("DP-2 Product List Builder canaries", () => {
  const runFiles = [
    "src/server/services/pricing/runs.ts",
    "src/server/services/pricing/list-builder.ts",
    "src/server/services/pricing/upload-parser.ts",
    "src/app/(dashboard)/products/pricing/runs/actions.ts",
    "src/app/api/exports/pricing/runs/[id]/route.ts",
  ];

  it("creates only draft runs — no other status is written at creation", () => {
    const service = read("src/server/services/pricing/runs.ts");
    expect(service).toContain('status: "draft"');
    expect(service).not.toMatch(/status:\s*"(running|completed|paused)"/);
  });

  it("writes no observation, recommendation, or writeback row", () => {
    // DP-2 non-scope: those tables belong to DP-3 and later.
    for (const rel of runFiles) {
      const src = read(rel);
      for (const table of [
        "competitorPriceObservation",
        "priceRecommendation",
        "priceWritebackLog",
      ]) {
        expect(src, `${rel} must not write ${table}`).not.toContain(`prisma.${table}`);
      }
    }
  });

  it("never references pricing.writebacks", () => {
    for (const rel of runFiles) {
      expect(read(rel), `${rel} must not use the writeback flag`).not.toContain(
        "PRICING_WRITEBACKS",
      );
    }
  });

  it("gates run mutations on the module flag", () => {
    const service = read("src/server/services/pricing/runs.ts");
    expect(service).toContain("requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE)");
  });

  it("requires pricing.create_runs to build a run and pricing.export to export", () => {
    const actions = read("src/app/(dashboard)/products/pricing/runs/actions.ts");
    expect(actions).toContain("PERMISSIONS.PRICING_CREATE_RUNS");
    const route = read("src/app/api/exports/pricing/runs/[id]/route.ts");
    expect(route).toContain("PERMISSIONS.PRICING_EXPORT");
  });

  it("requires pricing.view to read runs", () => {
    for (const rel of [
      "src/app/(dashboard)/products/pricing/runs/page.tsx",
      "src/app/(dashboard)/products/pricing/runs/[id]/page.tsx",
    ]) {
      expect(read(rel), `${rel} must require pricing.view`).toContain("PERMISSIONS.PRICING_VIEW");
    }
  });

  it("audits run creation, cancellation, and both upload outcomes", () => {
    const service = read("src/server/services/pricing/runs.ts");
    for (const action of [
      "pricing.run_created",
      "pricing.run_cancelled",
      "pricing.upload_processed",
      "pricing.upload_rejected",
    ]) {
      expect(service, `missing audit action ${action}`).toContain(action);
    }
  });

  it("stores a cost source and a floor price on every item it writes", () => {
    // Guardrail: no product proceeds without a recorded cost basis, and the
    // floor is persisted rather than recomputed against a rule that may change.
    const service = read("src/server/services/pricing/runs.ts");
    expect(service).toContain("costSource: item.costSource");
    expect(service).toContain("floorPrice: item.floorPrice");
  });
});

describe("DP-2A corrections", () => {
  const runs = () => read("src/server/services/pricing/runs.ts");
  const actions = () => read("src/app/(dashboard)/products/pricing/runs/actions.ts");

  it("orders order lines newest-first so the cost fallback is genuinely the most recent", () => {
    // The original query had no ordering, so "most recent unit cost" took
    // whatever row the database happened to return first.
    const src = runs();
    expect(src).toContain('orderBy: { order: { orderDate: "desc" } }');
  });

  it("records which order line an inferred cost came from", () => {
    const src = runs();
    expect(src).toContain("costSourceRef");
    expect(src).toContain("orderItemId");
    expect(src).toContain("orderDate");
  });

  it("persists uploaded fields that have no column of their own", () => {
    const src = runs();
    for (const field of [
      "uploadRow",
      "competitorUrl",
      "supplierSku",
      "notes",
      "store",
      "uploadedProductId",
      "uploadedVariantId",
      "parseErrors",
    ]) {
      expect(src, `upload metadata must carry ${field}`).toContain(field);
    }
    expect(src).toContain("metadata:");
  });

  it("creates no ProductCompetitorUrl record — a supplied URL is evidence for DP-3 only", () => {
    expect(runs()).not.toContain("productCompetitorUrl");
    expect(actions()).not.toContain("productCompetitorUrl");
  });

  it("validates every run input against an allow-list before querying", () => {
    const src = actions();
    for (const fn of ["parseRankingBasis", "parseLookbackWindow", "parseTargetCount"]) {
      expect(src, `actions must call ${fn}`).toContain(fn);
    }
  });

  it("previews before writing: nothing is created without confirm=1", () => {
    const src = actions();
    expect(src).toContain('formData.get("confirm") === "1"');
    // Both builders return a preview on the first pass.
    expect(src.match(/if \(!confirm\) \{/g) ?? []).toHaveLength(2);
  });

  it("documents CSV-only support and defers XLSX", () => {
    const prd = read("docs/28_PRICING_INTELLIGENCE_DYNAMIC_PRICING_PRD.md");
    expect(prd).toContain("XLSX is **deferred**");
    const forms = read("src/app/(dashboard)/products/pricing/runs/run-forms.tsx");
    expect(forms).toContain("CSV only in this phase");
  });

  it("documents the feature-flag posture for reading stored runs", () => {
    const prd = read("docs/28_PRICING_INTELLIGENCE_DYNAMIC_PRICING_PRD.md");
    expect(prd.replace(/\s+/g, " ")).toContain("gates **creation and mutation**");
    // The export route stays permission-gated, not flag-gated.
    const route = read("src/app/api/exports/pricing/runs/[id]/route.ts");
    expect(route).toContain("PERMISSIONS.PRICING_EXPORT");
    expect(route).not.toContain("requireFeature");
  });

  it("still writes no observation, recommendation, or writeback", () => {
    for (const rel of [
      "src/server/services/pricing/runs.ts",
      "src/app/(dashboard)/products/pricing/runs/actions.ts",
    ]) {
      const src = read(rel);
      for (const table of [
        "competitorPriceObservation",
        "priceRecommendation",
        "priceWritebackLog",
      ]) {
        expect(src, `${rel} must not write ${table}`).not.toContain(`prisma.${table}`);
      }
      expect(src, `${rel} must not use the writeback flag`).not.toContain("PRICING_WRITEBACKS");
    }
  });
});

describe("DP-3 read-only collection canaries", () => {
  const dp3Files = [
    "src/server/services/pricing/observations.ts",
    "src/server/services/pricing/eligibility.ts",
    "src/server/services/pricing/extraction.ts",
    "src/server/services/pricing/collector.ts",
    "src/server/inngest/functions/pricing/competitor-check.ts",
    "src/app/(dashboard)/products/pricing/runs/actions.ts",
  ];

  it("creates observations but never a recommendation or writeback log", () => {
    for (const rel of dp3Files) {
      const src = read(rel);
      expect(src, rel + " must not write recommendations").not.toContain(
        "prisma.priceRecommendation",
      );
      expect(src, rel + " must not write writeback logs").not.toContain("prisma.priceWritebackLog");
    }
    expect(read("src/server/inngest/functions/pricing/competitor-check.ts")).toContain(
      "prisma.competitorPriceObservation.create",
    );
  });

  it("never references the writeback flags", () => {
    for (const rel of dp3Files) {
      const src = read(rel);
      const code = stripComments(src);
      expect(code, rel + " must not use pricing.writebacks").not.toContain("PRICING_WRITEBACKS");
      expect(code, rel + " must not use external.writebacks").not.toContain("EXTERNAL_WRITEBACKS");
      expect(code, rel).not.toContain("external.writebacks");
    }
  });

  it("has no BigCommerce path", () => {
    for (const rel of dp3Files) {
      const src = read(rel);
      expect(src, rel).not.toContain("integrations/bigcommerce");
      expect(src, rel).not.toMatch(/X-Auth-Token|bcFetch/);
    }
  });

  it("issues GET only — no write verb reaches a competitor", () => {
    const collector = read("src/server/services/pricing/collector.ts");
    expect(collector).toContain('method: "GET"');
    expect(collector).not.toMatch(/method:\s*"(POST|PUT|PATCH|DELETE)"/);
  });

  it("sends no credentials and does not follow redirects", () => {
    const collector = read("src/server/services/pricing/collector.ts");
    // A redirect could land on a host that never passed terms review.
    expect(collector).toContain('redirect: "manual"');
    expect(collector).toContain('credentials: "omit"');
    expect(stripComments(collector)).not.toMatch(/Authorization|Cookie:|setCookie/i);
  });

  it("identifies itself and honours robots.txt", () => {
    const collector = read("src/server/services/pricing/collector.ts");
    expect(collector).toContain("User-Agent");
    expect(collector).toContain("isAllowedByRobots");
  });

  it("has no CAPTCHA, login, or bot-evasion handling", () => {
    for (const rel of dp3Files) {
      const src = read(rel);
      expect(stripComments(src), rel).not.toMatch(
        /captcha|recaptcha|hcaptcha|bypass|stealth|signin/i,
      );
    }
  });

  it("uses no general web search and no AI matching", () => {
    for (const rel of dp3Files) {
      const src = read(rel);
      expect(stripComments(src), rel).not.toMatch(/web_search|googleapis|bing\.|openai|anthropic/i);
    }
  });

  it("dispatches through the worker rather than fetching in a request", () => {
    const actions = read("src/app/(dashboard)/products/pricing/runs/actions.ts");
    expect(actions).toContain("requestCompetitorCheck");
    expect(actions).not.toMatch(/\bfetch\(/);
    expect(read("src/server/services/pricing/observations.ts")).toContain("inngest.send");
  });

  it("requires pricing.run_checks to start a check", () => {
    expect(read("src/app/(dashboard)/products/pricing/runs/actions.ts")).toContain(
      "PERMISSIONS.PRICING_RUN_CHECKS",
    );
  });

  it("gates collection on pricing.intelligence", () => {
    expect(read("src/server/services/pricing/observations.ts")).toContain(
      "requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE)",
    );
    expect(read("src/server/inngest/functions/pricing/competitor-check.ts")).toContain(
      "requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE)",
    );
  });

  it("audits the request and the batch outcome", () => {
    expect(read("src/server/services/pricing/observations.ts")).toContain(
      "pricing.competitor_check_requested",
    );
    expect(read("src/server/inngest/functions/pricing/competitor-check.ts")).toContain(
      "pricing.observation_batch_completed",
    );
  });

  it("never marks an item recommendation_ready in this phase", () => {
    for (const rel of dp3Files) {
      expect(read(rel), rel).not.toContain("recommendation_ready");
    }
  });
});

describe("DP-3A corrections", () => {
  const planner = () => read("src/server/services/pricing/observations.ts");
  const worker = () => read("src/server/inngest/functions/pricing/competitor-check.ts");
  const collector = () => read("src/server/services/pricing/collector.ts");

  it("counts the batch in products, not competitor URLs", () => {
    // A batch of 300 read as URL targets would check only 60 products when
    // each has five competitors.
    const src = planner();
    expect(src).toContain("itemsSelected");
    expect(src).toContain("if (itemsSelected >= batchSize) break;");
    expect(src).toContain("itemsSelected += 1;");
  });

  it("resolves multiple competitor URLs per product", () => {
    const src = planner();
    expect(src).toContain("selectCompetitorUrlsForItem");
    expect(read("src/server/services/pricing/eligibility.ts")).toContain(
      "MAX_COMPETITOR_URLS_PER_ITEM = 5",
    );
  });

  it("caps targets at each competitor's remaining hourly allowance", () => {
    const src = planner();
    expect(src).toContain("remainingHourlyAllowance");
    expect(src).toContain("allowance.set(candidate.competitorId, left - 1)");
  });

  it("waits the full spacing rather than a truncated one", () => {
    // The earlier implementation capped the wait at 10s, which could exceed a
    // competitor's hourly limit on a 60/hour setting.
    const src = stripComments(worker());
    expect(src).toContain("await sleep(wait)");
    expect(src).not.toMatch(/Math\.min\(wait/);
  });

  it("refuses an oversized response before and during reading", () => {
    const src = collector();
    expect(src).toContain('response.headers.get("content-length")');
    expect(src).toContain("readCapped");
    expect(src).toContain("await reader.cancel()");
  });

  it("does not follow cross-origin robots redirects", () => {
    // A cross-origin robots redirect must never authorise checking a URL: the
    // file granting permission would belong to a different site.
    const src = collector();
    expect(src).toContain("next.origin !== origin");
    expect(stripComments(src)).not.toContain('redirect: "follow"');
  });

  it("audits grouped skip counts so shortfalls are explainable", () => {
    expect(planner()).toContain("skipCounts");
    const eligibility = read("src/server/services/pricing/eligibility.ts");
    for (const reason of [
      "blocked",
      "missing_cost",
      "missing_floor",
      "no_competitor_url",
      "disabled",
      "terms_not_reviewed",
      "terms_restricted",
      "rate_limited",
      "robots_disallowed",
      "invalid_url",
    ]) {
      expect(eligibility, "missing skip reason " + reason).toContain(reason);
    }
  });

  it("states the product-vs-URL distinction and the read-only posture in the UI", () => {
    const form = read("src/app/(dashboard)/products/pricing/runs/competitor-check-form.tsx");
    expect(form.replace(/\s+/g, " ")).toContain("Batch size means products, not competitor URLs.");
    expect(form.replace(/\s+/g, " ")).toContain(
      "It does not create recommendations, approvals, or BigCommerce price changes.",
    );
    expect(form).toContain("reviewed_allowed");
    expect(form.replace(/\s+/g, " ")).toContain(
      "The actual number of checks may be lower than the product batch size",
    );
  });

  it("still creates observations only", () => {
    for (const src of [planner(), worker(), collector()]) {
      expect(src).not.toContain("prisma.priceRecommendation");
      expect(src).not.toContain("prisma.priceWritebackLog");
      expect(stripComments(src)).not.toContain("PRICING_WRITEBACKS");
      expect(stripComments(src)).not.toContain("EXTERNAL_WRITEBACKS");
      expect(src).not.toContain("integrations/bigcommerce");
    }
    expect(worker()).toContain("prisma.competitorPriceObservation.create");
  });
});

describe("DP-4 recommendation canaries", () => {
  const engine = () => read("src/server/services/pricing/recommendation.ts");
  const service = () => read("src/server/services/pricing/recommendations.ts");
  const action = () => read("src/app/(dashboard)/products/pricing/recommendations/actions.ts");
  const listPage = () => read("src/app/(dashboard)/products/pricing/recommendations/page.tsx");
  const exportRoute = () => read("src/app/api/exports/pricing/recommendations/route.ts");
  const dp4 = () => [engine(), service(), action(), listPage(), exportRoute()];

  it("creates recommendations and mutates no price anywhere", () => {
    for (const src of dp4()) {
      const code = stripComments(src);
      // The queue row and the run item are ours. A product, variant, or
      // BigCommerce price is not.
      expect(code).not.toMatch(/prisma\.product\.update/);
      expect(code).not.toMatch(/prisma\.productVariant\.update/);
      expect(code).not.toMatch(/prisma\.product\.updateMany/);
      expect(code).not.toMatch(/prisma\.productVariant\.updateMany/);
      expect(code).not.toContain("integrations/bigcommerce");
      expect(code).not.toMatch(/priceWritebackLog/);
    }
    expect(service()).toContain("prisma.priceRecommendation.create");
  });

  /**
   * NARROWED IN DP-5.
   *
   * Through DP-4 this asserted that NO file in the recommendation tree touched
   * a decision column. DP-5 adds approval, so the pages legitimately DISPLAY
   * approvedBy/rejectedBy and the actions legitimately record them. What must
   * still hold is that GENERATION never decides: the engine and the generation
   * service may not set a decision column or a decided status. The DP-5
   * canaries below pin the other half — that only the approval service writes
   * those columns.
   */
  it("generation implements no approval or rejection", () => {
    for (const src of [engine(), service()]) {
      const code = stripComments(src);
      expect(code).not.toMatch(/approvedById|approvedAt|rejectedById|rejectedAt|rejectionReason/);
      expect(code).not.toMatch(/prisma\.approval\./);
      expect(code).not.toMatch(/status:\s*"approved"|status:\s*"rejected"/);
    }
  });

  it("references no writeback flag", () => {
    for (const src of dp4()) {
      expect(stripComments(src)).not.toContain("PRICING_WRITEBACKS");
      expect(stripComments(src)).not.toContain("EXTERNAL_WRITEBACKS");
      expect(stripComments(src)).not.toContain("pricing.writebacks");
      expect(stripComments(src)).not.toContain("external.writebacks");
    }
  });

  it("collects no new evidence: no fetch, browser, AI, or web search", () => {
    for (const src of dp4()) {
      const code = stripComments(src);
      expect(code).not.toMatch(/fetch\(/i);
      expect(code).not.toMatch(/axios|playwright|puppeteer|chromium|cheerio|jsdom/i);
      expect(code).not.toMatch(/openai|anthropic|web_search|googleapis|bing\./i);
      expect(code).not.toContain("prisma.competitorPriceObservation.create");
    }
  });

  it("writes every recommendation as ready_for_review requiring approval", () => {
    const code = stripComments(service());
    expect(code).toContain("requiresApproval: true");
    expect(code).toContain('status: "ready_for_review"');
    // No path may set requiresApproval false or auto-approve.
    expect(code).not.toContain("requiresApproval: false");
    expect(code).not.toContain("autoApprove");
  });

  it("gates generation on review permission and the pricing.intelligence flag", () => {
    expect(action()).toContain("PERMISSIONS.PRICING_REVIEW_RECOMMENDATIONS");
    expect(service()).toContain("FEATURE_FLAGS.PRICING_INTELLIGENCE");
    expect(exportRoute()).toContain("PERMISSIONS.PRICING_EXPORT");
  });

  it("never stores a price for a blocked outcome", () => {
    // recommendedSalePrice is non-nullable, so a blocked row could only be
    // stored by inventing a number. The service must gate on the priced list.
    expect(stripComments(service())).toContain("PRICED_RECOMMENDATION_TYPES");
    expect(stripComments(engine())).toContain("recommendedSalePrice: null");
  });

  /**
   * SUPERSEDED IN DP-5.
   *
   * The DP-4 sign-off wording was "No recommendation has been approved. No
   * price has been changed. Approval and writeback are later phases." Two of
   * those three sentences became false the moment approval shipped, so keeping
   * them on the pages would have been a lie the canary enforced. The DP-5
   * canary below pins the replacement wording, which still makes the load-
   * bearing promise: approval changes no price.
   *
   * The GENERATE form keeps its DP-4 wording, which is still true of it.
   */
  it("states on the generate form that it approves and writes nothing", () => {
    const form = read(
      "src/app/(dashboard)/products/pricing/recommendations/generate-form.tsx",
    ).replace(/\s+/g, " ");
    expect(form).toContain(
      "This creates recommendations only. It does not approve or write prices.",
    );
  });
});

describe("DP-5 approval canaries", () => {
  const rules = () => read("src/server/services/pricing/approval.ts");
  const service = () => read("src/server/services/pricing/approvals.ts");
  const action = () => read("src/app/(dashboard)/products/pricing/recommendations/actions.ts");
  const forms = () =>
    read("src/app/(dashboard)/products/pricing/recommendations/decision-forms.tsx");
  const detail = () => read("src/app/(dashboard)/products/pricing/recommendations/[id]/page.tsx");
  const list = () => read("src/app/(dashboard)/products/pricing/recommendations/page.tsx");
  const dp5 = () => [rules(), service(), action(), forms(), detail(), list()];

  it("writes no product or variant price", () => {
    for (const src of dp5()) {
      const code = stripComments(src);
      expect(code).not.toMatch(/prisma[.]product[.](update|updateMany|upsert)/);
      expect(code).not.toMatch(/prisma[.]productVariant[.](update|updateMany|upsert)/);
      // The words that would signal a price mutation slipping in.
      expect(code).not.toMatch(/updateProductPrice|setSalePrice|setRegularPrice/);
    }
  });

  it("creates no writeback log and imports no BigCommerce integration", () => {
    for (const src of dp5()) {
      const code = stripComments(src);
      expect(code).not.toMatch(/priceWritebackLog/i);
      expect(code).not.toContain("integrations/bigcommerce");
    }
  });

  it("references no writeback flag", () => {
    for (const src of dp5()) {
      const code = stripComments(src);
      expect(code).not.toContain("PRICING_WRITEBACKS");
      expect(code).not.toContain("EXTERNAL_WRITEBACKS");
      expect(code).not.toContain("pricing.writebacks");
      expect(code).not.toContain("external.writebacks");
      expect(code).not.toContain("PRICING_WRITEBACK_BIGCOMMERCE");
    }
  });

  it("makes no outbound request and uses no AI, search, or browser", () => {
    for (const src of dp5()) {
      const code = stripComments(src);
      expect(code).not.toMatch(/fetch[(]/i);
      expect(code).not.toMatch(/axios|playwright|puppeteer|chromium|cheerio|jsdom/i);
      expect(code).not.toMatch(/openai|anthropic|web_search|googleapis|bing[.]/i);
    }
  });

  it("mutates only PriceRecommendation and the internal PricingRunItem row", () => {
    const code = stripComments(service());
    const writes =
      code.match(
        /prisma[.][a-zA-Z]+[.](create|createMany|update|updateMany|upsert|delete|deleteMany)/g,
      ) ?? [];
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) {
      expect(["prisma.priceRecommendation.update", "prisma.pricingRunItem.update"]).toContain(
        write,
      );
    }
  });

  it("gates both decisions on pricing.approve_recommendations", () => {
    const code = stripComments(action());
    expect(code).toContain("PERMISSIONS.PRICING_APPROVE_RECOMMENDATIONS");
    // The generate action keeps the weaker permission; a decision must not be
    // reachable on it.
    expect(code).toMatch(/approveRecommendationAction/);
    expect(code).toMatch(/rejectRecommendationAction/);
    expect(stripComments(rules())).toContain("PRICING_APPROVE_RECOMMENDATIONS");
  });

  it("requires the pricing.intelligence flag for a decision", () => {
    expect(stripComments(service())).toContain("FEATURE_FLAGS.PRICING_INTELLIGENCE");
  });

  it("sets decision columns only in the approval service", () => {
    // DP-4 generation must never write a decision column.
    const generation = read("src/server/services/pricing/recommendations.ts");
    for (const column of ["approvedById", "approvedAt", "rejectedById", "rejectedAt"]) {
      expect(stripComments(generation), column).not.toContain(column + ":");
    }
    const code = stripComments(service());
    expect(code).toContain("approvedById: args.actorUserId");
    expect(code).toContain("rejectedById: args.actorUserId");
  });

  it("never clears the approval requirement", () => {
    for (const src of dp5()) {
      expect(stripComments(src)).not.toContain("requiresApproval: false");
      expect(stripComments(src)).not.toContain("autoApprove");
    }
  });

  it("states on every decision surface that approval changes no price", () => {
    const REQUIRED =
      "Approved recommendations are internal approvals only. No BigCommerce price change " +
      "occurs until a later controlled writeback phase.";
    expect(list().replace(/\s+/g, " ")).toContain(REQUIRED);
    expect(detail().replace(/\s+/g, " ")).toContain(REQUIRED);
    expect(forms().replace(/\s+/g, " ")).toContain(
      "Approval marks this recommendation as internally approved only. It does not update " +
        "BigCommerce or change any product price.",
    );
    expect(detail().replace(/\s+/g, " ")).toContain(
      "This recommendation is expired. Re-run observation and recommendation generation before approving.",
    );
  });
});

describe("DP-5A: the UI predicate matches the server", () => {
  const detail = () => read("src/app/(dashboard)/products/pricing/recommendations/[id]/page.tsx");

  it("gates the approve control on the full server check, not a subset", () => {
    const code = stripComments(read("src/server/services/pricing/approval.ts"));
    // showsApproveControl must delegate to canApprove rather than re-implement
    // a looser version of it. A hand-rolled subset is what let a row the server
    // would refuse still render an Approve button.
    expect(code).toMatch(/showsApproveControl[\s\S]*?canApprove\(/);
    expect(code).not.toContain("showsDecisionControls");
  });

  it("keeps reject reachable when approve is not", () => {
    const code = stripComments(read("src/server/services/pricing/approval.ts"));
    // showsRejectControl must NOT consult canApprove: rejection exists to clear
    // rows that can never be approved.
    const reject = code.slice(code.indexOf("export function showsRejectControl"));
    const body = reject.slice(
      0,
      reject.indexOf("}" + String.fromCharCode(10) + String.fromCharCode(10)),
    );
    expect(body).not.toContain("canApprove");
  });

  it("renders both controls from the split predicates", () => {
    const code = stripComments(detail());
    expect(code).toContain("showsApproveControl");
    expect(code).toContain("showsRejectControl");
    expect(code).toContain("approveUnavailableReason");
  });
});
