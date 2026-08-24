/**
 * Execution-path canaries for the Sales Intelligence service.
 *
 * The service is declared read-only, which is only worth anything if it is
 * enforced. These scan the shipped source for the absence of write and
 * outbound paths — a new write appearing here fails the build until someone
 * deliberately updates the allowlist.
 *
 * Comments are stripped before scanning so the prose above (which names the
 * very things being forbidden) cannot satisfy its own canary.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const DIR = __dirname;

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** Every shipped source file in the service — tests excluded. */
const sourceFiles = readdirSync(DIR)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => ({ name: f, code: stripComments(readFileSync(join(DIR, f), "utf8")) }));

const allCode = sourceFiles.map((f) => f.code).join("\n");

describe("the service ships more than one file", () => {
  it("finds the sources it is meant to be guarding", () => {
    // A canary that scans nothing passes vacuously.
    const names = sourceFiles.map((f) => f.name).sort();
    expect(names).toContain("index.ts");
    expect(names).toContain("policy.ts");
  });
});

describe("no write path exists", () => {
  it("calls no Prisma mutation", () => {
    // Longest-first alternation: `create|createMany` would match "create" and
    // truncate "createMany", making the assertion meaningless.
    const writes =
      allCode.match(
        /prisma\.[a-zA-Z]+\.(createMany|create|updateMany|update|upsert|deleteMany|delete)\b/g,
      ) ?? [];
    expect(writes).toEqual([]);
  });

  it("uses no raw execute path that could smuggle a write past the check above", () => {
    for (const forbidden of [
      "$executeRaw",
      "$executeRawUnsafe",
      "$queryRawUnsafe",
      "$transaction",
    ]) {
      expect(allCode, forbidden).not.toContain(forbidden);
    }
  });

  it("touches none of the models a pricing action would write", () => {
    for (const model of [
      "prisma.priceWritebackLog",
      "prisma.priceRecommendation",
      "prisma.pricingRun",
      "prisma.pricingRunItem",
      "prisma.pricingCompetitor",
      "prisma.approval",
      "prisma.auditLog",
    ]) {
      expect(allCode, model).not.toContain(model);
    }
  });

  it("reads the pricing rule and nothing else from the pricing tables", () => {
    // The margin floor is read from PricingRule so this service and the
    // engine cannot drift apart. Every such access must be a read of that one
    // model — the count is free to change, the shape is not.
    const pricingAccess = allCode.match(/prisma\.pricing[A-Za-z]*\.[a-zA-Z]+/g) ?? [];
    expect(pricingAccess.length).toBeGreaterThan(0);
    for (const access of pricingAccess) {
      expect(access).toMatch(/^prisma\.pricingRule\.(findFirst|findUnique|findMany|count)$/);
    }
  });
});

describe("no outbound call exists", () => {
  it("makes no HTTP request", () => {
    expect(allCode).not.toMatch(/\bfetch\s*\(/);
    expect(allCode).not.toContain("axios");
    expect(allCode).not.toContain("https://");
  });

  it("imports no BigCommerce code at all", () => {
    expect(allCode).not.toContain("integrations/bigcommerce");
    expect(allCode).not.toContain("bigcommerce/client");
    expect(allCode).not.toContain("BigCommerce");
  });

  it("imports only the two modules it is allowed to", () => {
    /**
     * An allowlist rather than a denylist of forbidden paths. A denylist can
     * only forbid what someone thought of; this enumerates everything the
     * service may reach, so any new dependency — a writeback service, a sync
     * dispatcher, an Inngest client — fails here until it is justified.
     *
     * It also avoids naming forbidden module paths as string literals, which
     * would trip the repo's other import canaries (`rollback-canaries.test.ts`
     * scans every file for quoted references to the rollback service).
     */
    const allowed = new Set(["@prisma/client", "@/server/db/client", "./policy"]);
    const specifiers = [...allCode.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    for (const spec of specifiers) {
      expect(allowed, `unexpected import: ${spec}`).toContain(spec);
    }
  });

  it("touches no credential", () => {
    expect(allCode).not.toContain("integrationConnection");
    expect(allCode).not.toContain("resolveCredential");
    expect(allCode).not.toContain("MASTER_ENCRYPTION_KEY");
    expect(allCode).not.toMatch(/apiToken|storeHash/);
  });
});

describe("no feature-flag path exists", () => {
  it("neither reads nor writes a flag", () => {
    for (const forbidden of [
      "setFeatureFlag",
      "isFeatureOn",
      "requireFeature",
      "prisma.featureFlag",
      "FEATURE_FLAGS",
    ]) {
      expect(allCode, forbidden).not.toContain(forbidden);
    }
  });
});

describe("policy is genuinely pure", () => {
  const policy = sourceFiles.find((f) => f.name === "policy.ts")?.code ?? "";

  it("has no database access", () => {
    // The generated `OrderStatus` enum comes from @prisma/client, which is a
    // type-level import and not a client. What must be absent is the client
    // instance — any `prisma.<model>` call.
    expect(policy).not.toMatch(/prisma\.[a-zA-Z]/);
    expect(policy).not.toContain("@/server/db");
  });

  it("imports nothing but the generated status enum", () => {
    const imports = policy.match(/^import .*$/gm) ?? [];
    expect(imports).toHaveLength(1);
    expect(imports[0]).toContain("@prisma/client");
  });

  it("is free of ambient time and randomness, so its results are reproducible", () => {
    expect(policy).not.toMatch(/Date\.now\(\)/);
    expect(policy).not.toMatch(/new Date\(\s*\)/);
    expect(policy).not.toContain("Math.random");
  });
});

describe("the service does not smuggle in a clock", () => {
  it("takes `now` as an argument rather than reading it", () => {
    // lastNDays(days, now) — an ambient clock would make every caller's
    // results untestable and quietly timezone-dependent.
    const index = sourceFiles.find((f) => f.name === "index.ts")?.code ?? "";
    expect(index).toContain("lastNDays(days: number, now: Date)");
    expect(index).not.toMatch(/Date\.now\(\)/);
    expect(index).not.toMatch(/new Date\(\s*\)/);
  });
});
