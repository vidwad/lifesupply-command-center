import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import {
  ALL_FEATURE_FLAG_KEYS,
  FEATURE_FLAG_DESCRIPTIONS,
  type FeatureFlagKey,
} from "@/lib/feature-flags";

export type FeatureFlagRow = {
  key: FeatureFlagKey;
  enabled: boolean;
  description: string;
  updatedAt: Date | null;
  updatedById: string | null;
};

/**
 * Read a single flag. Returns false if the row does not exist — flags
 * default OFF so a missing row never accidentally enables a high-risk
 * capability.
 */
export async function isFeatureOn(key: FeatureFlagKey): Promise<boolean> {
  const row = await prisma.featureFlag.findUnique({ where: { key } });
  return row?.enabled ?? false;
}

/**
 * Read multiple flags in one query. Missing rows resolve to false.
 */
export async function getFeatureFlags(
  keys: FeatureFlagKey[],
): Promise<Record<string, boolean>> {
  const rows = await prisma.featureFlag.findMany({
    where: { key: { in: keys as string[] } },
  });
  const result: Record<string, boolean> = {};
  for (const k of keys) result[k] = false;
  for (const row of rows) result[row.key] = row.enabled;
  return result;
}

/**
 * Return every known flag, joining the static catalog with any DB rows.
 * Used by the admin UI so newly-added flag keys show up immediately even
 * before they have a row.
 */
export async function listFeatureFlags(): Promise<FeatureFlagRow[]> {
  const rows = await prisma.featureFlag.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return ALL_FEATURE_FLAG_KEYS.map((key) => {
    const row = byKey.get(key);
    return {
      key,
      enabled: row?.enabled ?? false,
      description: FEATURE_FLAG_DESCRIPTIONS[key],
      updatedAt: row?.updatedAt ?? null,
      updatedById: row?.updatedById ?? null,
    };
  });
}

export async function setFeatureFlag(
  key: FeatureFlagKey,
  enabled: boolean,
  actor: { id: string },
): Promise<void> {
  const before = await prisma.featureFlag.findUnique({ where: { key } });
  if (before?.enabled === enabled) return;
  await prisma.featureFlag.upsert({
    where: { key },
    create: {
      key,
      enabled,
      description: FEATURE_FLAG_DESCRIPTIONS[key],
      updatedById: actor.id,
    },
    update: { enabled, updatedById: actor.id },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: enabled ? "feature_flag.enabled" : "feature_flag.disabled",
    entityType: "feature_flag",
    entityId: key,
    beforeData: before ? { enabled: before.enabled } : { enabled: false },
    afterData: { enabled },
  });
}

/**
 * Throw if a feature is off. Used at the boundary of high-risk service
 * functions so the caller doesn't have to remember the check.
 */
export class FeatureDisabledError extends Error {
  constructor(public readonly key: FeatureFlagKey) {
    super(`Feature "${key}" is disabled. Enable it in /admin/feature-flags.`);
    this.name = "FeatureDisabledError";
  }
}

export async function requireFeature(key: FeatureFlagKey): Promise<void> {
  if (!(await isFeatureOn(key))) throw new FeatureDisabledError(key);
}
