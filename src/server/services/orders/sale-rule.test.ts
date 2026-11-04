import { OrderStatus, PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  countsAsSale,
  NON_SALE_ORDER_STATUSES,
  NON_SALE_PAYMENT_STATUSES,
  SALE_ORDER_STATUSES,
  SALE_ORDER_WHERE,
} from "./sale-rule";

describe("countsAsSale", () => {
  it("excludes cancelled and refunded orders whatever the payment says", () => {
    for (const paymentStatus of Object.values(PaymentStatus)) {
      expect(countsAsSale({ status: "cancelled", paymentStatus })).toBe(false);
      expect(countsAsSale({ status: "refunded", paymentStatus })).toBe(false);
    }
  });

  it("excludes failed and fully refunded payments whatever the order status says", () => {
    for (const status of Object.values(OrderStatus)) {
      expect(countsAsSale({ status, paymentStatus: "failed" })).toBe(false);
      expect(countsAsSale({ status, paymentStatus: "refunded" })).toBe(false);
    }
  });

  it("counts paid, pending and partially refunded orders on every other status", () => {
    for (const status of SALE_ORDER_STATUSES) {
      expect(countsAsSale({ status, paymentStatus: "paid" })).toBe(true);
      expect(countsAsSale({ status, paymentStatus: "pending" })).toBe(true);
      expect(countsAsSale({ status, paymentStatus: "partially_refunded" })).toBe(true);
    }
  });

  it("covers every OrderStatus exactly once across the two lists", () => {
    // A status added to the schema later must force a decision here rather
    // than silently becoming a sale.
    const all = Object.values(OrderStatus).sort();
    const covered = [...SALE_ORDER_STATUSES, ...NON_SALE_ORDER_STATUSES].sort();
    expect(covered).toEqual(all);
    expect(new Set(covered).size).toBe(covered.length);
  });

  it("covers every PaymentStatus with a decision", () => {
    const decided = new Set<PaymentStatus>([
      ...NON_SALE_PAYMENT_STATUSES,
      "paid",
      "pending",
      "partially_refunded",
    ]);
    expect([...decided].sort()).toEqual(Object.values(PaymentStatus).sort());
  });

  it("expresses the same rule as a Prisma filter", () => {
    expect(SALE_ORDER_WHERE).toEqual({
      status: { notIn: ["cancelled", "refunded"] },
      paymentStatus: { notIn: ["failed", "refunded"] },
    });
  });
});
