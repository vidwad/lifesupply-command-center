/**
 * Guest customer identity for BigCommerce order sync (Phase 3A — docs/19).
 *
 * BigCommerce guest checkouts have no /v3/customers record: the order carries
 * `customer_id = 0` and the buyer's identity lives in `billing_address`. This
 * module turns those guests into first-class Customer rows so orders link to a
 * real buyer instead of dangling with `customerId = null`.
 *
 * Identity + dedup rules (mirrors the enriched CSV export in
 * customer-stream.ts so the two never disagree):
 *   - Normalize the billing email to trim + lowercase; that is the guest's key.
 *   - A guest whose email matches an already-synced REGISTERED customer is
 *     deduped — the order links to the registered customer, no guest row.
 *   - Otherwise the guest is upserted under sourceSystem "bigcommerce_guest"
 *     with sourceId = normalized email, so re-syncs are idempotent.
 *
 * Aggregates (lifetimeValue / orderCount) are intentionally NOT computed here —
 * Phase 3A covers identity + linking only. Guest spend rollups are a follow-up
 * (natural fit alongside the registered aggregate walk / Phase 3E reconciliation).
 */
import type { Prisma } from "@prisma/client";

/** sourceSystem used for guest-checkout customers (vs "bigcommerce" for registered). */
export const GUEST_SOURCE_SYSTEM = "bigcommerce_guest";

/** Trim + lowercase a billing email; null when empty/missing. */
export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  return s.length === 0 ? null : s;
}

export type GuestIdentity = {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
};

/**
 * How an order's buyer resolves to a Customer, given the maps the sync
 * pre-loads for the store. Pure + exhaustive so it can be unit-tested without
 * a DB.
 */
export type OrderCustomerLink =
  /** BC customer_id matched a synced registered customer. */
  | { kind: "registered"; customerId: string }
  /** Guest email matched a registered customer — dedup, no guest row created. */
  | { kind: "guest-registered-dedup"; customerId: string }
  /** Guest email matched an already-known guest customer. */
  | { kind: "guest-existing"; customerId: string }
  /** Guest email is new — the caller must create the guest customer. */
  | { kind: "guest-create"; email: string }
  /** No customer could be linked. */
  | { kind: "unlinked"; reason: "no-email" | "customer-not-synced" };

export function resolveOrderCustomerLink(args: {
  bcCustomerId: number;
  billingEmail: string | null | undefined;
  /** BC customer_id → Prisma Customer.id (registered customers for the store). */
  registeredByBcId: Map<number, string>;
  /** normalized email → Prisma Customer.id (registered customers for the store). */
  registeredByEmail: Map<string, string>;
  /** normalized email → Prisma Customer.id (already-known guests for the store). */
  guestByEmail: Map<string, string>;
}): OrderCustomerLink {
  if (args.bcCustomerId > 0) {
    const id = args.registeredByBcId.get(args.bcCustomerId);
    if (id) return { kind: "registered", customerId: id };
    // Registered customer exists in BC but hasn't been synced yet. Leave the
    // order unlinked rather than mis-attributing it to a guest by email.
    return { kind: "unlinked", reason: "customer-not-synced" };
  }

  const email = normalizeEmail(args.billingEmail);
  if (!email) return { kind: "unlinked", reason: "no-email" };

  const registered = args.registeredByEmail.get(email);
  if (registered) return { kind: "guest-registered-dedup", customerId: registered };

  const guest = args.guestByEmail.get(email);
  if (guest) return { kind: "guest-existing", customerId: guest };

  return { kind: "guest-create", email };
}

export type GuestCustomerUpsertPayloads = {
  create: Prisma.CustomerUncheckedCreateInput;
  update: Prisma.CustomerUncheckedUpdateInput;
};

/**
 * Build the Prisma upsert payloads for a guest customer. Identity is BC-owned
 * (refreshed from the most-recent order's billing on each sync). CC-owned
 * fields (customerType, consentStatus, notes, …) are set on create only, so an
 * operator's later edits survive re-syncs.
 */
export function buildGuestCustomerUpsert(args: {
  email: string;
  identity: GuestIdentity;
  storeId: string;
  divisionId: string | null;
  /** BC order id this identity came from — kept for traceability. */
  sourceOrderId: number;
}): GuestCustomerUpsertPayloads {
  const bcOwned = {
    email: args.email,
    firstName: args.identity.firstName,
    lastName: args.identity.lastName,
    companyName: args.identity.companyName,
    phone: args.identity.phone,
  };

  const metadata = {
    guest: true,
    source: GUEST_SOURCE_SYSTEM,
    identityFromBcOrderId: args.sourceOrderId,
    bcSyncedAt: new Date().toISOString(),
  } satisfies Prisma.InputJsonObject;

  return {
    create: {
      sourceSystem: GUEST_SOURCE_SYSTEM,
      sourceId: args.email,
      storeId: args.storeId,
      divisionId: args.divisionId,
      // CC-owned defaults (create only — survive future syncs).
      customerType: "unknown",
      consentStatus: "unknown",
      ...bcOwned,
      metadata,
    },
    update: {
      // CC-owned fields intentionally omitted — Prisma preserves them.
      ...bcOwned,
      metadata,
    },
  };
}
