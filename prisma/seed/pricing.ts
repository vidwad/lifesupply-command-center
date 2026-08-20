/**
 * Pricing Intelligence seed (DP-1 — docs/22 PRD §9, §16).
 *
 * Creates the default global pricing rule that every future pricing run
 * falls back to when no store/category/product/variant-specific rule
 * matches. The 1.40 minimum cost multiplier is the non-negotiable price
 * floor (sale price >= 140% of cost); requiresApproval keeps every future
 * recommendation human-gated.
 */
import type { PrismaClient } from "@prisma/client";

export const DEFAULT_GLOBAL_RULE_NAME = "Global default";

export async function seedPricing(prisma: PrismaClient) {
  const rule = await prisma.pricingRule.upsert({
    where: { name: DEFAULT_GLOBAL_RULE_NAME },
    update: {},
    create: {
      name: DEFAULT_GLOBAL_RULE_NAME,
      minCostMultiplier: 1.4,
      defaultUndercutAmount: 0.01,
      maxIncreasePct: 10.0,
      maxDecreasePct: 20.0,
      dailyBatchSize: 300,
      minConfidence: 0.85,
      evidenceFreshnessHours: 48,
      requiresApproval: true,
      autoApproveEligible: false,
      enabled: true,
      notes:
        "Seeded default. Applies when no store/category/product/variant rule matches. " +
        "Floor: sale price must stay at or above 140% of cost.",
    },
  });
  console.log(`  • pricing: default global rule (${rule.id})`);
}
