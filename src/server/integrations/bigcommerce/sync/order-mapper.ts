/**
 * Maps a BigCommerce /v2/orders payload into Prisma Order upsert payloads.
 *
 * Conflict policy (mirrors customer-mapper):
 *
 *   BC-OWNED (overwritten on every sync):
 *     orderNumber, status, paymentStatus, fulfillmentStatus, orderDate,
 *     subtotal, discountTotal, shippingTotal, taxTotal, grandTotal,
 *     currency, customerId (linked from synced Customer rows by BC id)
 *
 *   CC-OWNED (set on create only; NEVER touched by sync):
 *     estimatedGrossProfit, estimatedGrossMargin, supplierStatus,
 *     automationStatus, exceptionStatus, exceptionReason
 *
 *   METADATA escape hatch:
 *     metadata.bcRaw — the raw /v2/orders payload (for debugging without re-fetch)
 *     metadata.bcSyncedAt — ISO timestamp of this sync
 *
 * Status mapping: BC has a single status_id (0–14). We project it into
 * Prisma's separate OrderStatus + PaymentStatus + FulfillmentStatus enums
 * via STATUS_MAP below. Unknown status_ids fall back to received/pending/
 * unfulfilled. payment_status STRING (when present) overrides the
 * derived PaymentStatus.
 */
import {
  type Prisma,
  type OrderStatus,
  type PaymentStatus,
  type FulfillmentStatus,
} from "@prisma/client";

export type BcOrderPayload = {
  id: number;
  customer_id: number;
  status_id?: number;
  status?: string;
  payment_status?: string;
  date_created?: string;
  date_modified?: string;
  subtotal_inc_tax?: string | number;
  subtotal_ex_tax?: string | number;
  discount_amount?: string | number;
  shipping_cost_inc_tax?: string | number;
  total_tax?: string | number;
  total_inc_tax?: string | number;
  currency_code?: string;
};

export type OrderUpsertPayloads = {
  create: Prisma.OrderUncheckedCreateInput;
  update: Prisma.OrderUncheckedUpdateInput;
};

export const SOURCE_SYSTEM = "bigcommerce";

type StatusTriple = {
  order: OrderStatus;
  payment: PaymentStatus;
  fulfillment: FulfillmentStatus;
};

/** BC status_id (0–14) → Prisma status triple. */
const STATUS_MAP: Record<number, StatusTriple> = {
  0: { order: "received", payment: "pending", fulfillment: "unfulfilled" }, // Incomplete
  1: { order: "received", payment: "pending", fulfillment: "unfulfilled" }, // Pending
  2: { order: "shipped", payment: "paid", fulfillment: "fulfilled" }, // Shipped
  3: { order: "processing", payment: "paid", fulfillment: "partially_fulfilled" }, // Partially Shipped
  4: { order: "refunded", payment: "refunded", fulfillment: "returned" }, // Refunded
  5: { order: "cancelled", payment: "failed", fulfillment: "unfulfilled" }, // Cancelled
  6: { order: "cancelled", payment: "failed", fulfillment: "unfulfilled" }, // Declined
  7: { order: "received", payment: "pending", fulfillment: "unfulfilled" }, // Awaiting Payment
  8: { order: "processing", payment: "paid", fulfillment: "fulfilled" }, // Awaiting Pickup
  9: { order: "processing", payment: "paid", fulfillment: "unfulfilled" }, // Awaiting Shipment
  10: { order: "completed", payment: "paid", fulfillment: "fulfilled" }, // Completed
  11: { order: "processing", payment: "paid", fulfillment: "unfulfilled" }, // Awaiting Fulfillment
  12: { order: "awaiting_human_review", payment: "pending", fulfillment: "unfulfilled" }, // Manual Verification Required
  13: { order: "awaiting_human_review", payment: "failed", fulfillment: "unfulfilled" }, // Disputed
  14: { order: "processing", payment: "partially_refunded", fulfillment: "fulfilled" }, // Partially Refunded
};

const FALLBACK_TRIPLE: StatusTriple = {
  order: "received",
  payment: "pending",
  fulfillment: "unfulfilled",
};

/**
 * BC's `payment_status` STRING (lowercase) → Prisma PaymentStatus override.
 * Only used when the field is present and non-empty; otherwise we fall back
 * to the status_id-derived value.
 */
const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  authorized: "paid",
  captured: "paid",
  paid: "paid",
  "capture pending": "pending",
  "held for review": "pending",
  pending: "pending",
  unpaid: "pending",
  declined: "failed",
  void: "failed",
  voided: "failed",
  refunded: "refunded",
  "partially refunded": "partially_refunded",
};

function deriveStatus(bc: BcOrderPayload): StatusTriple {
  const fromStatusId = bc.status_id != null ? STATUS_MAP[bc.status_id] : undefined;
  const triple: StatusTriple = fromStatusId ?? FALLBACK_TRIPLE;

  const ps = bc.payment_status?.toLowerCase().trim();
  const overridePayment = ps ? PAYMENT_STATUS_MAP[ps] : undefined;
  if (overridePayment) {
    return { ...triple, payment: overridePayment };
  }
  return triple;
}

function decimal(v: string | number | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseBcDate(s: string | undefined): Date | null {
  if (!s) return null;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export function mapBcOrderToUpsert(
  bc: BcOrderPayload,
  args: {
    storeId: string;
    divisionId: string | null;
    customerId: string | null; // Prisma Customer.id, looked up by caller via BC customer_id
  },
): OrderUpsertPayloads {
  const { order, payment, fulfillment } = deriveStatus(bc);
  const orderDate = parseBcDate(bc.date_created) ?? new Date();

  // ---- BC-owned (overwrite on every sync) ----
  const bcOwned = {
    customerId: args.customerId,
    orderNumber: String(bc.id),
    status: order,
    paymentStatus: payment,
    fulfillmentStatus: fulfillment,
    orderDate,
    subtotal: decimal(bc.subtotal_inc_tax ?? bc.subtotal_ex_tax),
    discountTotal: decimal(bc.discount_amount),
    shippingTotal: decimal(bc.shipping_cost_inc_tax),
    taxTotal: decimal(bc.total_tax),
    grandTotal: decimal(bc.total_inc_tax),
    currency: bc.currency_code?.trim() || "CAD",
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
      // CC-owned defaults are the schema defaults — supplierStatus =
      // not_required, automationStatus = none, exceptionStatus = none
      ...bcOwned,
      metadata,
    },
    update: {
      // CC-owned fields intentionally OMITTED — Prisma preserves them.
      ...bcOwned,
      metadata,
    },
  };
}
