/**
 * Inngest function for read-only supplier checks (Phase 7). Runs in the
 * background worker only — browser automation never executes in a web
 * request. `executeSupplierCheck` finalizes the run row (including on
 * failure) and raises exceptions itself.
 *
 * retries: 0 — automatic retries would hammer a supplier portal that just
 * failed (or re-run against a finalized run). Failures surface as a failed
 * run + a high-severity exception; a human decides whether to re-trigger.
 */
import { inngest } from "@/server/inngest/client";
import { executeSupplierCheck, SUPPLIER_CHECK_EVENT } from "@/server/services/automation/checks";

export const runSupplierCheck = inngest.createFunction(
  {
    id: "supplier-run-check",
    name: "Supplier — Read-only Check (Worker)",
    triggers: [{ event: SUPPLIER_CHECK_EVENT }],
    concurrency: { limit: 1 },
    retries: 0,
  },
  async ({ event }) => {
    const { runId } = event.data as { runId: string };
    return executeSupplierCheck({ runId });
  },
);
