/**
 * BigCommerce sale-price read/write — the ONLY module that sends a price to a
 * store, and the only outbound HTTP in the DP-6 writeback path.
 *
 * Kept out of services/pricing on purpose. The pricing canaries assert that no
 * file under services/pricing performs outbound HTTP except the DP-3 collector;
 * putting the request here keeps that guarantee intact while giving the
 * writeback service one narrow, auditable door to the outside.
 *
 * Deliberately narrow. It can read a price and set `sale_price`. It cannot set
 * a regular price, cost, inventory, name, description, SKU, or images, and
 * there is no generic "update product" helper here for a later phase to reach
 * for. Widening this file is a deliberate act, not a convenience.
 */
import { prisma } from "@/server/db/client";
import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

const BC_BASE = "https://api.bigcommerce.com";
const REQUEST_TIMEOUT_MS = 20_000;

/** Which BigCommerce record a price belongs to. */
export type BigCommerceTarget =
  | { scope: "variant"; productId: string; variantId: string }
  | { scope: "product"; productId: string };

export type StoreCredentials = { storeHash: string; apiToken: string; connectionId: string };

export type CredentialOutcome =
  | { ok: true; credentials: StoreCredentials }
  | { ok: false; reason: string };

/**
 * Resolves the BigCommerce connection for ONE store.
 *
 * Routing is by the explicit `IntegrationConnection.storeId` link, never by
 * display-name matching and never by a shared default: two stores may have
 * entirely different credentials, and writing store A's price with store B's
 * token is the exact failure this lookup exists to prevent.
 */
export async function resolveStoreCredentials(storeId: string): Promise<CredentialOutcome> {
  const connections = await prisma.integrationConnection.findMany({
    where: { integrationType: "bigcommerce", storeId },
    select: { id: true, name: true, status: true },
  });

  if (connections.length === 0) {
    return {
      ok: false,
      reason:
        "No BigCommerce integration connection is linked to this store. Link one in " +
        "/admin/integrations (IntegrationConnection.storeId) before writing prices.",
    };
  }
  if (connections.length > 1) {
    // Ambiguous routing is refused rather than guessed: picking "the first"
    // would silently choose which storefront gets repriced.
    return {
      ok: false,
      reason:
        "This store has " +
        String(connections.length) +
        " BigCommerce connections linked (" +
        connections.map((c) => c.name).join(", ") +
        "). Exactly one is required so the target storefront is unambiguous.",
    };
  }

  const connection = connections[0];
  if (!connection) {
    return { ok: false, reason: "No BigCommerce connection resolved for this store." };
  }
  const bundle = await resolveCredentialsBundleForConnection(connection.id);
  if (!bundle?.storeHash || !bundle?.apiToken) {
    return {
      ok: false,
      reason:
        'BigCommerce connection "' +
        connection.name +
        '" is missing a storeHash or apiToken. Set both before writing prices.',
    };
  }

  return {
    ok: true,
    credentials: {
      storeHash: bundle.storeHash,
      apiToken: bundle.apiToken,
      connectionId: connection.id,
    },
  };
}

function targetPath(target: BigCommerceTarget): string {
  return target.scope === "variant"
    ? "/v3/catalog/products/" +
        encodeURIComponent(target.productId) +
        "/variants/" +
        encodeURIComponent(target.variantId)
    : "/v3/catalog/products/" + encodeURIComponent(target.productId);
}

function url(credentials: StoreCredentials, target: BigCommerceTarget): string {
  return BC_BASE + "/stores/" + encodeURIComponent(credentials.storeHash) + targetPath(target);
}

/** Price fields captured before a write, kept as rollback evidence. */
export type PriceSnapshot = {
  price: number | null;
  salePrice: number | null;
  retailPrice: number | null;
  sku: string | null;
  name: string | null;
  /** The raw record as returned, so a rollback is not limited to what we parsed. */
  raw: unknown;
};

export type ReadOutcome =
  | { ok: true; snapshot: PriceSnapshot }
  | { ok: false; status: number | "network" | "shape"; message: string };

const numberOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

/**
 * Reads the current price for a target before we overwrite it.
 *
 * A write cannot proceed without this: the old price is the entire rollback
 * story, and a writeback with nothing to restore is a one-way change.
 */
export async function readBigCommercePrice(args: {
  credentials: StoreCredentials;
  target: BigCommerceTarget;
}): Promise<ReadOutcome> {
  let response: Response;
  try {
    response = await fetch(url(args.credentials, args.target), {
      method: "GET",
      headers: {
        "X-Auth-Token": args.credentials.apiToken,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      status: "network",
      message: error instanceof Error ? error.message : "Network error",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: "BigCommerce returned HTTP " + String(response.status) + " reading the price.",
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, status: "shape", message: "BigCommerce returned unreadable JSON." };
  }

  const data = (body as { data?: unknown })?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    // A misparsed response is not a reason to keep going: if we cannot read the
    // current price we cannot prove what we are about to overwrite.
    return {
      ok: false,
      status: "shape",
      message: "BigCommerce response had no product/variant object where one was expected.",
    };
  }

  const record = data as Record<string, unknown>;
  return {
    ok: true,
    snapshot: {
      price: numberOrNull(record.price),
      salePrice: numberOrNull(record.sale_price),
      retailPrice: numberOrNull(record.retail_price),
      sku: stringOrNull(record.sku),
      name: stringOrNull(record.name),
      raw: record,
    },
  };
}

export type WriteOutcome =
  | { ok: true; response: unknown; salePriceAfter: number | null }
  | { ok: false; status: number | "network" | "shape"; message: string; response?: unknown };

/**
 * Sets `sale_price` and nothing else.
 *
 * The request body is built here as a single-key literal rather than spread
 * from a caller-supplied object, so no caller can smuggle another field into a
 * price update.
 */
export async function writeBigCommerceSalePrice(args: {
  credentials: StoreCredentials;
  target: BigCommerceTarget;
  salePrice: number;
}): Promise<WriteOutcome> {
  if (!Number.isFinite(args.salePrice) || args.salePrice <= 0) {
    return { ok: false, status: "shape", message: "Refusing to write a non-positive sale price." };
  }

  const payload = { sale_price: args.salePrice };

  let response: Response;
  try {
    response = await fetch(url(args.credentials, args.target), {
      method: "PUT",
      headers: {
        "X-Auth-Token": args.credentials.apiToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      status: "network",
      message: error instanceof Error ? error.message : "Network error",
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: "BigCommerce returned HTTP " + String(response.status) + " writing the price.",
      response: body,
    };
  }

  const data = (body as { data?: unknown })?.data;
  const salePriceAfter =
    data && typeof data === "object" && !Array.isArray(data)
      ? numberOrNull((data as Record<string, unknown>).sale_price)
      : null;

  return { ok: true, response: body, salePriceAfter };
}

/** The exact request body sent, recorded on the log before the call. */
export function buildSalePriceRequestPayload(args: {
  target: BigCommerceTarget;
  salePrice: number;
}): Record<string, unknown> {
  return {
    method: "PUT",
    path: targetPath(args.target),
    body: { sale_price: args.salePrice },
  };
}
