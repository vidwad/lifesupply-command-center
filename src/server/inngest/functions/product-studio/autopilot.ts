/**
 * Unattended Product Studio runs — worker functions (2026-10-27).
 *
 * Two functions, both thin. The run function marks a run running and sends
 * one item event per lane. The item function performs ONE step (see
 * `services/product-studio/autopilot.ts`) and either re-sends itself for
 * the next step or, when the item is finished, claims the next pending item
 * for its lane and sends that one; the lane that finds nothing left closes
 * the run. Each invocation is therefore short, and every step is a point at
 * which a cancel or a tripped flag is honoured.
 *
 * Concurrency is one invocation per item, so a duplicated event can never
 * work the same product at the same time; how many items run at once is
 * the run's own setting, applied when the lanes are claimed.
 */
import { inngest } from "@/server/inngest/client";
import {
  AUTOPILOT_ITEM_EVENT,
  AUTOPILOT_RUN_EVENT,
  claimNextRunItem,
  finalizeRunIfComplete,
  processRunItemStep,
  sendRunItemStep,
  startProductStudioRun,
} from "@/server/services/product-studio/autopilot";

type RunEvent = { runId: string; actorUserId: string };
type ItemEvent = { runId: string; itemId: string };

export const startProductStudioAutopilotRun = inngest.createFunction(
  {
    id: "product-studio-autopilot-run",
    name: "Product Studio — Start an unattended run",
    triggers: [{ event: AUTOPILOT_RUN_EVENT }],
    concurrency: { limit: 1, key: "event.data.runId" },
    retries: 1,
  },
  async ({ event }) => {
    const data = event.data as RunEvent;
    const { itemIds } = await startProductStudioRun(data.runId);
    for (const itemId of itemIds) {
      await sendRunItemStep({ runId: data.runId, itemId, step: 0 });
    }
    if (itemIds.length === 0) await finalizeRunIfComplete(data.runId);
    return { runId: data.runId, lanes: itemIds.length };
  },
);

export const processProductStudioAutopilotItem = inngest.createFunction(
  {
    id: "product-studio-autopilot-item",
    name: "Product Studio — One unattended step for one product",
    triggers: [{ event: AUTOPILOT_ITEM_EVENT }],
    concurrency: { limit: 1, key: "event.data.itemId" },
    retries: 1,
  },
  async ({ event }) => {
    const data = event.data as ItemEvent;
    const outcome = await processRunItemStep(data);
    if (outcome.kind === "continue") {
      await sendRunItemStep({ runId: data.runId, itemId: data.itemId, step: outcome.step });
      return { itemId: data.itemId, continued: true };
    }
    const nextItemId = await claimNextRunItem(data.runId);
    if (nextItemId) {
      await sendRunItemStep({ runId: data.runId, itemId: nextItemId, step: 0 });
      return { itemId: data.itemId, finished: outcome.stage, next: nextItemId };
    }
    const closed = await finalizeRunIfComplete(data.runId);
    return { itemId: data.itemId, finished: outcome.stage, closedRun: closed };
  },
);
