/**
 * Reliability posture canaries (Phase 11E — rows 11E-05/11E-06).
 *
 * Source-level guards for the job-safety properties the reliability plan
 * (docs/24) depends on: per-store serialization of syncs, the deliberate
 * no-retry policy for supplier portal automation, upsert-by-source-id
 * idempotency, and the error-reporting seam staying wired. Removing any of
 * them silently is a CI failure.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const BC_SYNC_FUNCTIONS = [
  "src/server/inngest/functions/bigcommerce/sync-customers.ts",
  "src/server/inngest/functions/bigcommerce/sync-orders.ts",
  "src/server/inngest/functions/bigcommerce/sync-products.ts",
  "src/server/inngest/functions/bigcommerce/reconcile.ts",
];

describe("job safety stays wired", () => {
  it("BigCommerce sync functions stay serialized per store", () => {
    // limit 1 + storeId key means retries and duplicate events can never
    // run the same store concurrently — the idempotency model (upserts by
    // source id) assumes this.
    for (const file of BC_SYNC_FUNCTIONS) {
      const src = read(file);
      expect(src, `${file} must serialize per store`).toContain(
        'concurrency: { limit: 1, key: "event.data.storeId" }',
      );
    }
  });

  it("supplier portal checks stay retry-free", () => {
    // Automatic retries would hammer a supplier portal that just failed —
    // failures surface as exceptions for a human instead (docs/10).
    const src = read("src/server/inngest/functions/supplier/run-check.ts");
    expect(src).toContain("retries: 0");
  });

  it("sync persistence stays upsert-by-source-id (safe under retries)", () => {
    const expectations: Array<{ file: string; needle: string }> = [
      { file: "src/server/integrations/bigcommerce/sync/sync-customers.ts", needle: ".upsert(" },
      { file: "src/server/integrations/bigcommerce/sync/sync-orders.ts", needle: ".upsert(" },
      { file: "src/server/integrations/bigcommerce/sync/sync-products.ts", needle: ".upsert(" },
      { file: "src/server/integrations/mailchimp/sync-members.ts", needle: ".upsert(" },
      { file: "src/server/integrations/ga4/sync-daily.ts", needle: ".upsert(" },
    ];
    for (const { file, needle } of expectations) {
      expect(read(file), `${file} must persist via upsert`).toContain(needle);
    }
  });

  it("the worker keeps its process-level safety nets", () => {
    const src = read("src/worker.ts");
    expect(src).toContain('process.on("unhandledRejection"');
    expect(src).toContain('process.on("uncaughtException"');
    expect(src).toContain("captureException");
  });

  it("uncaught server request errors keep reporting through the seam", () => {
    const src = read("src/instrumentation.ts");
    expect(src).toContain("onRequestError");
    expect(src).toContain("captureException");
  });

  it("the root error boundary exists", () => {
    expect(read("src/app/global-error.tsx")).toContain('"use client"');
  });

  it("every worker-registered function file is imported by worker.ts", () => {
    // A new Inngest function that is never registered silently never runs.
    const worker = read("src/worker.ts");
    for (const name of [
      "syncBcCustomersFull",
      "syncBcCustomersIncremental",
      "syncBcOrdersFull",
      "syncBcOrdersIncremental",
      "syncBcProductsFull",
      "syncBcProductsIncremental",
      "reconcileBcStore",
      "syncMailchimpSubscribers",
      "syncQboReports",
      "syncGa4DailyMetrics",
      "runSupplierCheck",
      "delaySweep",
    ]) {
      expect(worker, `worker.ts must register ${name}`).toContain(name);
    }
  });

  it("health probes every external-action flag from the kill set", () => {
    // SUPPLIER_AUTOMATION is deliberately absent: it gates read-only
    // checks, and staging legitimately runs with it ON during 11D
    // certification. All flags that cause external side effects must be in
    // the health probe so the smoke test can alert on them.
    const health = read("src/app/api/health/route.ts");
    for (const flag of [
      "SUPPLIER_ORDER_SUBMIT",
      "EXTERNAL_WRITEBACKS",
      "QUICKBOOKS_WRITEBACKS",
      "AI_ACTIONS",
      "MAILCHIMP_SEND",
      "INVESTOR_DISTRIBUTION",
    ]) {
      expect(health, `health must probe ${flag}`).toContain(flag);
    }
  });
});
