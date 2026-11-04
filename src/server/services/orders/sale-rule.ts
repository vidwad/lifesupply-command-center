/**
 * What counts as a sale — one rule for every order-derived figure.
 *
 * Customer lifetime value and order count, the sales-intelligence revenue
 * figures and the BigCommerce reconciliation's "sales" rows all ask the same
 * question of an order: did money change hands and stay changed? Before this
 * module (2026-11-03) each surface answered it differently, and the customer
 * aggregates did not ask at all, so two cancelled test orders of $23M and
 * $25M on one LifeSupply.ca account were reported as lifetime value.
 *
 * An order is a sale unless either axis says otherwise:
 *
 *   - its order status is `cancelled` or `refunded` (nothing was, or remains,
 *     delivered), or
 *   - its payment status is `failed` or `refunded` (BigCommerce "Declined",
 *     "Cancelled", "Disputed", an "Incomplete" checkout whose card was
 *     declined, or a full refund on an otherwise normal status).
 *
 * Pending payment still counts: an order awaiting payment is a sale in
 * flight, and the sales-intelligence layer already treats it that way.
 * Partial refunds still count at the gross total; `refundedTotal` carries
 * the refund separately. The Executive Dashboard's product leaderboard keeps
 * its own narrower rule (`cancelled` only) until the product owner resolves
 * the refund question recorded in `docs/36` §7.1.
 *
 * Nothing here touches Prisma's client, BigCommerce or any write path, so it
 * can be unit-tested without a database and imported from the sync layer.
 */
import { OrderStatus, PaymentStatus, type Prisma } from "@prisma/client";

/** Order statuses that never count as a sale. */
export const NON_SALE_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.cancelled,
  OrderStatus.refunded,
];

/** Payment statuses that never count as a sale. */
export const NON_SALE_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  PaymentStatus.failed,
  PaymentStatus.refunded,
];

/** Order statuses that can count as a sale (every status not excluded above). */
export const SALE_ORDER_STATUSES: readonly OrderStatus[] = Object.values(OrderStatus).filter(
  (status) => !NON_SALE_ORDER_STATUSES.includes(status),
);

export type SaleRuleInput = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};

/** True when the order counts toward sales, revenue and customer lifetime figures. */
export function countsAsSale(order: SaleRuleInput): boolean {
  return (
    !NON_SALE_ORDER_STATUSES.includes(order.status) &&
    !NON_SALE_PAYMENT_STATUSES.includes(order.paymentStatus)
  );
}

/**
 * The same rule as a Prisma filter, for aggregate queries. Spread it into a
 * wider `where`; it only constrains the two status columns.
 */
export const SALE_ORDER_WHERE: Prisma.OrderWhereInput = {
  status: { notIn: [...NON_SALE_ORDER_STATUSES] },
  paymentStatus: { notIn: [...NON_SALE_PAYMENT_STATUSES] },
};
