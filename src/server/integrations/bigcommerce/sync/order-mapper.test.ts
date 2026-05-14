/**
 * Unit tests for the BC order → Prisma upsert mapper.
 */
import { describe, expect, it } from "vitest";

import { mapBcOrderToUpsert, type BcOrderPayload } from "./order-mapper";

const baseBc: BcOrderPayload = {
  id: 1001,
  customer_id: 42,
  status_id: 11, // Awaiting Fulfillment
  status: "Awaiting Fulfillment",
  payment_status: "captured",
  date_created: "Wed, 01 Jan 2025 12:00:00 +0000",
  date_modified: "Wed, 01 Jan 2025 13:00:00 +0000",
  subtotal_inc_tax: "100.00",
  discount_amount: "5.00",
  shipping_cost_inc_tax: "10.00",
  total_tax: "11.50",
  total_inc_tax: "116.50",
  currency_code: "CAD",
};

describe("mapBcOrderToUpsert", () => {
  it("populates BC-owned fields in both create and update payloads", () => {
    const { create, update } = mapBcOrderToUpsert(baseBc, {
      storeId: "store-1",
      divisionId: "div-1",
      customerId: "cust-1",
    });

    for (const payload of [create, update]) {
      expect(payload.orderNumber).toBe("1001");
      expect(payload.customerId).toBe("cust-1");
      expect(payload.status).toBe("processing"); // status_id 11 → processing
      expect(payload.paymentStatus).toBe("paid"); // captured → paid
      expect(payload.fulfillmentStatus).toBe("unfulfilled");
      expect(payload.subtotal).toBe(100);
      expect(payload.discountTotal).toBe(5);
      expect(payload.shippingTotal).toBe(10);
      expect(payload.taxTotal).toBe(11.5);
      expect(payload.grandTotal).toBe(116.5);
      expect(payload.currency).toBe("CAD");
    }
  });

  it("omits CC-owned fields from the update payload", () => {
    const { update } = mapBcOrderToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      customerId: null,
    });
    // The whole point: update payload OMITS these so Prisma preserves them.
    expect(update).not.toHaveProperty("estimatedGrossProfit");
    expect(update).not.toHaveProperty("estimatedGrossMargin");
    expect(update).not.toHaveProperty("supplierStatus");
    expect(update).not.toHaveProperty("automationStatus");
    expect(update).not.toHaveProperty("exceptionStatus");
    expect(update).not.toHaveProperty("exceptionReason");
  });

  it("maps each BC status_id to the right Prisma triple", () => {
    const cases = [
      { id: 1, expected: { status: "received", payment: "pending", fulfillment: "unfulfilled" } },
      { id: 2, expected: { status: "shipped", payment: "paid", fulfillment: "fulfilled" } },
      { id: 5, expected: { status: "cancelled", payment: "failed", fulfillment: "unfulfilled" } },
      { id: 10, expected: { status: "completed", payment: "paid", fulfillment: "fulfilled" } },
      { id: 12, expected: { status: "awaiting_human_review", payment: "pending", fulfillment: "unfulfilled" } },
      { id: 14, expected: { status: "processing", payment: "partially_refunded", fulfillment: "fulfilled" } },
    ];
    for (const c of cases) {
      const { create } = mapBcOrderToUpsert(
        { ...baseBc, status_id: c.id, payment_status: undefined },
        { storeId: "s1", divisionId: null, customerId: null },
      );
      expect(create.status).toBe(c.expected.status);
      expect(create.paymentStatus).toBe(c.expected.payment);
      expect(create.fulfillmentStatus).toBe(c.expected.fulfillment);
    }
  });

  it("falls back to received/pending/unfulfilled for unknown status_id", () => {
    const { create } = mapBcOrderToUpsert(
      { ...baseBc, status_id: 999, payment_status: undefined },
      { storeId: "s1", divisionId: null, customerId: null },
    );
    expect(create.status).toBe("received");
    expect(create.paymentStatus).toBe("pending");
    expect(create.fulfillmentStatus).toBe("unfulfilled");
  });

  it("payment_status string overrides the status_id-derived payment", () => {
    const { create } = mapBcOrderToUpsert(
      { ...baseBc, status_id: 11, payment_status: "refunded" },
      { storeId: "s1", divisionId: null, customerId: null },
    );
    expect(create.status).toBe("processing"); // from status_id
    expect(create.paymentStatus).toBe("refunded"); // from payment_status string
  });

  it("uses bigcommerce as sourceSystem and stringifies the BC id", () => {
    const { create } = mapBcOrderToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      customerId: null,
    });
    expect(create.sourceSystem).toBe("bigcommerce");
    expect(create.sourceId).toBe("1001");
  });

  it("defaults currency to CAD when missing", () => {
    const { create } = mapBcOrderToUpsert(
      { ...baseBc, currency_code: undefined },
      { storeId: "s1", divisionId: null, customerId: null },
    );
    expect(create.currency).toBe("CAD");
  });

  it("attaches the raw BC payload + ISO sync timestamp to metadata", () => {
    const { create } = mapBcOrderToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      customerId: null,
    });
    const meta = create.metadata as { bcRaw: unknown; bcSyncedAt: string };
    expect(meta.bcRaw).toEqual(baseBc);
    expect(meta.bcSyncedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("handles missing/zero monetary fields gracefully", () => {
    const { create } = mapBcOrderToUpsert(
      {
        id: 1,
        customer_id: 0,
        status_id: 1,
        date_created: "Wed, 01 Jan 2025 12:00:00 +0000",
      },
      { storeId: "s1", divisionId: null, customerId: null },
    );
    expect(create.subtotal).toBe(0);
    expect(create.discountTotal).toBe(0);
    expect(create.shippingTotal).toBe(0);
    expect(create.taxTotal).toBe(0);
    expect(create.grandTotal).toBe(0);
  });
});
