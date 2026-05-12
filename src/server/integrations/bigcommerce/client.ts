/**
 * Minimal BigCommerce REST client — currently only the auth-check ping. The
 * full sync paths still go through CSV import (src/server/services/imports/
 * bigcommerce.ts); this file exists so the admin "Test connection" flow can
 * verify a credential pair without a real sync.
 */

import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";
import { prisma } from "@/server/db/client";

const BC_BASE = "https://api.bigcommerce.com";

export type BigCommercePingResult =
  | {
      ok: true;
      storeName: string;
      storeId: string;
      domain: string | null;
      currency: string | null;
      plan: string | null;
    }
  | {
      ok: false;
      status: number | "network" | "missing_credential";
      message: string;
    };

/**
 * Resolve credentials for a specific BigCommerce connection (by name) and
 * call /v2/store. Returns a structured result; never throws on bad creds.
 */
export async function pingBigCommerceByConnectionName(
  connectionName: string,
): Promise<BigCommercePingResult> {
  const conn = await prisma.integrationConnection.findFirst({
    where: { integrationType: "bigcommerce", name: connectionName },
    select: { id: true, name: true },
  });
  if (!conn) {
    return { ok: false, status: "missing_credential", message: "Integration not found" };
  }

  const bundle = await resolveCredentialsBundleForConnection(conn.id);
  if (!bundle?.storeHash || !bundle?.apiToken) {
    return {
      ok: false,
      status: "missing_credential",
      message: "Both storeHash and apiToken are required",
    };
  }

  // BigCommerce v2/store is the cheapest auth-check endpoint (single small
  // payload, no list semantics, no rate-limit weight).
  const url = `${BC_BASE}/stores/${encodeURIComponent(bundle.storeHash)}/v2/store`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": bundle.apiToken,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      status: "network",
      message: err instanceof Error ? err.message : "Network error",
    };
  }

  if (!res.ok) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 200);
    } catch {
      // ignore body read failure
    }
    return {
      ok: false,
      status: res.status,
      message: body || `BigCommerce returned ${res.status}`,
    };
  }

  type BcStorePayload = {
    name?: string;
    id?: string | number;
    domain?: string;
    currency?: string;
    plan_name?: string;
  };

  const data = (await res.json().catch(() => ({}))) as BcStorePayload;
  return {
    ok: true,
    storeName: data.name ?? "(unnamed)",
    storeId: String(data.id ?? bundle.storeHash),
    domain: data.domain ?? null,
    currency: data.currency ?? null,
    plan: data.plan_name ?? null,
  };
}
