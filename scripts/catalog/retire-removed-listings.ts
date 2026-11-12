/**
 * Retire the catalogue products whose listing the store has deleted, as a
 * one-off, for the products a Product Studio publish was already refused for.
 *
 * WHY THIS EXISTS. Until November 11, 2026 the catalogue sync never learned of
 * a deletion, so seventeen Product Studio projects reached the publish step
 * with BigCommerce ids the store answered 404 to, and were retried on every
 * unattended run. The publish service now retires such a product itself, and
 * a full catalogue walk retires every listing it no longer finds; this script
 * is the owner's way to clear the backlog at once rather than waiting for the
 * next publish attempt or walking 35,000 products.
 *
 * WHAT IT DOES. It takes the product ids from the audit log's publish
 * refusals (`product_studio.publish_refused` with a "was not found" message,
 * or `listing_removed`), keeps the ones still live here, and asks the store
 * about each one again through the same read the publish service uses. Only
 * a product the store answers 404 to right now is retired, through the one
 * retirement module (`retireProductsRemovedFromStore`), audited as
 * `product.retired_from_store` with `noticedBy: "listing_check_404"`. A
 * product the store still lists is left alone and reported; so is one the
 * store could not be asked about.
 *
 * The actor is a named, active user who holds the publish permission, so the
 * audit rows read as that person's check.
 *
 * SAFETY. Dry run is the default: it reads the store and prints what it would
 * do. Nothing is written without `--apply`, and in a production environment
 * (NODE_ENV=production, RENDER set, or DEPLOY_ENV=production) `--apply`
 * additionally requires `--i-understand-this-writes-to-production`.
 *
 *   pnpm catalog:retire-removed --actor-email owner@example.com
 *   pnpm catalog:retire-removed --actor-email owner@example.com --apply \
 *       --i-understand-this-writes-to-production
 *   pnpm catalog:retire-removed --actor-email … --product-id <id> --product-id <id>
 *       # only these catalogue product ids, still re-read from the store first
 */

import { PERMISSIONS } from "../../src/lib/permissions";
import { prisma } from "../../src/server/db/client";
import { readBigCommerceProductContent } from "../../src/server/integrations/bigcommerce/catalog-publish";
import { resolveStoreCredentials } from "../../src/server/integrations/bigcommerce/store-credentials";
import { retireProductsRemovedFromStore } from "../../src/server/services/products/store-removal";

export const PRODUCTION_ACK = "--i-understand-this-writes-to-production";

/** How far back the audit log is read for refusals. */
export const LOOKBACK_DAYS = 90;

export type Options = {
  actorEmail: string | null;
  /** Restrict to these catalogue product ids; empty = every refused product. */
  productIds: string[];
  apply: boolean;
  acknowledged: boolean;
};

/** Pure: the command line to options. Unknown arguments are an error. */
export function parseArgs(argv: string[]): Options | { error: string } {
  const options: Options = { actorEmail: null, productIds: [], apply: false, acknowledged: false };
  const valueOf = (index: number, name: string): string | { error: string } => {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) return { error: `${name} needs a value.` };
    return value;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--apply":
        options.apply = true;
        break;
      case PRODUCTION_ACK:
        options.acknowledged = true;
        break;
      case "--actor-email":
      case "--product-id": {
        const value = valueOf(i, arg);
        if (typeof value !== "string") return value;
        if (arg === "--actor-email") options.actorEmail = value;
        else options.productIds.push(value);
        i += 1;
        break;
      }
      default:
        return { error: `Unknown argument: ${arg}` };
    }
  }
  if (!options.actorEmail)
    return { error: "--actor-email is required: the audit rows name the actor." };
  return options;
}

/** Pure: whether this process is running against production. */
export function isProductionEnvironment(env: Record<string, string | undefined>): boolean {
  return (
    (env.NODE_ENV ?? "").toLowerCase() === "production" ||
    (env.DEPLOY_ENV ?? "").toLowerCase() === "production" ||
    Boolean(env.RENDER)
  );
}

/**
 * Pure: the product ids named by publish refusals that said the listing was
 * not found. The audit row's afterData carries `productId` (the catalogue
 * product), `refusedBecause` and the store's message.
 */
export function refusedProductIds(rows: readonly { afterData: unknown }[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    const data = row.afterData;
    if (!data || typeof data !== "object" || Array.isArray(data)) continue;
    const { productId, refusedBecause, message } = data as Record<string, unknown>;
    if (typeof productId !== "string" || !productId) continue;
    const gone =
      refusedBecause === "listing_removed" ||
      (refusedBecause === "pre_write_read_failed" &&
        typeof message === "string" &&
        /was not found/i.test(message));
    if (gone) ids.add(productId);
  }
  return [...ids];
}

async function resolveActor(email: string): Promise<{ id: string; name: string | null }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      status: true,
      userRoles: {
        select: {
          role: {
            select: { rolePermissions: { select: { permission: { select: { key: true } } } } },
          },
        },
      },
    },
  });
  if (!user) throw new Error(`No user with email ${email}.`);
  if (user.status !== "active") throw new Error(`User ${email} is ${user.status}, not active.`);
  const holds = user.userRoles.some((ur) =>
    ur.role.rolePermissions.some(
      (rp) => rp.permission.key === PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE,
    ),
  );
  if (!holds) {
    throw new Error(
      `User ${email} does not hold ${PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE}, which publishing requires.`,
    );
  }
  return { id: user.id, name: user.name };
}

type Candidate = {
  id: string;
  name: string;
  sku: string | null;
  sourceId: string | null;
  storeId: string | null;
  store: { name: string } | null;
};

type Verdict = "gone" | "listed" | "unknown";

async function askTheStore(
  candidates: Candidate[],
): Promise<Map<string, { verdict: Verdict; detail: string }>> {
  const out = new Map<string, { verdict: Verdict; detail: string }>();
  const byStore = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    if (!candidate.storeId || !candidate.sourceId) {
      out.set(candidate.id, { verdict: "unknown", detail: "no store or BigCommerce id" });
      continue;
    }
    byStore.set(candidate.storeId, [...(byStore.get(candidate.storeId) ?? []), candidate]);
  }
  for (const [storeId, products] of byStore) {
    const credentials = await resolveStoreCredentials(storeId);
    if (!credentials.ok) {
      for (const product of products) {
        out.set(product.id, { verdict: "unknown", detail: credentials.reason });
      }
      continue;
    }
    for (const product of products) {
      const read = await readBigCommerceProductContent({
        credentials: credentials.credentials,
        productId: product.sourceId!,
      });
      if (read.ok) out.set(product.id, { verdict: "listed", detail: read.snapshot.name ?? "" });
      else if (read.status === 404) out.set(product.id, { verdict: "gone", detail: read.message });
      else
        out.set(product.id, {
          verdict: "unknown",
          detail: String(read.status) + " " + read.message,
        });
    }
  }
  return out;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if ("error" in parsed) {
    console.error(parsed.error);
    process.exitCode = 1;
    return;
  }
  const actor = await resolveActor(parsed.actorEmail as string);
  console.log(`Actor: ${actor.name ?? parsed.actorEmail} (${actor.id})`);

  let productIds = parsed.productIds;
  if (productIds.length === 0) {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
    const rows = await prisma.auditLog.findMany({
      where: { action: "product_studio.publish_refused", createdAt: { gte: since } },
      select: { afterData: true },
    });
    productIds = refusedProductIds(rows);
    console.log(
      `${rows.length} publish refusals in the last ${LOOKBACK_DAYS} days name ${productIds.length} products as not found.`,
    );
  }
  const candidates: Candidate[] = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    select: {
      id: true,
      name: true,
      sku: true,
      sourceId: true,
      storeId: true,
      store: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
  console.log(`${candidates.length} of them are still live here; asking the store about each.`);
  if (candidates.length === 0) return;

  const verdicts = await askTheStore(candidates);
  const gone: Candidate[] = [];
  for (const candidate of candidates) {
    const verdict = verdicts.get(candidate.id) ?? { verdict: "unknown" as const, detail: "" };
    console.log(
      `  ${verdict.verdict.padEnd(7)} ${candidate.store?.name ?? "?"} #${candidate.sourceId ?? "?"}  ${candidate.sku ?? ""}  ${candidate.name.slice(0, 60)}` +
        (verdict.verdict === "gone" ? "" : `  (${verdict.detail})`),
    );
    if (verdict.verdict === "gone") gone.push(candidate);
  }
  console.log(`${gone.length} the store no longer lists; the rest are left alone.`);
  if (gone.length === 0) return;

  if (!parsed.apply) {
    console.log("DRY RUN: nothing written. Re-run with --apply to retire them.");
    return;
  }
  if (isProductionEnvironment(process.env) && !parsed.acknowledged) {
    console.error(
      `REFUSED: this is a production environment. Re-run with --apply ${PRODUCTION_ACK} if that is genuinely intended.`,
    );
    process.exitCode = 1;
    return;
  }
  const byStore = new Map<string, Candidate[]>();
  for (const product of gone) {
    byStore.set(product.storeId!, [...(byStore.get(product.storeId!) ?? []), product]);
  }
  let retired = 0;
  for (const [storeId, products] of byStore) {
    const result = await retireProductsRemovedFromStore({
      productIds: products.map((product) => product.id),
      noticedBy: "listing_check_404",
      actorUserId: actor.id,
      evidence: {
        storeId,
        message:
          "The store answered 404 when the product was read again by the retire-removed-listings script.",
      },
    });
    retired += result.retired.length;
  }
  console.log(
    `Applied. Retired ${retired} products; their projects now show under "Removed from store".`,
  );
}

// Only run when executed directly, so the test can import the pure helpers.
if (process.argv[1] && /retire-removed-listings\.ts$/.test(process.argv[1].replace(/\\/g, "/"))) {
  main()
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
