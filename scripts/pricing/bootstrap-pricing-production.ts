/**
 * Targeted Pricing Intelligence bootstrap — safe to run against production.
 *
 * WHY THIS EXISTS. `pnpm db:seed` is NOT safe for production: four of its seven
 * modules write synthetic business records (operating.ts creates stores,
 * customers, products and variants; transactions.ts creates orders;
 * management.ts creates campaigns, financial summaries, reports, tasks,
 * approvals and AI outputs; strategic.ts creates investors and acquisition
 * targets). See docs/34 §4. This script does the three things the controlled
 * production pilot actually needs and nothing else.
 *
 * WRITE SURFACE — deliberately tiny, and asserted by canary:
 *   1. Upserts the nine `pricing.*` permission rows.
 *   2. Grants them to roles per the seed's own ROLE_PERMISSIONS policy, so the
 *      script and the seed cannot drift apart.
 *   3. Upserts `pricing.intelligence`, `pricing.writebacks`, and
 *      `external.writebacks` feature-flag rows — ALL created disabled.
 *   4. Upserts the `Global default` pricing rule (1.40 floor, approval required).
 *
 * It creates no user, customer, order, product, variant, or competitor; touches
 * no credential; enables no flag; changes no price; and writes no writeback log.
 *
 * SAFETY. Dry run is the default. Nothing is written without `--apply`, and
 * when DEPLOY_ENV=production `--apply` additionally requires
 * `--i-understand-this-writes-to-production`. The dry run prints exactly what
 * would change, so the apply is a confirmation rather than a leap.
 *
 *   pnpm pricing:bootstrap                 # dry run, writes nothing
 *   pnpm pricing:bootstrap --apply         # writes (non-production)
 *   pnpm pricing:bootstrap --apply --i-understand-this-writes-to-production
 */

// Relative imports (not `@/`) so plain tsx resolves them — matches
// prisma/seed.ts and scripts/cron/audit-retention.ts style.
import { PrismaClient } from "@prisma/client";

import { FEATURE_FLAG_DESCRIPTIONS, FEATURE_FLAGS } from "../../src/lib/feature-flags";
import { ALL_PERMISSION_KEYS } from "../../src/lib/permissions";
import { ROLE_PERMISSIONS } from "../../prisma/seed/auth";

const prisma = new PrismaClient();

/** The three flags the pilot touches. All are created DISABLED. */
const PILOT_FLAGS = [
  FEATURE_FLAGS.PRICING_INTELLIGENCE,
  FEATURE_FLAGS.PRICING_WRITEBACKS,
  FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
] as const;

export const DEFAULT_GLOBAL_RULE_NAME = "Global default";

/** Every `pricing.*` key in the registry — not a hardcoded list that can drift. */
export function pricingPermissionKeys(): string[] {
  return ALL_PERMISSION_KEYS.filter((key) => key.startsWith("pricing."));
}

type Plan = {
  permissionsToCreate: string[];
  permissionsExisting: string[];
  grantsToAdd: { role: string; permission: string }[];
  flagsToCreate: string[];
  flagsExisting: { key: string; enabled: boolean }[];
  ruleAction: "create" | "exists";
};

/** Reads current state and works out what would change. Writes nothing. */
async function buildPlan(): Promise<Plan> {
  const keys = pricingPermissionKeys();

  const existingPermissions = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true },
  });
  const existingKeys = new Set(existingPermissions.map((p) => p.key));

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      rolePermissions: { select: { permission: { select: { key: true } } } },
    },
  });

  const grantsToAdd: { role: string; permission: string }[] = [];
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roles.find((r) => r.name === roleName);
    // A role that does not exist is left alone — creating roles is the seed's
    // job, not this script's.
    if (!role) continue;
    const held = new Set(role.rolePermissions.map((rp) => rp.permission.key));
    for (const key of permissions as string[]) {
      if (!key.startsWith("pricing.")) continue;
      if (!held.has(key)) grantsToAdd.push({ role: roleName, permission: key });
    }
  }

  const existingFlags = await prisma.featureFlag.findMany({
    where: { key: { in: [...PILOT_FLAGS] } },
    select: { key: true, enabled: true },
  });
  const existingFlagKeys = new Set(existingFlags.map((f) => f.key));

  const rule = await prisma.pricingRule.findUnique({
    where: { name: DEFAULT_GLOBAL_RULE_NAME },
    select: { id: true },
  });

  return {
    permissionsToCreate: keys.filter((k) => !existingKeys.has(k)),
    permissionsExisting: keys.filter((k) => existingKeys.has(k)),
    grantsToAdd,
    flagsToCreate: PILOT_FLAGS.filter((f) => !existingFlagKeys.has(f)),
    flagsExisting: existingFlags,
    ruleAction: rule ? "exists" : "create",
  };
}

function printPlan(plan: Plan, apply: boolean): void {
  const verb = apply ? "APPLYING" : "DRY RUN — would";
  console.log("");
  console.log(`Pricing Intelligence bootstrap — ${apply ? "APPLY" : "DRY RUN (no writes)"}`);
  console.log("─".repeat(72));

  console.log(`Permissions: ${verb} create ${plan.permissionsToCreate.length}`);
  for (const key of plan.permissionsToCreate) console.log(`    + ${key}`);
  if (plan.permissionsExisting.length) {
    console.log(`    (${plan.permissionsExisting.length} already present, untouched)`);
  }

  console.log(`Role grants: ${verb} add ${plan.grantsToAdd.length}`);
  for (const g of plan.grantsToAdd) console.log(`    + ${g.role} → ${g.permission}`);

  console.log(`Feature flags: ${verb} create ${plan.flagsToCreate.length} (all DISABLED)`);
  for (const key of plan.flagsToCreate) console.log(`    + ${key} = OFF`);
  for (const f of plan.flagsExisting) {
    // Existing flags are reported and NOT modified — this script must never
    // change a flag's enabled state in either direction.
    console.log(`    = ${f.key} already exists, enabled=${f.enabled} (left as-is)`);
  }

  console.log(
    `Pricing rule "${DEFAULT_GLOBAL_RULE_NAME}": ${
      plan.ruleAction === "create" ? `${verb} create` : "already exists, untouched"
    }`,
  );
  console.log("─".repeat(72));
}

async function applyPlan(plan: Plan): Promise<void> {
  for (const key of plan.permissionsToCreate) {
    // module/action split from the key, matching seedAuth exactly so a row this
    // script creates is indistinguishable from a seeded one.
    const [moduleName, action] = key.split(".");
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, module: moduleName ?? "unknown", action: action ?? "unknown" },
    });
  }

  if (plan.grantsToAdd.length > 0) {
    const roles = await prisma.role.findMany({ select: { id: true, name: true } });
    const permissions = await prisma.permission.findMany({
      where: { key: { in: pricingPermissionKeys() } },
      select: { id: true, key: true },
    });
    const roleId = new Map(roles.map((r) => [r.name, r.id]));
    const permissionId = new Map(permissions.map((p) => [p.key, p.id]));

    const data = plan.grantsToAdd
      .map((g) => ({ roleId: roleId.get(g.role), permissionId: permissionId.get(g.permission) }))
      .filter((d): d is { roleId: string; permissionId: string } =>
        Boolean(d.roleId && d.permissionId),
      );
    // skipDuplicates so a concurrent run or a partial previous run is harmless.
    if (data.length) await prisma.rolePermission.createMany({ data, skipDuplicates: true });
  }

  for (const key of plan.flagsToCreate) {
    await prisma.featureFlag.create({
      data: {
        key,
        // Never enabled by this script, under any flag or argument.
        enabled: false,
        description: (FEATURE_FLAG_DESCRIPTIONS as Record<string, string>)[key] ?? key,
      },
    });
  }

  if (plan.ruleAction === "create") {
    await prisma.pricingRule.upsert({
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
          "Bootstrapped by scripts/pricing/bootstrap-pricing-production.ts. " +
          "Floor: sale price must stay at or above 140% of cost.",
      },
    });
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const productionAcknowledged = args.includes("--i-understand-this-writes-to-production");
  const isProduction = (process.env.DEPLOY_ENV ?? "").toLowerCase() === "production";

  const plan = await buildPlan();
  printPlan(plan, apply);

  if (!apply) {
    console.log("Dry run only. Nothing was written. Re-run with --apply to make these changes.");
    return;
  }

  // A production write needs a second, explicit acknowledgement. `--apply`
  // alone is easy to reach for; naming production is not.
  if (isProduction && !productionAcknowledged) {
    console.error(
      "REFUSED: DEPLOY_ENV=production. Re-run with --apply " +
        "--i-understand-this-writes-to-production if that is genuinely intended.",
    );
    process.exitCode = 1;
    return;
  }

  await applyPlan(plan);
  console.log("Applied. No flag was enabled, no price changed, no credential touched.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
