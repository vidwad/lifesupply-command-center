import type { PrismaClient } from "@prisma/client";

import { seedBuiltinTemplates } from "../../src/server/services/prompt-templates";
import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAG_DESCRIPTIONS,
} from "../../src/lib/feature-flags";

/**
 * Seed Phase 2A governance rows:
 * - Prompt template library (3 builtins)
 * - Feature flag rows (all OFF by default — explicit rows make the admin UI
 *   show the description text from the moment the seed runs)
 */
export async function seedGovernance(prisma: PrismaClient) {
  console.log("→ Governance (prompt templates, feature flags)");

  const insertedTemplates = await seedBuiltinTemplates();
  console.log(`  • prompt templates: ${insertedTemplates} new (skipping existing)`);

  let insertedFlags = 0;
  for (const key of ALL_FEATURE_FLAG_KEYS) {
    const existing = await prisma.featureFlag.findUnique({ where: { key } });
    if (existing) continue;
    await prisma.featureFlag.create({
      data: {
        key,
        enabled: false,
        description: FEATURE_FLAG_DESCRIPTIONS[key],
      },
    });
    insertedFlags++;
  }
  console.log(`  • feature flags: ${insertedFlags} new (default OFF)`);
}
