/**
 * QuickBooks Online OAuth2 + read-only report client (Phase 6 — docs/19).
 *
 * READ-ONLY: only the reports API is called. No accounting records are ever
 * created or altered (CLAUDE.md §8 financial-data rules).
 *
 * OAuth tokens are machine-managed — stored AES-encrypted in the QuickBooks
 * IntegrationConnection's credentials JSON (accessToken / refreshToken /
 * realmId), with expiry timestamps in config. They are deliberately NOT part
 * of INTEGRATION_FIELDS: admins configure clientId/clientSecret/redirectUri;
 * the Connect flow manages the rest.
 */
import { type Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { decryptSecret, encryptSecret } from "@/server/security/secrets";
import { resolveCredential } from "@/server/services/integrations";

const AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const API_BASE: Record<string, string> = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com",
  production: "https://quickbooks.api.intuit.com",
};
/** Refresh when less than this many ms of access-token life remain. */
const REFRESH_SKEW_MS = 2 * 60 * 1000;

export class QboNotConnectedError extends Error {
  constructor(message = "QuickBooks is not connected. Use the Connect button first.") {
    super(message);
    this.name = "QboNotConnectedError";
  }
}

export type QboAppConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: "sandbox" | "production";
};

export async function getQboAppConfig(): Promise<QboAppConfig | null> {
  const [clientId, clientSecret, redirectUri, environment] = await Promise.all([
    resolveCredential("quickbooks", "clientId"),
    resolveCredential("quickbooks", "clientSecret"),
    resolveCredential("quickbooks", "redirectUri"),
    resolveCredential("quickbooks", "environment"),
  ]);
  if (!clientId || !clientSecret || !redirectUri) return null;
  return {
    clientId,
    clientSecret,
    redirectUri,
    environment: environment === "production" ? "production" : "sandbox",
  };
}

/** Build the Intuit authorize URL (pure given config + state). */
export function buildAuthorizeUrl(config: QboAppConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: config.redirectUri,
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

async function findQboConnection() {
  return prisma.integrationConnection.findFirst({
    where: { integrationType: "quickbooks" },
    orderBy: { updatedAt: "desc" },
  });
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  x_refresh_token_expires_in?: number;
};

async function tokenRequest(config: QboAppConfig, body: URLSearchParams): Promise<TokenResponse> {
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Intuit token endpoint HTTP ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text) as TokenResponse;
}

async function storeTokens(args: {
  connectionId: string;
  tokens: TokenResponse;
  realmId?: string;
}): Promise<void> {
  const conn = await prisma.integrationConnection.findUniqueOrThrow({
    where: { id: args.connectionId },
    select: { credentials: true, config: true },
  });
  const credentials = ((conn.credentials as Record<string, string>) ?? {}) as Record<
    string,
    string
  >;
  const config = ((conn.config as Record<string, unknown>) ?? {}) as Record<string, unknown>;

  credentials.qboAccessToken = encryptSecret(args.tokens.access_token);
  credentials.qboRefreshToken = encryptSecret(args.tokens.refresh_token);
  if (args.realmId) credentials.qboRealmId = encryptSecret(args.realmId);
  config.qboAccessTokenExpiresAt = new Date(
    Date.now() + args.tokens.expires_in * 1000,
  ).toISOString();
  config.qboConnectedAt = config.qboConnectedAt ?? new Date().toISOString();

  await prisma.integrationConnection.update({
    where: { id: args.connectionId },
    data: {
      credentials: credentials as Prisma.InputJsonValue,
      config: config as Prisma.InputJsonValue,
      status: "configured",
    },
  });
}

/** Exchange the OAuth authorization code (callback step). */
export async function exchangeAuthCode(args: {
  code: string;
  realmId: string;
}): Promise<{ connectionId: string }> {
  const config = await getQboAppConfig();
  if (!config) throw new QboNotConnectedError("QuickBooks app credentials are not configured.");
  const conn = await findQboConnection();
  if (!conn) throw new QboNotConnectedError("No QuickBooks integration connection row exists.");

  const tokens = await tokenRequest(
    config,
    new URLSearchParams({
      grant_type: "authorization_code",
      code: args.code,
      redirect_uri: config.redirectUri,
    }),
  );
  await storeTokens({ connectionId: conn.id, tokens, realmId: args.realmId });
  return { connectionId: conn.id };
}

export type QboSession = {
  accessToken: string;
  realmId: string;
  apiBase: string;
  connectionId: string;
};

/** Resolve a live access token, refreshing (and rotating) when near expiry. */
export async function getQboSession(): Promise<QboSession> {
  const config = await getQboAppConfig();
  if (!config) throw new QboNotConnectedError("QuickBooks app credentials are not configured.");
  const conn = await findQboConnection();
  if (!conn) throw new QboNotConnectedError();

  const credentials = (conn.credentials as Record<string, string>) ?? {};
  const connConfig = (conn.config as Record<string, unknown>) ?? {};
  if (!credentials.qboAccessToken || !credentials.qboRefreshToken || !credentials.qboRealmId) {
    throw new QboNotConnectedError();
  }

  const realmId = decryptSecret(credentials.qboRealmId);
  const expiresAt = Date.parse(String(connConfig.qboAccessTokenExpiresAt ?? "")) || 0;

  if (expiresAt - Date.now() > REFRESH_SKEW_MS) {
    return {
      accessToken: decryptSecret(credentials.qboAccessToken),
      realmId,
      apiBase: API_BASE[config.environment]!,
      connectionId: conn.id,
    };
  }

  // Refresh grant — Intuit rotates the refresh token; always store the new pair.
  const tokens = await tokenRequest(
    config,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: decryptSecret(credentials.qboRefreshToken),
    }),
  );
  await storeTokens({ connectionId: conn.id, tokens });
  return {
    accessToken: tokens.access_token,
    realmId,
    apiBase: API_BASE[config.environment]!,
    connectionId: conn.id,
  };
}

/** True when the Connect flow has completed and tokens are stored. */
export async function isQboConnected(): Promise<boolean> {
  const conn = await findQboConnection();
  const credentials = (conn?.credentials as Record<string, string>) ?? {};
  return !!(credentials.qboAccessToken && credentials.qboRefreshToken && credentials.qboRealmId);
}

/** Fetch one report from the QBO reports API (read-only). */
export async function fetchQboReport(
  session: QboSession,
  reportName: string,
  params: Record<string, string>,
): Promise<unknown> {
  const qs = new URLSearchParams({ ...params, minorversion: "73" });
  const url = `${session.apiBase}/v3/company/${encodeURIComponent(session.realmId)}/reports/${reportName}?${qs}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`QBO ${reportName} HTTP ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text) as unknown;
}
