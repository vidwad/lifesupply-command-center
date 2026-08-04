/**
 * Delayed-order sweep (Phase 8). Runs in the worker every 6 hours and on
 * demand via the operations page. Pure DB work — no browser, no external
 * calls — so default retries are safe (the sweep is idempotent: exceptions
 * dedupe on recurringKey and flag updates are conditional).
 */
import { inngest } from "@/server/inngest/client";
import { sweepDelayedOrders } from "@/server/services/operations/delay-sweep";

export const DELAY_SWEEP_EVENT = "operations/delay-sweep.requested";

export const delaySweep = inngest.createFunction(
  {
    id: "operations-delay-sweep",
    name: "Operations — Delayed Order Sweep",
    triggers: [{ cron: "0 */6 * * *" }, { event: DELAY_SWEEP_EVENT }],
    concurrency: { limit: 1 },
  },
  async ({ event }) => {
    const triggeredById =
      event && "data" in event
        ? (event.data as { triggeredById?: string })?.triggeredById
        : undefined;
    return sweepDelayedOrders({ triggeredById });
  },
);
