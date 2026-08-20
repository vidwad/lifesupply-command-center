/**
 * Pricing Intelligence services (DP-1 — docs/22 PRD).
 *
 * Setup CRUD for competitors and pricing rules only. This phase contacts no
 * competitor website and contains no BigCommerce write path: runs, checks,
 * recommendations, approvals, and writebacks arrive in later DP phases, each
 * behind its own flags, permissions, and approvals.
 *
 * Callers (server actions/pages) enforce permissions; every mutation here
 * re-checks the module flag so direct calls fail closed when disabled, and
 * writes an audit entry with before/after data.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { requireFeature } from "@/server/services/feature-flags";

import {
  PricingValidationError,
  validateCompetitorInput,
  validatePricingRuleInput,
  type CompetitorInput,
  type PricingRuleInput,
} from "./validation";

export { PricingValidationError };

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function getPricingOverview() {
  const [competitorCount, enabledCompetitorCount, ruleCount, enabledRuleCount] = await Promise.all([
    prisma.pricingCompetitor.count(),
    prisma.pricingCompetitor.count({ where: { enabled: true } }),
    prisma.pricingRule.count(),
    prisma.pricingRule.count({ where: { enabled: true } }),
  ]);
  return { competitorCount, enabledCompetitorCount, ruleCount, enabledRuleCount };
}

// ---------------------------------------------------------------------------
// Competitors
// ---------------------------------------------------------------------------

export async function listPricingCompetitors() {
  return prisma.pricingCompetitor.findMany({
    orderBy: [{ enabled: "desc" }, { name: "asc" }],
    include: { _count: { select: { observations: true, productUrls: true } } },
  });
}

export async function createPricingCompetitor(args: {
  actorUserId: string;
  input: CompetitorInput;
}): Promise<string> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const input = validateCompetitorInput(args.input);
  const existing = await prisma.pricingCompetitor.findUnique({ where: { name: input.name } });
  if (existing)
    throw new PricingValidationError(`A competitor named "${input.name}" already exists.`);
  const competitor = await prisma.pricingCompetitor.create({ data: input });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.competitor_created",
    entityType: "PricingCompetitor",
    entityId: competitor.id,
    afterData: input,
  });
  return competitor.id;
}

export async function updatePricingCompetitor(args: {
  actorUserId: string;
  id: string;
  input: CompetitorInput;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const input = validateCompetitorInput(args.input);
  const before = await prisma.pricingCompetitor.findUniqueOrThrow({ where: { id: args.id } });
  const clash = await prisma.pricingCompetitor.findUnique({ where: { name: input.name } });
  if (clash && clash.id !== args.id) {
    throw new PricingValidationError(`A competitor named "${input.name}" already exists.`);
  }
  await prisma.pricingCompetitor.update({ where: { id: args.id }, data: input });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.competitor_updated",
    entityType: "PricingCompetitor",
    entityId: args.id,
    beforeData: {
      name: before.name,
      baseUrl: before.baseUrl,
      enabled: before.enabled,
      currency: before.currency,
      termsReviewStatus: before.termsReviewStatus,
      rateLimitPerHour: before.rateLimitPerHour,
    },
    afterData: input,
  });
}

export async function setPricingCompetitorEnabled(args: {
  actorUserId: string;
  id: string;
  enabled: boolean;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const before = await prisma.pricingCompetitor.findUniqueOrThrow({ where: { id: args.id } });
  if (before.enabled === args.enabled) return;
  await prisma.pricingCompetitor.update({
    where: { id: args.id },
    data: { enabled: args.enabled },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: args.enabled ? "pricing.competitor_enabled" : "pricing.competitor_disabled",
    entityType: "PricingCompetitor",
    entityId: args.id,
    beforeData: { enabled: before.enabled },
    afterData: { enabled: args.enabled },
  });
}

export async function deletePricingCompetitor(args: {
  actorUserId: string;
  id: string;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const before = await prisma.pricingCompetitor.findUniqueOrThrow({
    where: { id: args.id },
    include: { _count: { select: { observations: true, productUrls: true } } },
  });
  if (before._count.observations > 0 || before._count.productUrls > 0) {
    throw new PricingValidationError(
      "This competitor has price evidence or URL mappings. Disable it instead of deleting so history stays auditable.",
    );
  }
  await prisma.pricingCompetitor.delete({ where: { id: args.id } });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.competitor_deleted",
    entityType: "PricingCompetitor",
    entityId: args.id,
    beforeData: { name: before.name, baseUrl: before.baseUrl, enabled: before.enabled },
  });
}

// ---------------------------------------------------------------------------
// Pricing rules
// ---------------------------------------------------------------------------

export async function listPricingRules() {
  return prisma.pricingRule.findMany({
    orderBy: [{ enabled: "desc" }, { name: "asc" }],
    include: { store: { select: { id: true, name: true } } },
  });
}

/** True when the rule applies globally (no store/category/product/variant scope). */
function isGlobalRule(rule: {
  storeId: string | null;
  categoryId: string | null;
  productId: string | null;
  productVariantId: string | null;
}): boolean {
  return !rule.storeId && !rule.categoryId && !rule.productId && !rule.productVariantId;
}

async function assertNotLastGlobalRule(id: string): Promise<void> {
  const rule = await prisma.pricingRule.findUniqueOrThrow({ where: { id } });
  if (!isGlobalRule(rule) || !rule.enabled) return;
  const otherGlobals = await prisma.pricingRule.count({
    where: {
      id: { not: id },
      enabled: true,
      storeId: null,
      categoryId: null,
      productId: null,
      productVariantId: null,
    },
  });
  if (otherGlobals === 0) {
    throw new PricingValidationError(
      "This is the only enabled global rule — the default price floor. Create another global rule before removing it.",
    );
  }
}

export async function createPricingRule(args: {
  actorUserId: string;
  input: PricingRuleInput;
}): Promise<string> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const input = validatePricingRuleInput(args.input);
  const existing = await prisma.pricingRule.findUnique({ where: { name: input.name } });
  if (existing) throw new PricingValidationError(`A rule named "${input.name}" already exists.`);
  if (input.storeId) {
    const store = await prisma.store.count({ where: { id: input.storeId } });
    if (!store) throw new PricingValidationError("The selected store no longer exists.");
  }
  const rule = await prisma.pricingRule.create({ data: input });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.rule_created",
    entityType: "PricingRule",
    entityId: rule.id,
    afterData: input,
  });
  return rule.id;
}

export async function updatePricingRule(args: {
  actorUserId: string;
  id: string;
  input: PricingRuleInput;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const input = validatePricingRuleInput(args.input);
  const before = await prisma.pricingRule.findUniqueOrThrow({ where: { id: args.id } });
  const clash = await prisma.pricingRule.findUnique({ where: { name: input.name } });
  if (clash && clash.id !== args.id) {
    throw new PricingValidationError(`A rule named "${input.name}" already exists.`);
  }
  if (input.storeId) {
    const store = await prisma.store.count({ where: { id: input.storeId } });
    if (!store) throw new PricingValidationError("The selected store no longer exists.");
  }
  if (!input.enabled) await assertNotLastGlobalRule(args.id);
  await prisma.pricingRule.update({ where: { id: args.id }, data: input });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.rule_updated",
    entityType: "PricingRule",
    entityId: args.id,
    beforeData: {
      name: before.name,
      minCostMultiplier: Number(before.minCostMultiplier),
      dailyBatchSize: before.dailyBatchSize,
      requiresApproval: before.requiresApproval,
      enabled: before.enabled,
      storeId: before.storeId,
    },
    afterData: input,
  });
}

export async function setPricingRuleEnabled(args: {
  actorUserId: string;
  id: string;
  enabled: boolean;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const before = await prisma.pricingRule.findUniqueOrThrow({ where: { id: args.id } });
  if (before.enabled === args.enabled) return;
  if (!args.enabled) await assertNotLastGlobalRule(args.id);
  await prisma.pricingRule.update({ where: { id: args.id }, data: { enabled: args.enabled } });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: args.enabled ? "pricing.rule_enabled" : "pricing.rule_disabled",
    entityType: "PricingRule",
    entityId: args.id,
    beforeData: { enabled: before.enabled },
    afterData: { enabled: args.enabled },
  });
}

export async function deletePricingRule(args: { actorUserId: string; id: string }): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const before = await prisma.pricingRule.findUniqueOrThrow({ where: { id: args.id } });
  await assertNotLastGlobalRule(args.id);
  await prisma.pricingRule.delete({ where: { id: args.id } });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.rule_deleted",
    entityType: "PricingRule",
    entityId: args.id,
    beforeData: {
      name: before.name,
      minCostMultiplier: Number(before.minCostMultiplier),
      dailyBatchSize: before.dailyBatchSize,
      enabled: before.enabled,
      storeId: before.storeId,
    },
  });
}
