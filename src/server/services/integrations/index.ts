import { Prisma, type IntegrationType } from "@prisma/client";

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
// Per-integration field schema — what credentials each integration expects.
// -----------------------------------------------------------------------------

export type IntegrationField = {
  /** Key inside the credentials JSON. */
  name: string;
  label: string;
  placeholder?: string;
  /** When true, render as masked password input. */
  secret?: boolean;
  /** When true, render as a textarea (e.g. for service-account JSON). */
  multiline?: boolean;
  /** Env var that overrides the vault entry, if any. */
  envVarName?: string;
  /** Description shown under the field. */
  hint?: string;
};

/**
 * Default display names for each integration type — used by the admin page to
 * auto-create placeholder rows when the DB has no rows of that type yet. May
 * be a single string or an array when one integration type spans multiple
 * storefronts / properties (each gets its own credential set).
 */
export const INTEGRATION_DEFAULT_NAMES: Partial<Record<IntegrationType, string | string[]>> = {
  anthropic: "Anthropic Claude API",
  openai: "OpenAI API",
  bigcommerce: [
    "BigCommerce — LifeSupply.ca",
    "BigCommerce — WellmartMedical.com",
    "BigCommerce — Balkowitsch Worldwide",
  ],
  mailchimp: "Mailchimp",
  ga4: ["GA4 — LifeSupply.ca", "GA4 — WellmartMedical.com"],
  quickbooks: "QuickBooks Online",
  supplier_portal: "BBM01 — Best Buy Medical Portal",
};

export const INTEGRATION_FIELDS: Partial<Record<IntegrationType, IntegrationField[]>> = {
  anthropic: [
    {
      name: "apiKey",
      label: "API key",
      placeholder: "sk-ant-...",
      secret: true,
      envVarName: "ANTHROPIC_API_KEY",
    },
  ],
  openai: [
    {
      name: "apiKey",
      label: "API key",
      placeholder: "sk-...",
      secret: true,
      envVarName: "OPENAI_API_KEY",
    },
  ],
  bigcommerce: [
    {
      name: "storeHash",
      label: "Store hash",
      placeholder: "abcdef1234",
      envVarName: "BIGCOMMERCE_STORE_HASH",
      hint: "From the BigCommerce control panel URL.",
    },
    {
      name: "apiToken",
      label: "API access token",
      secret: true,
      envVarName: "BIGCOMMERCE_API_TOKEN",
    },
    {
      name: "clientId",
      label: "Client ID",
      placeholder: "Optional",
      envVarName: "BIGCOMMERCE_CLIENT_ID",
    },
  ],
  mailchimp: [
    {
      name: "apiKey",
      label: "API key",
      placeholder: "abc123-us21",
      secret: true,
      envVarName: "MAILCHIMP_API_KEY",
    },
    {
      name: "serverPrefix",
      label: "Server prefix",
      placeholder: "us21",
      envVarName: "MAILCHIMP_SERVER_PREFIX",
      hint: "The data-center suffix on your API key.",
    },
    {
      name: "audienceListId",
      label: "Default audience list ID",
      placeholder: "abc1234567",
      envVarName: "MAILCHIMP_AUDIENCE_LIST_ID",
      hint: "The Mailchimp list ID campaigns are created against.",
    },
    {
      name: "fromName",
      label: "From name",
      placeholder: "LifeSupply",
      envVarName: "MAILCHIMP_FROM_NAME",
    },
    {
      name: "fromEmail",
      label: "From email",
      placeholder: "team@lifesupply.ca",
      envVarName: "MAILCHIMP_FROM_EMAIL",
    },
  ],
  ga4: [
    {
      name: "propertyId",
      label: "Property ID",
      placeholder: "123456789",
      envVarName: "GA4_PROPERTY_ID",
    },
    {
      name: "serviceAccountJson",
      label: "Service account JSON",
      secret: true,
      multiline: true,
      envVarName: "GOOGLE_APPLICATION_CREDENTIALS_JSON",
      hint: "Paste the full JSON key file contents.",
    },
  ],
  quickbooks: [
    { name: "clientId", label: "Client ID", envVarName: "QUICKBOOKS_CLIENT_ID" },
    {
      name: "clientSecret",
      label: "Client secret",
      secret: true,
      envVarName: "QUICKBOOKS_CLIENT_SECRET",
    },
    {
      name: "redirectUri",
      label: "OAuth redirect URI",
      placeholder: "https://…/api/auth/quickbooks/callback",
      envVarName: "QUICKBOOKS_REDIRECT_URI",
    },
    {
      name: "environment",
      label: "Environment",
      placeholder: "sandbox or production",
      envVarName: "QUICKBOOKS_ENVIRONMENT",
    },
  ],
  supplier_portal: [
    { name: "username", label: "Username" },
    { name: "password", label: "Password", secret: true },
    {
      name: "loginUrl",
      label: "Login URL",
      placeholder: "https://…",
      hint: "Optional override.",
    },
  ],
};

// -----------------------------------------------------------------------------
// Internal helpers — read/write the JSON columns
// -----------------------------------------------------------------------------

type CredentialsBundle = Record<string, string>;
type CredentialFieldMeta = {
  lastFour: string;
  setAtMs: number;
  setByUserId: string | null;
};
type CredentialMetaBundle = Record<string, CredentialFieldMeta>;

function readCredentials(value: Prisma.JsonValue | null): CredentialsBundle {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: CredentialsBundle = {};
  for (const [k, v] of Object.entries(value)) if (typeof v === "string") out[k] = v;
  return out;
}

function readCredentialMeta(value: Prisma.JsonValue | null): CredentialMetaBundle {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: CredentialMetaBundle = {};
  for (const [k, v] of Object.entries(value)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      out[k] = {
        lastFour: typeof obj.lastFour === "string" ? obj.lastFour : "????",
        setAtMs: typeof obj.setAtMs === "number" ? obj.setAtMs : 0,
        setByUserId: typeof obj.setByUserId === "string" ? obj.setByUserId : null,
      };
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Settings listing for the admin page
// -----------------------------------------------------------------------------

export type IntegrationFieldStatus = {
  name: string;
  label: string;
  placeholder?: string;
  secret: boolean;
  multiline: boolean;
  hint?: string;
  envVarName: string | null;
  envVarPresent: boolean;
  vaultLastFour: string | null;
  vaultSetAt: string | null;
  vaultSetByName: string | null;
  effectiveSource: "env" | "vault" | "none";
};

export type IntegrationSettingsRow = {
  id: string;
  integrationType: IntegrationType;
  name: string;
  status: string;
  notes: string | null;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  fields: IntegrationFieldStatus[];
  /** True iff every defined field has a source. */
  fullyConfigured: boolean;
};

export async function listIntegrationSettings(): Promise<IntegrationSettingsRow[]> {
  // Self-heal: ensure every default-named row exists for every integration
  // type with defined fields, so a fresh / unseeded production DB still
  // renders the expected cards instead of an empty page. Idempotent — safe
  // to run on every page load.
  for (const type of Object.keys(INTEGRATION_FIELDS) as IntegrationType[]) {
    const defaults = INTEGRATION_DEFAULT_NAMES[type] ?? String(type);
    const names = Array.isArray(defaults) ? defaults : [defaults];
    for (const name of names) {
      await prisma.integrationConnection.upsert({
        where: { integrationType_name: { integrationType: type, name } },
        create: { integrationType: type, name, status: "not_configured" },
        update: {},
      });
    }
  }

  // Clean up earlier-created bare placeholders (e.g. a row literally named
  // "BigCommerce" from before we split it into per-storefront rows). Only
  // delete unconfigured placeholders with no credentials or sync history.
  const orphanCandidates = ["BigCommerce", "Google Analytics 4"];
  await prisma.integrationConnection.deleteMany({
    where: {
      name: { in: orphanCandidates },
      status: "not_configured",
      credentials: { equals: Prisma.DbNull },
      lastSyncAt: null,
      syncLogs: { none: {} },
    },
  });

  const records = await prisma.integrationConnection.findMany({
    orderBy: [{ integrationType: "asc" }, { name: "asc" }],
  });

  // Resolve setBy user names in one query
  const allUserIds = new Set<string>();
  for (const r of records) {
    const meta = readCredentialMeta(r.credentialMeta);
    for (const m of Object.values(meta)) {
      if (m.setByUserId) allUserIds.add(m.setByUserId);
    }
  }
  const users =
    allUserIds.size === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: Array.from(allUserIds) } },
          select: { id: true, name: true, email: true },
        });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return records.map((r) => {
    const credentials = readCredentials(r.credentials);
    const meta = readCredentialMeta(r.credentialMeta);
    const fieldDefs = INTEGRATION_FIELDS[r.integrationType] ?? [];

    const fields: IntegrationFieldStatus[] = fieldDefs.map((def) => {
      const envVarPresent = !!(def.envVarName && process.env[def.envVarName]);
      const vaultEntry = credentials[def.name];
      const fieldMeta = meta[def.name];
      const effectiveSource: "env" | "vault" | "none" = envVarPresent
        ? "env"
        : vaultEntry
          ? "vault"
          : "none";
      const setBy = fieldMeta?.setByUserId ? userMap.get(fieldMeta.setByUserId) : undefined;
      return {
        name: def.name,
        label: def.label,
        placeholder: def.placeholder,
        secret: def.secret ?? false,
        multiline: def.multiline ?? false,
        hint: def.hint,
        envVarName: def.envVarName ?? null,
        envVarPresent,
        vaultLastFour: vaultEntry ? (fieldMeta?.lastFour ?? "????") : null,
        vaultSetAt: fieldMeta?.setAtMs ? new Date(fieldMeta.setAtMs).toISOString() : null,
        vaultSetByName: setBy?.name ?? setBy?.email ?? null,
        effectiveSource,
      };
    });

    const fullyConfigured =
      fieldDefs.length > 0 && fields.every((f) => f.effectiveSource !== "none");

    return {
      id: r.id,
      integrationType: r.integrationType,
      name: r.name,
      status: r.status,
      notes: r.notes,
      lastSyncAt: r.lastSyncAt?.toISOString() ?? null,
      lastSuccessfulSyncAt: r.lastSuccessfulSyncAt?.toISOString() ?? null,
      fields,
      fullyConfigured,
    };
  });
}

// -----------------------------------------------------------------------------
// Resolution — env first, then vault
// -----------------------------------------------------------------------------

export async function resolveCredential(
  integrationType: IntegrationType,
  fieldName: string,
): Promise<string | null> {
  const fieldDef = INTEGRATION_FIELDS[integrationType]?.find((f) => f.name === fieldName);
  if (fieldDef?.envVarName) {
    const fromEnv = process.env[fieldDef.envVarName];
    if (fromEnv) return fromEnv;
  }

  if (!vaultEnabled()) return null;

  const record = await prisma.integrationConnection.findFirst({
    where: { integrationType },
    orderBy: { updatedAt: "desc" },
  });
  if (!record) return null;
  const credentials = readCredentials(record.credentials);
  const encrypted = credentials[fieldName];
  if (!encrypted) return null;

  try {
    return decryptSecret(encrypted);
  } catch (err) {
    if (err instanceof SecretVaultNotConfiguredError) return null;
    if (err instanceof SecretVaultDecryptError) {
      console.error(
        `[integrations] Failed to decrypt ${integrationType}.${fieldName} on connection ${record.id}:`,
        err.cause,
      );
      return null;
    }
    throw err;
  }
}

export async function resolveCredentialsBundle(
  integrationType: IntegrationType,
): Promise<Record<string, string> | null> {
  const fields = INTEGRATION_FIELDS[integrationType];
  if (!fields || fields.length === 0) return null;
  const out: Record<string, string> = {};
  for (const field of fields) {
    const value = await resolveCredential(integrationType, field.name);
    if (value != null) out[field.name] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Resolve every credential field for a SPECIFIC integration connection
 * (looked up by ID). Use this for multi-instance integration types where
 * one type has many connections (e.g. BigCommerce ×3, GA4 ×2). Env vars
 * still take precedence over the per-connection vault entry, mirroring
 * the resolveCredential() rule.
 */
export async function resolveCredentialsBundleForConnection(
  connectionId: string,
): Promise<Record<string, string> | null> {
  const record = await prisma.integrationConnection.findUnique({
    where: { id: connectionId },
    select: { integrationType: true, credentials: true },
  });
  if (!record) return null;

  const fields = INTEGRATION_FIELDS[record.integrationType];
  if (!fields || fields.length === 0) return null;

  const credentials = readCredentials(record.credentials);
  const out: Record<string, string> = {};

  for (const field of fields) {
    if (field.envVarName) {
      const fromEnv = process.env[field.envVarName];
      if (fromEnv) {
        out[field.name] = fromEnv;
        continue;
      }
    }
    const encrypted = credentials[field.name];
    if (!encrypted || !vaultEnabled()) continue;
    try {
      out[field.name] = decryptSecret(encrypted);
    } catch (err) {
      if (err instanceof SecretVaultDecryptError) {
        console.error(
          `[integrations] Failed to decrypt ${record.integrationType}.${field.name} on connection ${connectionId}:`,
          err.cause,
        );
        continue;
      }
      if (err instanceof SecretVaultNotConfiguredError) continue;
      throw err;
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

// -----------------------------------------------------------------------------
// Mutations — gated by ADMIN_MANAGE_INTEGRATIONS at the action layer
// -----------------------------------------------------------------------------

export async function setIntegrationField(args: {
  integrationId: string;
  fieldName: string;
  plaintext: string;
  actorUserId: string;
}) {
  const trimmed = args.plaintext.trim();
  if (!trimmed) throw new Error("Value cannot be empty.");
  if (!vaultEnabled()) throw new SecretVaultNotConfiguredError();

  const before = await prisma.integrationConnection.findUnique({
    where: { id: args.integrationId },
    select: {
      id: true,
      name: true,
      integrationType: true,
      credentials: true,
      credentialMeta: true,
    },
  });
  if (!before) throw new Error("Integration not found.");

  const fieldDef = INTEGRATION_FIELDS[before.integrationType]?.find(
    (f) => f.name === args.fieldName,
  );
  if (!fieldDef)
    throw new Error(`Unknown field "${args.fieldName}" for ${before.integrationType}.`);

  const credentials = readCredentials(before.credentials);
  const meta = readCredentialMeta(before.credentialMeta);
  const wasSet = !!credentials[args.fieldName];

  credentials[args.fieldName] = encryptSecret(trimmed);
  meta[args.fieldName] = {
    lastFour: lastFour(trimmed),
    setAtMs: Date.now(),
    setByUserId: args.actorUserId,
  };

  // Mark as configured if every defined field now has a source (env or vault).
  const allFields = INTEGRATION_FIELDS[before.integrationType] ?? [];
  const newlyFullyConfigured = allFields.every((f) => {
    if (f.envVarName && process.env[f.envVarName]) return true;
    return !!credentials[f.name];
  });

  const updated = await prisma.integrationConnection.update({
    where: { id: args.integrationId },
    data: {
      credentials: credentials as Prisma.InputJsonValue,
      credentialMeta: meta as unknown as Prisma.InputJsonValue,
      ...(newlyFullyConfigured ? { status: "configured" } : {}),
    },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: wasSet ? "integration.field_rotated" : "integration.field_set",
    entityType: "IntegrationConnection",
    entityId: updated.id,
    afterData: {
      name: updated.name,
      integrationType: updated.integrationType,
      fieldName: args.fieldName,
      lastFour: lastFour(trimmed),
    },
  });
  return updated;
}

export async function clearIntegrationField(args: {
  integrationId: string;
  fieldName: string;
  actorUserId: string;
}) {
  const before = await prisma.integrationConnection.findUnique({
    where: { id: args.integrationId },
    select: {
      id: true,
      name: true,
      integrationType: true,
      credentials: true,
      credentialMeta: true,
    },
  });
  if (!before) throw new Error("Integration not found.");

  const credentials = readCredentials(before.credentials);
  const meta = readCredentialMeta(before.credentialMeta);
  if (!credentials[args.fieldName]) return before;

  delete credentials[args.fieldName];
  delete meta[args.fieldName];

  const stillConfigured =
    Object.keys(credentials).length > 0 ||
    (INTEGRATION_FIELDS[before.integrationType] ?? []).some(
      (f) => f.envVarName && !!process.env[f.envVarName],
    );

  const updated = await prisma.integrationConnection.update({
    where: { id: args.integrationId },
    data: {
      credentials:
        Object.keys(credentials).length === 0
          ? Prisma.JsonNull
          : (credentials as Prisma.InputJsonValue),
      credentialMeta:
        Object.keys(meta).length === 0
          ? Prisma.JsonNull
          : (meta as unknown as Prisma.InputJsonValue),
      ...(stillConfigured ? {} : { status: "not_configured" }),
    },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "integration.field_cleared",
    entityType: "IntegrationConnection",
    entityId: updated.id,
    afterData: {
      name: updated.name,
      integrationType: updated.integrationType,
      fieldName: args.fieldName,
    },
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
