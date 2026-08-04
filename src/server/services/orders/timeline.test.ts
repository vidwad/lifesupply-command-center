import { describe, expect, it } from "vitest";

import { buildFulfillmentTimeline } from "./timeline";

const base = {
  orderDate: new Date("2026-07-01T10:00:00Z"),
  status: "shipped",
  fulfillmentStatus: "fulfilled",
  paymentStatus: "paid",
  refundedTotal: 0,
  currency: "CAD",
  shipments: [],
};

describe("buildFulfillmentTimeline", () => {
  it("always starts with order placed and ends with current status", () => {
    const events = buildFulfillmentTimeline(base);
    expect(events[0]).toMatchObject({ kind: "placed", at: base.orderDate });
    expect(events[events.length - 1]).toMatchObject({
      kind: "current",
      label: "Current: shipped / fulfilled",
    });
  });

  it("orders shipments chronologically with carrier + tracking details", () => {
    const events = buildFulfillmentTimeline({
      ...base,
      shipments: [
        {
          shippedAt: new Date("2026-07-05T00:00:00Z"),
          carrier: "Purolator",
          trackingNumber: "PU123",
          trackingUrl: "https://track.example/PU123",
          itemsCount: 2,
        },
        {
          shippedAt: new Date("2026-07-03T00:00:00Z"),
          carrier: null,
          trackingNumber: null,
          trackingUrl: null,
          itemsCount: 0,
        },
      ],
    });
    const shipmentEvents = events.filter((e) => e.kind === "shipment");
    expect(shipmentEvents[0]!.label).toBe("Shipment recorded");
    expect(shipmentEvents[1]!.label).toBe("Shipped 2 items");
    expect(shipmentEvents[1]!.detail).toBe("Purolator · PU123");
    expect(shipmentEvents[1]!.trackingUrl).toBe("https://track.example/PU123");
  });

  it("adds an undated refund event without fabricating a timestamp", () => {
    const events = buildFulfillmentTimeline({
      ...base,
      refundedTotal: 45.5,
      paymentStatus: "partially_refunded",
    });
    const refund = events.find((e) => e.kind === "refund");
    expect(refund).toMatchObject({
      at: null,
      label: "Refunded 45.50 CAD",
      detail: "Partial refund",
    });
  });

  it("undated shipments sort after dated events but before nothing is lost", () => {
    const events = buildFulfillmentTimeline({
      ...base,
      shipments: [
        { shippedAt: null, carrier: "CP", trackingNumber: null, trackingUrl: null, itemsCount: 1 },
      ],
    });
    expect(events.map((e) => e.kind)).toEqual(["placed", "shipment", "current"]);
    expect(events[1]!.at).toBeNull();
  });
});
