/**
 * GA4 Data API client (Phase 6 — docs/19). Read-only.
 *
 * Authenticates with a Google service-account key (JSON pasted into the
 * per-connection vault) via a hand-rolled RS256 JWT → OAuth token exchange —
 * no googleapis dependency needed for one endpoint.
 */
import { createSign } from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

export type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

export function parseServiceAccountJson(raw: string): ServiceAccountKey {
  const parsed = JSON.parse(raw) as Partial<ServiceAccountKey>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Service account JSON must contain client_email and private_key.");
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key };
}

const b64url = (input: string | Buffer): string =>
  Buffer.from(input).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");

/** Build + sign the service-account JWT (RS256). */
export function buildServiceAccountJwt(key: ServiceAccountKey, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat,
      exp: iat + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(key.private_key));
  return `${header}.${claims}.${signature}`;
}

export async function getGa4AccessToken(key: ServiceAccountKey): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildServiceAccountJwt(key),
    }).toString(),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google token endpoint HTTP ${res.status}: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(text) as { access_token?: string };
  if (!parsed.access_token) throw new Error("Google token endpoint returned no access_token.");
  return parsed.access_token;
}

export type Ga4RunReportRequest = {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions: { name: string }[];
  metrics: { name: string }[];
  limit?: string;
  orderBys?: unknown[];
};

export type Ga4RunReportResponse = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
  rowCount?: number;
};

export async function runGa4Report(
  accessToken: string,
  propertyId: string,
  request: Ga4RunReportRequest,
): Promise<Ga4RunReportResponse> {
  const property = propertyId.startsWith("properties/") ? propertyId : `properties/${propertyId}`;
  const res = await fetch(`${DATA_API}/${property}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GA4 runReport HTTP ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text) as Ga4RunReportResponse;
}
