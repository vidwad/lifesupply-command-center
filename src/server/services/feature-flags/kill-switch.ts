/**
 * One-click kill-switch for high-risk capabilities.
 *
 * Per docs/16 §19 disaster-recovery runbook + CLAUDE.md §16, every high-risk
 * capability must be disable-able quickly. This helper turns OFF every flag
 * that gates an external write, AI mutation, or supplier portal access in
 * a single audited action.
 *
 * It does NOT touch the read-only or low-risk flags so dashboards keep
 * working during the lockout.
 */

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/lib/feature-flags";
import { logger } from "@/server/logger";

const KILL_SET: FeatureFlagKey[] = [
  FEATURE_FLAGS.SUPPLIER_AUTOMATION,
  FEATURE_FLAGS.SUPPLIER_ORDER_SUBMIT,
  FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
  FEATURE_FLAGS.QUICKBOOKS_WRITEBACKS,
  FEATURE_FLAGS.AI_ACTIONS,
  FEATURE_FLAGS.MAILCHIMP_SEND,
  FEATURE_FLAGS.INVESTOR_DISTRIBUTION,
];

export type KillSwitchResult = {
  flippedKeys: FeatureFlagKey[];
  alreadyOff: FeatureFlagKey[];
};

export async function tripKillSwitch(args: { actor: { id: string }; reason: string }): Promise<KillSwitchResult> {
  if (!args.reason.trim()) {
    throw new Error("A reason is required to trip the kill-switch (it lands in the audit log).");
  }

  const flippedKeys: FeatureFlagKey[] = [];
  const alreadyOff: FeatureFlagKey[] = [];

  for (const key of KILL_SET) {
    const existing = await prisma.featureFlag.findUnique({ where: { key } });
    if (!existing || !existing.enabled) {
      alreadyOff.push(key);
      continue;
    }
    await prisma.featureFlag.update({
      where: { key },
      data: { enabled: false, updatedById: args.actor.id },
    });
    flippedKeys.push(key);
  }

  await writeAudit({
    actorUserId: args.actor.id,
    action: "feature_flag.kill_switch_tripped",
    entityType: "feature_flag",
    afterData: {
      flippedKeys,
      alreadyOff,
      reason: args.reason.trim(),
    },
  });

  logger.warn(
    {
      actorUserId: args.actor.id,
      flippedKeys,
      alreadyOff,
      reason: args.reason.trim(),
    },
    "kill-switch tripped",
  );

  return { flippedKeys, alreadyOff };
}

export const KILL_SWITCH_KEYS: readonly FeatureFlagKey[] = KILL_SET;
