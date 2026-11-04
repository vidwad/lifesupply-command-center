/**
 * The assistant's read-only window onto the BigCommerce storefronts
 * (owner, 2026-11-04: "all the BigCommerce storefronts that it has API
 * access to"). GET only, an allowlist of paths, a page cap, a byte cap and
 * a timeout. Credentials come from the store's linked integration
 * connection exactly as the syncs resolve them; nothing here can write.
 */
import {
  BC_BASE,
  resolveStoreCredentials,
} from "@/server/integrations/bigcommerce/store-credentials";

/** Paths the assistant may read. Anchored; an id is digits only. */
export const BC_READ_PATHS: readonly RegExp[] = [
  /^\/v2\/store$/,
  /^\/v2\/orders$/,
  /^\/v2\/orders\/count$/,
  /^\/v2\/orders\/\d+$/,
  /^\/v2\/orders\/\d+\/products$/,
  /^\/v2\/orders\/\d+\/shipments$/,
  /^\/v3\/catalog\/summary$/,
  /^\/v3\/catalog\/products$/,
  /^\/v3\/catalog\/products\/\d+$/,
  /^\/v3\/catalog\/products\/\d+\/variants$/,
  /^\/v3\/catalog\/products\/\d+\/images$/,
  /^\/v3\/catalog\/categories$/,
  /^\/v3\/catalog\/brands$/,
  /^\/v3\/customers$/,
  /^\/v3\/customers\/addresses$/,
  /^\/v3\/inventory\/items$/,
  /^\/v3\/promotions$/,
  /^\/v3\/pricelists$/,
];

export const BC_MAX_LIMIT = 50;
export const BC_MAX_BODY_CHARS = 40_000;

export type BcReadResult =
  | { ok: true; status: number; url: string; body: unknown; truncated: boolean }
  | { ok: false; reason: string };

export function isAllowedBcPath(path: string): boolean {
  return BC_READ_PATHS.some((pattern) => pattern.test(path));
}

/** Pure: the query string the request will carry, with the page size capped. */
export function buildBcQuery(query: Record<string, unknown> | undefined): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value == null || value === "") continue;
    if (!/^[a-zA-Z0-9_:.\[\]]+$/.test(key)) continue;
    params.set(key, String(value));
  }
  const limit = Number(params.get("limit"));
  if (!Number.isFinite(limit) || limit <= 0 || limit > BC_MAX_LIMIT) {
    params.set("limit", String(BC_MAX_LIMIT));
  }
  return params.toString();
}

export async function readBigCommerce(args: {
  storeId: string;
  path: string;
  query?: Record<string, unknown>;
}): Promise<BcReadResult> {
  const path = args.path.trim();
  if (!isAllowedBcPath(path)) {
    return { ok: false, reason: `The path "${path}" is not one the assistant may read.` };
  }
  const outcome = await resolveStoreCredentials(args.storeId);
  if (!outcome.ok) return { ok: false, reason: outcome.reason };
  const { storeHash, apiToken } = outcome.credentials;
  const url = `${BC_BASE}/stores/${storeHash}${path}?${buildBcQuery(args.query)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-Auth-Token": apiToken, Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await response.text();
    const truncated = text.length > BC_MAX_BODY_CHARS;
    const slice = truncated ? text.slice(0, BC_MAX_BODY_CHARS) : text;
    let body: unknown = slice;
    if (!truncated) {
      try {
        body = JSON.parse(slice);
      } catch {
        body = slice;
      }
    }
    return {
      ok: true,
      status: response.status,
      url: url.replace(storeHash, "<store>"),
      body,
      truncated,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "The store did not answer.",
    };
  } finally {
    clearTimeout(timer);
  }
}
