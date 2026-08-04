/**
 * Delayed-order sweep (Phase 8). Evaluates every active order against the
 * delay rules and routes findings into BOTH exception surfaces so the queues
 * agree:
 *   - an `order_delay` Exception row, deduped per order via
 *     recurringKey `order:<id>:delay` (kind changes refresh the same row);
 *   - Order.exceptionStatus = flagged (+ exceptionReason) — but only when the
 *     order isn't already flagged/in_review for something else, so a human
 *     investigation is never clobbered.
 *
 * Orders that are no longer delayed get their sweep-created exception
 * auto-resolved (audited, clearly attributed to the sweep) and their order
 * flag cleared IF the sweep set it. Runs in the worker on a cron and on
 * demand from the operations page.
 */
import { prisma } from "@/server/db/client";
import { writeAudit } from "@/server/audit";
import { createOrTouchException } from "@/server/services/exceptions";

import { delaySeverity, evaluateOrderDelay } from "./delay-rules";

/** Statuses worth sweeping — everything not terminal. */
const SWEEP_STATUSES = [
  "received",
  "processing",
  "awaiting_supplier",
  "in_supplier_queue",
  "awaiting_human_review",
  "shipped",
] as const;

/** Upper bound per sweep — the oldest active orders sort first, so a backlog
 * larger than this still converges over consecutive runs. */
const SWEEP_CAP = 2000;

export const DELAY_RECURRING_PREFIX = "order:";

const delayKey = (orderId: string) => `${DELAY_RECURRING_PREFIX}${orderId}:delay`;

export type DelaySweepResult = {
  scanned: number;
  delayed: number;
  warned: number;
  exceptionsCreated: number;
  exceptionsRefreshed: number;
  exceptionsAutoResolved: number;
  ordersFlagged: number;
  ordersUnflagged: number;
};

export async function sweepDelayedOrders(args?: {
  triggeredById?: string;
  now?: Date;
}): Promise<DelaySweepResult> {
  const now = args?.now ?? new Date();
  const actor = args?.triggeredById ? { id: args.triggeredById } : undefined;

  const orders = await prisma.order.findMany({
    where: { status: { in: SWEEP_STATUSES as unknown as never } },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      orderDate: true,
      exceptionStatus: true,
      exceptionReason: true,
      shipments: { select: { shippedAt: true } },
    },
    orderBy: { orderDate: "asc" },
    take: SWEEP_CAP,
  });

  const result: DelaySweepResult = {
    scanned: orders.length,
    delayed: 0,
    warned: 0,
    exceptionsCreated: 0,
    exceptionsRefreshed: 0,
    exceptionsAutoResolved: 0,
    ordersFlagged: 0,
    ordersUnflagged: 0,
  };
  const clearedOrderIds: string[] = [];

  for (const order of orders) {
    const verdict = evaluateOrderDelay({
      status: order.status,
      orderDate: order.orderDate,
      shipmentDates: order.shipments.map((s) => s.shippedAt),
      now,
    });

    if (verdict.delayed) {
      result.delayed++;
      const { created } = await createOrTouchException(
        {
          exceptionType: "order_delay",
          severity: delaySeverity(verdict),
          title: `Order delayed (${verdict.kind.replace(/_/g, " ")}): ${order.orderNumber}`,
          description: verdict.reason,
          entityType: "order",
          entityId: order.id,
          recurringKey: delayKey(order.id),
          source: "delay_sweep",
          metadata: { kind: verdict.kind, daysOutstanding: verdict.daysOutstanding },
        },
        actor,
      );
      if (created) result.exceptionsCreated++;
      else result.exceptionsRefreshed++;

      // Flag the order only when nothing else already flagged it.
      if (order.exceptionStatus === "none") {
        await prisma.order.update({
          where: { id: order.id },
          data: { exceptionStatus: "flagged", exceptionReason: verdict.reason },
        });
        result.ordersFlagged++;
      }
    } else {
      if (verdict.warning) result.warned++;
      clearedOrderIds.push(order.id);

      // Clear the order flag only if the sweep set it (reason matches our
      // wording) — human flags stay untouched.
      if (
        order.exceptionStatus === "flagged" &&
        order.exceptionReason &&
        /^(Unshipped|Awaiting human review|Shipped) \d+ days/.test(order.exceptionReason)
      ) {
        await prisma.order.update({
          where: { id: order.id },
          data: { exceptionStatus: "none", exceptionReason: null },
        });
        result.ordersUnflagged++;
      }
    }
  }

  // Auto-resolve open delay exceptions for orders that are no longer delayed
  // (shipped, delivered, or aged back under threshold after a data fix).
  // Only untouched "open" rows — once a human moves one to investigating or
  // blocked, resolution is theirs.
  if (clearedOrderIds.length > 0) {
    const stale = await prisma.exception.findMany({
      where: {
        source: "delay_sweep",
        status: "open",
        recurringKey: { in: clearedOrderIds.map(delayKey) },
      },
      select: { id: true, recurringKey: true },
    });
    for (const ex of stale) {
      await prisma.exception.update({
        where: { id: ex.id },
        data: {
          status: "resolved",
          resolvedAt: now,
          resolutionNotes: "Auto-resolved by delay sweep: order is no longer delayed.",
        },
      });
      await writeAudit({
        actorUserId: args?.triggeredById ?? null,
        action: "exception.auto_resolved",
        entityType: "exception",
        entityId: ex.id,
        afterData: { source: "delay_sweep", recurringKey: ex.recurringKey },
      });
      result.exceptionsAutoResolved++;
    }
  }

  await writeAudit({
    actorUserId: args?.triggeredById ?? null,
    action: "operations.delay_sweep",
    entityType: "system",
    afterData: { ...result },
  });
  return result;
}
