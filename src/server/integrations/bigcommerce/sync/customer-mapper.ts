/**
 * Maps a BigCommerce /v3/customers payload (joined with the order-walk
 * aggregate for that customer) into the Prisma upsert payloads.
 *
 * Conflict policy — single source of truth for "who owns each field":
 *
 *   BC-OWNED (overwritten on every sync):
 *     email, firstName, lastName, companyName, phone
 *
 *   COMPUTED (recomputed on every sync from the order walk):
 *     lifetimeValue, orderCount, firstOrderAt, lastOrderAt
 *
 *   CC-OWNED (set on create only; NEVER touched by sync):
 *     customerType, consentStatus, mailchimpStatus, reactivationScore,
 *     notes, billingAddress, shippingAddress
 *
 *   METADATA escape hatch:
 *     metadata.bcRaw — the raw /v3/customers payload (for debugging the
 *       mapping without re-fetching)
 *     metadata.bcSyncedAt — ISO timestamp of this sync
 *
 * The returned `update` payload deliberately omits the CC-owned fields so
 * Prisma's upsert preserves them when a customer already exists.
 */
import type { Prisma } from "@prisma/client";

export type BcCustomerPayload = {
  id: number;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  phone?: string | null;
  customer_group_id?: number | null;
  tax_exempt_category?: string | null;
  date_created?: string | null;
  date_modified?: string | null;
  registration_ip_address?: string | null;
};

/** Slim per-customer aggregate produced by walking /v2/orders. */
export type SlimOrderAggregate = {
  count: number;
  spend: number;
  /** Earliest order's epoch ms; +Infinity if no orders. */
  firstMs: number;
  /** Latest order's epoch ms; -Infinity if no orders. */
  lastMs: number;
};

export type CustomerUpsertPayloads = {
  create: Prisma.CustomerUncheckedCreateInput;
  update: Prisma.CustomerUncheckedUpdateInput;
};

export const SOURCE_SYSTEM = "bigcommerce";

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

function lowerOrNull(v: string | null | undefined): string | null {
  const t = trimOrNull(v);
  return t == null ? null : t.toLowerCase();
}

function dateFromMs(ms: number): Date | null {
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export function mapBcCustomerToUpsert(
  bc: BcCustomerPayload,
  args: {
    storeId: string;
    divisionId: string | null;
    aggregate: SlimOrderAggregate | undefined;
  },
): CustomerUpsertPayloads {
  // ---- BC-owned (overwrite on every sync) ----
  const bcOwned = {
    email: lowerOrNull(bc.email),
    firstName: trimOrNull(bc.first_name),
    lastName: trimOrNull(bc.last_name),
    companyName: trimOrNull(bc.company),
    phone: trimOrNull(bc.phone),
  };

  // ---- COMPUTED (recomputed on every sync) ----
  const agg = args.aggregate;
  const computed = {
    lifetimeValue: agg?.spend ?? 0,
    orderCount: agg?.count ?? 0,
    firstOrderAt: agg ? dateFromMs(agg.firstMs) : null,
    lastOrderAt: agg ? dateFromMs(agg.lastMs) : null,
  };

  // ---- METADATA ----
  const metadata = {
    bcRaw: bc as unknown as Prisma.InputJsonValue,
    bcSyncedAt: new Date().toISOString(),
  } satisfies Prisma.InputJsonObject;

  return {
    create: {
      sourceSystem: SOURCE_SYSTEM,
      sourceId: String(bc.id),
      storeId: args.storeId,
      divisionId: args.divisionId,
      // CC-owned defaults (set ONLY on create — survive future syncs)
      customerType: "unknown",
      consentStatus: "unknown",
      // BC-owned + computed
      ...bcOwned,
      ...computed,
      metadata,
    },
    update: {
      // CC-owned fields intentionally OMITTED — Prisma preserves them.
      ...bcOwned,
      ...computed,
      metadata,
    },
  };
}
