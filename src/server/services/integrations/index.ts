import type { IntegrationType } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import {
  decryptSecret,
  encryptSecret,
  lastFour,
  SecretVaultDecryptError,
  SecretVaultNotConfiguredError,
  vaultEnabled,
} from "@/server/security/secrets";

// -----------------------------------------------------------------------------
// Listing for the Admin → Integrations settings UI
// -----------------------------------------------------------------------------

export type IntegrationSettingsRow = {
  id: string;
  integrationType: IntegrationType;
  name: string;
  status: string;
  notes: string | null;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  envVarName: string | null;
  envVarPresent: boolean;
  vaultSecretSet: boolean;
  secretLastFour: string | null;
  secretSetAt: string | null;
  secretSetByName: string | null;
  effectiveSource: "env" | "vault" | "none";
};

/**
 * Maps each integration type to the env var that takes precedence over the
 * vault. When both are present, env wins (lowest-friction for dev/CI).
 */
const ENV_VAR_FOR_TYPE: Partial<Record<IntegrationType, string>> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  bigcommerce: "BIGCOMMERCE_API_TOKEN",
  mailchimp: "MAILCHIMP_API_KEY",
};

export async function listIntegrationSettings(): Promise<IntegrationSettingsRow[]> {
  const records = await prisma.integrationConnection.findMany({
    orderBy: [{ integrationType: "asc" }, { name: "asc" }],
    include: { secretSetBy: { select: { name: true, email: true } } },
  });

  return records.map((r) => {
    const envVarName = ENV_VAR_FOR_TYPE[r.integrationType] ?? null;
    const envVarPresent = !!(envVarName && process.env[envVarName]);
    const vaultSecretSet = !!r.encryptedSecret;
    const effectiveSource: "env" | "vault" | "none" = envVarPresent
      ? "env"
      : vaultSecretSet
        ? "vault"
        : "none";

    return {
      id: r.id,
      integrationType: r.integrationType,
      name: r.name,
      status: r.status,
      notes: r.notes,
      lastSyncAt: r.lastSyncAt?.toISOString() ?? null,
      lastSuccessfulSyncAt: r.lastSuccessfulSyncAt?.toISOString() ?? null,
      envVarName,
      envVarPresent,
      vaultSecretSet,
      secretLastFour: r.secretLastFour,
      secretSetAt: r.secretSetAt?.toISOString() ?? null,
      secretSetByName: r.secretSetBy?.name ?? r.secretSetBy?.email ?? null,
      effectiveSource,
    };
  });
}

// -----------------------------------------------------------------------------
// Resolve a secret at integration call time — env first, then vault.
// -----------------------------------------------------------------------------

export async function resolveSecretForType(
  integrationType: IntegrationType,
): Promise<string | null> {
  const envVarName = ENV_VAR_FOR_TYPE[integrationType];
  if (envVarName) {
    const fromEnv = process.env[envVarName];
    if (fromEnv) return fromEnv;
  }

  if (!vaultEnabled()) return null;

  // Pick the most recently configured connection of this type that has a
  // secret. (Today there is at most one per type that needs an API key.)
  const record = await prisma.integrationConnection.findFirst({
    where: { integrationType, encryptedSecret: { not: null } },
    orderBy: { secretSetAt: "desc" },
  });
  if (!record?.encryptedSecret) return null;

  try {
    return decryptSecret(record.encryptedSecret);
  } catch (err) {
    if (err instanceof SecretVaultNotConfiguredError) return null;
    if (err instanceof SecretVaultDecryptError) {
      console.error(
        `[integrations] Failed to decrypt secret for ${integrationType} connection ${record.id}:`,
        err.cause,
      );
      return null;
    }
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Mutations — gated by ADMIN_MANAGE_INTEGRATIONS at the action layer
// -----------------------------------------------------------------------------

export async function setIntegrationSecret(args: {
  integrationId: string;
  plaintext: string;
  actorUserId: string;
}) {
  const trimmed = args.plaintext.trim();
  if (!trimmed) throw new Error("Secret cannot be empty.");
  if (!vaultEnabled()) throw new SecretVaultNotConfiguredError();

  const before = await prisma.integrationConnection.findUnique({
    where: { id: args.integrationId },
    select: { id: true, name: true, integrationType: true, encryptedSecret: true },
  });
  if (!before) throw new Error("Integration not found.");

  const encrypted = encryptSecret(trimmed);
  const updated = await prisma.integrationConnection.update({
    where: { id: args.integrationId },
    data: {
      encryptedSecret: encrypted,
      secretLastFour: lastFour(trimmed),
      secretSetAt: new Date(),
      secretSetById: args.actorUserId,
      status: "configured",
    },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: before.encryptedSecret ? "integration.secret_rotated" : "integration.secret_set",
    entityType: "IntegrationConnection",
    entityId: updated.id,
    afterData: {
      name: updated.name,
      integrationType: updated.integrationType,
      lastFour: lastFour(trimmed),
    },
  });
  return updated;
}

export async function clearIntegrationSecret(args: { integrationId: string; actorUserId: string }) {
  const before = await prisma.integrationConnection.findUnique({
    where: { id: args.integrationId },
    select: { id: true, name: true, integrationType: true, encryptedSecret: true },
  });
  if (!before) throw new Error("Integration not found.");
  if (!before.encryptedSecret) return before;

  const updated = await prisma.integrationConnection.update({
    where: { id: args.integrationId },
    data: {
      encryptedSecret: null,
      secretLastFour: null,
      secretSetAt: null,
      secretSetById: null,
      status: "not_configured",
    },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "integration.secret_cleared",
    entityType: "IntegrationConnection",
    entityId: updated.id,
    afterData: { name: updated.name, integrationType: updated.integrationType },
  });
  return updated;
}

export async function updateIntegrationNotes(args: {
  integrationId: string;
  notes: string | null;
  actorUserId: string;
}) {
  await prisma.integrationConnection.update({
    where: { id: args.integrationId },
    data: { notes: args.notes },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "integration.notes_updated",
    entityType: "IntegrationConnection",
    entityId: args.integrationId,
  });
}
