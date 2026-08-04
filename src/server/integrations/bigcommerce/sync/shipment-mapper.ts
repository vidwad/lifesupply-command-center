/**
 * Maps a BigCommerce /v2/orders/{id}/shipments record into Prisma
 * OrderShipment upsert payloads (Phase 3D — docs/19).
 *
 * All fields are BC-owned fulfillment facts (overwritten on every sync).
 * Keyed on (sourceSystem, sourceId = BC shipment id) for idempotent re-sync.
 */
import type { Prisma } from "@prisma/client";

export type BcShipment = {
  id: number;
  order_id?: number | null;
  date_created?: string | null;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  shipping_provider?: string | null;
  tracking_link?: string | null;
  generated_tracking_link?: string | null;
  comments?: string | null;
  items?: { order_product_id?: number | null; quantity?: number | null }[] | null;
};

export type ShipmentUpsertPayloads = {
  create: Prisma.OrderShipmentUncheckedCreateInput;
  update: Prisma.OrderShipmentUncheckedUpdateInput;
};

export const SOURCE_SYSTEM = "bigcommerce";

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

function parseBcDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export function mapBcShipmentToUpsert(
  bc: BcShipment,
  args: { orderId: string },
): ShipmentUpsertPayloads {
  const itemsCount = (bc.items ?? []).reduce((sum, i) => sum + Math.max(i.quantity ?? 0, 0), 0);

  const bcOwned = {
    orderId: args.orderId,
    shippedAt: parseBcDate(bc.date_created),
    // Prefer the tracking carrier code; fall back to the provider label.
    carrier: trimOrNull(bc.tracking_carrier) ?? trimOrNull(bc.shipping_provider),
    trackingNumber: trimOrNull(bc.tracking_number),
    trackingUrl: trimOrNull(bc.generated_tracking_link) ?? trimOrNull(bc.tracking_link),
    itemsCount,
  };

  const metadata = {
    bcRaw: bc as unknown as Prisma.InputJsonValue,
    bcOrderId: bc.order_id ?? null,
    bcSyncedAt: new Date().toISOString(),
  } satisfies Prisma.InputJsonObject;

  return {
    create: {
      sourceSystem: SOURCE_SYSTEM,
      sourceId: String(bc.id),
      ...bcOwned,
      metadata,
    },
    update: { ...bcOwned, metadata },
  };
}
