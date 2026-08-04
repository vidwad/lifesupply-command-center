/**
 * Fulfillment timeline (Phase 8). Pure builder — assembles the order's
 * fulfillment story from the timestamps we actually have (order date,
 * synced shipments, refund totals) plus a closing "current status" entry.
 * Events with unknown timing carry `at: null` and render without a date —
 * we never fabricate timestamps.
 */

export type TimelineEvent = {
  at: Date | null;
  kind: "placed" | "shipment" | "refund" | "current";
  label: string;
  detail: string | null;
  trackingUrl: string | null;
};

export type TimelineOrder = {
  orderDate: Date;
  status: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  refundedTotal: number;
  currency: string;
  shipments: {
    shippedAt: Date | null;
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    itemsCount: number;
  }[];
};

export function buildFulfillmentTimeline(order: TimelineOrder): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      at: order.orderDate,
      kind: "placed",
      label: "Order placed",
      detail: null,
      trackingUrl: null,
    },
  ];

  for (const s of order.shipments) {
    const carrier = s.carrier?.trim() || null;
    const tracking = s.trackingNumber?.trim() || null;
    events.push({
      at: s.shippedAt,
      kind: "shipment",
      label:
        s.itemsCount > 0
          ? `Shipped ${s.itemsCount} item${s.itemsCount === 1 ? "" : "s"}`
          : "Shipment recorded",
      detail: [carrier, tracking].filter(Boolean).join(" · ") || null,
      trackingUrl: s.trackingUrl?.trim() || null,
    });
  }

  if (order.refundedTotal > 0) {
    events.push({
      at: null, // BigCommerce order headers don't carry a refund timestamp.
      kind: "refund",
      label: `Refunded ${order.refundedTotal.toFixed(2)} ${order.currency}`,
      detail: order.paymentStatus === "refunded" ? "Fully refunded" : "Partial refund",
      trackingUrl: null,
    });
  }

  events.push({
    at: null,
    kind: "current",
    label: `Current: ${order.status.replace(/_/g, " ")} / ${order.fulfillmentStatus.replace(/_/g, " ")}`,
    detail: null,
    trackingUrl: null,
  });

  // Dated events chronologically, undated ones at the end in insert order.
  const dated = events.filter((e) => e.at != null);
  const undated = events.filter((e) => e.at == null);
  dated.sort((a, b) => a.at!.getTime() - b.at!.getTime());
  return [...dated, ...undated];
}
