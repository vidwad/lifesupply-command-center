/**
 * Background Worker entrypoint.
 *
 * Runs as a Render Background Worker (no public HTTP). Uses Inngest
 * Connect: the worker opens a persistent WebSocket OUT to Inngest, so
 * function invocations are pushed over that connection — no inbound URL
 * required. This is the right model for workers that have no business
 * being reachable from the public internet.
 *
 * Start command: pnpm worker
 *
 * Render setup:
 *   1. Service type: Background Worker (NOT Web Service)
 *   2. Same Docker image as the web service
 *   3. Start command: pnpm worker
 *   4. Required env: DATABASE_URL, MASTER_ENCRYPTION_KEY,
 *      INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
 *
 * Inngest setup:
 *   - With Connect, the worker REGISTERS ITSELF on connection — there is
 *     no "Sync your app" URL step to fill in. After the worker boots,
 *     the app + its functions appear in the Inngest dashboard
 *     automatically. Skip the manual sync step.
 */
import { connect } from "inngest/connect";

import { inngest } from "@/server/inngest/client";
import { logger } from "@/server/logger";
import { captureException } from "@/server/logger/error-tracking";
import {
  syncBcCustomersFull,
  syncBcCustomersIncremental,
} from "@/server/inngest/functions/bigcommerce/sync-customers";
import {
  syncBcOrdersFull,
  syncBcOrdersIncremental,
} from "@/server/inngest/functions/bigcommerce/sync-orders";
import {
  syncBcProductsFull,
  syncBcProductsIncremental,
} from "@/server/inngest/functions/bigcommerce/sync-products";
import { reconcileBcStore } from "@/server/inngest/functions/bigcommerce/reconcile";
import { syncMailchimpSubscribers } from "@/server/inngest/functions/mailchimp/sync-members";
import { syncQboReports } from "@/server/inngest/functions/quickbooks/sync-reports";
import { syncGa4DailyMetrics } from "@/server/inngest/functions/ga4/sync-daily";
import { runSupplierCheck } from "@/server/inngest/functions/supplier/run-check";
import { delaySweep } from "@/server/inngest/functions/operations/delay-sweep";
import { competitorPriceCheck } from "@/server/inngest/functions/pricing/competitor-check";
import { helloWorld } from "@/server/inngest/functions/hello";
import {
  generateProductStudioImage,
  researchProductStudioProject,
} from "@/server/inngest/functions/product-studio/process";

// Process-level safety nets (Phase 11E — row 11E-06). Inngest handles
// per-run failures; these catch everything outside a run so a crashing
// worker leaves a structured, alertable log line instead of dying silently.
process.on("unhandledRejection", (reason) => {
  captureException(reason, { source: "worker.unhandledRejection" });
});
process.on("uncaughtException", (err) => {
  captureException(err, { source: "worker.uncaughtException" });
  // State after an uncaught exception is undefined — exit and let Render
  // restart the worker; in-flight Inngest runs retry automatically.
  process.exit(1);
});

async function main(): Promise<void> {
  const connection = await connect({
    apps: [
      {
        client: inngest,
        functions: [
          helloWorld,
          syncBcCustomersFull,
          syncBcCustomersIncremental,
          syncBcOrdersFull,
          syncBcOrdersIncremental,
          syncBcProductsFull,
          syncBcProductsIncremental,
          reconcileBcStore,
          syncMailchimpSubscribers,
          syncQboReports,
          syncGa4DailyMetrics,
          runSupplierCheck,
          delaySweep,
          competitorPriceCheck,
          researchProductStudioProject,
          generateProductStudioImage,
        ],
      },
    ],
  });

  logger.info(
    { deployEnv: process.env.DEPLOY_ENV ?? "unknown" },
    "[worker] connected to Inngest, awaiting work…",
  );

  // Block forever until the connection is closed (SIGINT/SIGTERM are
  // handled by the SDK automatically and trigger graceful shutdown).
  await connection.closed;

  logger.info("[worker] connection closed, exiting.");
}

main().catch((err) => {
  captureException(err, { source: "worker.fatal" });
  process.exit(1);
});
