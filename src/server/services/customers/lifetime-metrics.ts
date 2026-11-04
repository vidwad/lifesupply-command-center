/**
 * Customer lifetime figures, recomputed from the Order table (2026-11-03).
 *
 * `Customer.lifetimeValue`, `orderCount`, `firstOrderAt` and `lastOrderAt`
 * used to come only from the customer sync's own walk of BigCommerce orders.
 * That walk counted every order whatever its status, so cancelled and
 * declined orders inflated lifetime value (two cancelled test orders put one
 * account at $48M), it was last run in May 2026 while orders kept syncing,
 * and it never covered guest customers at all.
 *
 * This module derives the same four fields from the orders already in the
 * database, under the shared sale rule: cancelled, refunded, declined and
 * fully refunded orders do not count. One grouped UPDATE handles a store (or
 * every store), touching only the customers whose figures actually change
 * so `updatedAt` stays meaningful. The order sync runs it at the end of
 * every walk; `pnpm customers:recompute` runs it by hand.
 */
import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import {
  NON_SALE_ORDER_STATUSES,
  NON_SALE_PAYMENT_STATUSES,
} from "@/server/services/orders/sale-rule";

/** Enum values as a quoted SQL list. Our own constants, never user input. */
function literalList(values: readonly string[]): Prisma.Sql {
  return Prisma.raw(values.map((value) => `'${value}'`).join(", "));
}

/**
 * The statement, exposed for tests. With a store, both the orders scanned and
 * the customers updated are limited to it; without one, every customer is
 * covered. A customer with no qualifying order ends at zero and null dates.
 */
export function recomputeCustomerLifetimeMetricsSql(storeId?: string): Prisma.Sql {
  const orderStoreClause = storeId ? Prisma.sql`AND o."storeId" = ${storeId}` : Prisma.empty;
  const customerStoreClause = storeId ? Prisma.sql`AND c."storeId" = ${storeId}` : Prisma.empty;
  return Prisma.sql`
    WITH sales AS (
      SELECT
        o."customerId" AS customer_id,
        COUNT(*)::int AS order_count,
        SUM(o."grandTotal") AS lifetime_value,
        MIN(o."orderDate") AS first_order_at,
        MAX(o."orderDate") AS last_order_at
      FROM orders o
      WHERE o."customerId" IS NOT NULL
        AND o.status NOT IN (${literalList(NON_SALE_ORDER_STATUSES)})
        AND o."paymentStatus" NOT IN (${literalList(NON_SALE_PAYMENT_STATUSES)})
        ${orderStoreClause}
      GROUP BY o."customerId"
    ),
    target AS (
      SELECT
        c.id,
        COALESCE(s.lifetime_value, 0) AS lifetime_value,
        COALESCE(s.order_count, 0) AS order_count,
        s.first_order_at,
        s.last_order_at
      FROM customers c
      LEFT JOIN sales s ON s.customer_id = c.id
      WHERE TRUE ${customerStoreClause}
    )
    UPDATE customers c
    SET
      "lifetimeValue" = t.lifetime_value,
      "orderCount" = t.order_count,
      "firstOrderAt" = t.first_order_at,
      "lastOrderAt" = t.last_order_at,
      "updatedAt" = NOW()
    FROM target t
    WHERE t.id = c.id
      AND (
        c."lifetimeValue" IS DISTINCT FROM t.lifetime_value
        OR c."orderCount" IS DISTINCT FROM t.order_count
        OR c."firstOrderAt" IS DISTINCT FROM t.first_order_at
        OR c."lastOrderAt" IS DISTINCT FROM t.last_order_at
      )
  `;
}

/** Runs the recompute and returns how many customers changed. */
export async function recomputeCustomerLifetimeMetrics(
  args: { storeId?: string } = {},
): Promise<number> {
  return prisma.$executeRaw(recomputeCustomerLifetimeMetricsSql(args.storeId));
}
