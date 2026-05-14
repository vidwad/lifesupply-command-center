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
import {
  syncBcCustomersFull,
  syncBcCustomersIncremental,
} from "@/server/inngest/functions/bigcommerce/sync-customers";
import {
  syncBcOrdersFull,
  syncBcOrdersIncremental,
} from "@/server/inngest/functions/bigcommerce/sync-orders";
import { helloWorld } from "@/server/inngest/functions/hello";

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
        ],
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log("[worker] connected to Inngest, awaiting work…");

  // Block forever until the connection is closed (SIGINT/SIGTERM are
  // handled by the SDK automatically and trigger graceful shutdown).
  await connection.closed;

  // eslint-disable-next-line no-console
  console.log("[worker] connection closed, exiting.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[worker] fatal:", err);
  process.exit(1);
});
