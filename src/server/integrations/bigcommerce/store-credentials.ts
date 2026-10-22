/**
 * Resolves the BigCommerce API credentials for ONE store.
 *
 * Lifted out of the price client (2026-10-22) so the Product Studio publish
 * client can route to a store the same way without importing the price
 * client, which its canaries reserve for the pricing write and rollback
 * services. The price client re-exports this, so its callers are unchanged.
 *
 * Routing is by the explicit `IntegrationConnection.storeId` link, never by
 * display-name matching and never by a shared default: two stores may have
 * entirely different credentials, and writing store A's content with store
 * B's token is the exact failure this lookup exists to prevent.
 */
import { prisma } from "@/server/db/client";
import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

export const BC_BASE = "https://api.bigcommerce.com";

export type StoreCredentials = { storeHash: string; apiToken: string; connectionId: string };

export type CredentialOutcome =
  | { ok: true; credentials: StoreCredentials }
  | { ok: false; reason: string };

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
        "/admin/integrations (IntegrationConnection.storeId) before writing to it.",
    };
  }
  if (connections.length > 1) {
    // Ambiguous routing is refused rather than guessed: picking "the first"
    // would silently choose which storefront gets written to.
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
        '" is missing a storeHash or apiToken. Set both before writing to it.',
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
