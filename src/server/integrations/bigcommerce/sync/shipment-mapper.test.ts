import { describe, expect, it } from "vitest";

import { mapBcShipmentToUpsert, SOURCE_SYSTEM, type BcShipment } from "./shipment-mapper";

const base: BcShipment = {
  id: 77,
  order_id: 1001,
  date_created: "Wed, 02 Jul 2026 10:00:00 +0000",
  tracking_number: "1Z999AA10123456784",
  tracking_carrier: "ups",
  shipping_provider: "UPS Ground",
  generated_tracking_link: "https://track.example/1Z999AA10123456784",
  items: [
    { order_product_id: 1, quantity: 2 },
    { order_product_id: 2, quantity: 1 },
  ],
};

describe("mapBcShipmentToUpsert", () => {
  it("keys on (bigcommerce, shipment id) and links the order", () => {
    const { create } = mapBcShipmentToUpsert(base, { orderId: "order_1" });
    expect(create.sourceSystem).toBe(SOURCE_SYSTEM);
    expect(create.sourceId).toBe("77");
    expect(create.orderId).toBe("order_1");
  });

  it("maps tracking fields, preferring carrier code + generated link", () => {
    const { create } = mapBcShipmentToUpsert(base, { orderId: "o" });
    expect(create.carrier).toBe("ups");
    expect(create.trackingNumber).toBe("1Z999AA10123456784");
    expect(create.trackingUrl).toBe("https://track.example/1Z999AA10123456784");
    expect(create.shippedAt).toBeInstanceOf(Date);
  });

  it("falls back to shipping_provider / tracking_link when preferred fields are empty", () => {
    const { create } = mapBcShipmentToUpsert(
      {
        ...base,
        tracking_carrier: " ",
        generated_tracking_link: null,
        tracking_link: "https://alt.example/t",
      },
      { orderId: "o" },
    );
    expect(create.carrier).toBe("UPS Ground");
    expect(create.trackingUrl).toBe("https://alt.example/t");
  });

  it("sums item quantities into itemsCount, ignoring negatives", () => {
    const { create } = mapBcShipmentToUpsert(base, { orderId: "o" });
    expect(create.itemsCount).toBe(3);
    const empty = mapBcShipmentToUpsert({ ...base, items: null }, { orderId: "o" });
    expect(empty.create.itemsCount).toBe(0);
  });

  it("handles a bare shipment with no tracking or date", () => {
    const { create } = mapBcShipmentToUpsert(
      { id: 9, tracking_number: null, date_created: null },
      { orderId: "o" },
    );
    expect(create.trackingNumber).toBeNull();
    expect(create.carrier).toBeNull();
    expect(create.shippedAt).toBeNull();
  });

  it("overwrites BC-owned fields on update and keeps the raw payload in metadata", () => {
    const { update } = mapBcShipmentToUpsert(base, { orderId: "order_1" });
    expect(update.trackingNumber).toBe("1Z999AA10123456784");
    expect(update).not.toHaveProperty("sourceSystem");
    const meta = update.metadata as Record<string, unknown>;
    expect(meta.bcOrderId).toBe(1001);
    expect(meta.bcRaw).toEqual(base);
  });
});
