/**
 * Service-layer performance harness (Phase 11E — rows 11E-02/11E-03).
 *
 * Times the read paths behind the heaviest pages directly at the service
 * layer (no HTTP/auth noise), so timings are comparable across runs and
 * environments. Run AFTER `pnpm perf:seed` against the same database the
 * measurement should represent.
 *
 * Read-only: executes the same queries the pages execute and discards the
 * results. Prints a p50/p95/max table and writes JSON evidence for the
 * certification record. Thresholds are NOT asserted here — they are a
 * product-owner decision (DEC-15, options in docs/24 §3); this harness
 * produces the measurements that decision needs.
 *
 * Usage: pnpm perf:measure [--iterations=5] [--out=perf-results.json]
 */
import { writeFileSync } from "node:fs";

// Relative imports (not `@/`) so plain tsx resolves them without a
// tsconfig-paths plugin — matches scripts/cron/audit-retention.ts style.
import { prisma } from "../../src/server/db/client";
import { getDashboardData } from "../../src/server/services/dashboard";
import { getOperationsSummary } from "../../src/server/services/operations";
import { listCustomers } from "../../src/server/services/customers";
import { listOrders } from "../../src/server/services/orders";
import { getAutomationDashboard } from "../../src/server/services/automation";
import { listReactivationCandidates } from "../../src/server/services/marketing/reactivation";

type Measurement = { name: string; samplesMs: number[]; p50: number; p95: number; max: number };

function quantile(sorted: number[], q: number): number {
  const idx = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, idx)] ?? 0;
}

async function measure(
  name: string,
  iterations: number,
  fn: () => Promise<unknown>,
): Promise<Measurement> {
  // One warm-up call so connection setup and query-plan caching don't
  // pollute the first sample.
  await fn();
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    name,
    samplesMs: samples.map((s) => Math.round(s * 10) / 10),
    p50: Math.round(quantile(sorted, 0.5)),
    p95: Math.round(quantile(sorted, 0.95)),
    max: Math.round(sorted[sorted.length - 1] ?? 0),
  };
}

async function main(): Promise<void> {
  let iterations = 5;
  let out = "perf-results.json";
  for (const arg of process.argv.slice(2)) {
    const it = /^--iterations=(\d+)$/.exec(arg);
    if (it) iterations = Number(it[1]);
    const o = /^--out=(.+)$/.exec(arg);
    if (o?.[1]) out = o[1];
  }

  const orderCount = await prisma.order.count();
  const customerCount = await prisma.customer.count();
  console.log(
    `measuring against ${orderCount} orders / ${customerCount} customers, ${iterations} iterations each…`,
  );

  // Deep pagination is the case that degrades first at volume — measure it
  // explicitly alongside page 1.
  const deepPage = Math.max(1, Math.floor(orderCount / 50) - 1);

  const targets: Array<{ name: string; fn: () => Promise<unknown> }> = [
    { name: "executive dashboard (getDashboardData)", fn: () => getDashboardData() },
    { name: "operations summary (getOperationsSummary)", fn: () => getOperationsSummary() },
    { name: "orders list page 1 (listOrders)", fn: () => listOrders({}) },
    { name: `orders list deep page ${deepPage}`, fn: () => listOrders({ page: deepPage }) },
    { name: "orders list filtered (search)", fn: () => listOrders({ search: "PERF-A" }) },
    { name: "customers list page 1 (listCustomers)", fn: () => listCustomers({}) },
    { name: "customers list filtered (b2b)", fn: () => listCustomers({ customerType: "b2b" }) },
    { name: "automation dashboard (getAutomationDashboard)", fn: () => getAutomationDashboard() },
    {
      name: "reactivation candidates (listReactivationCandidates)",
      fn: () => listReactivationCandidates({}),
    },
  ];

  const results: Measurement[] = [];
  for (const target of targets) {
    const m = await measure(target.name, iterations, target.fn);
    console.log(`${m.name.padEnd(52)} p50 ${m.p50}ms  p95 ${m.p95}ms  max ${m.max}ms`);
    results.push(m);
  }

  const evidence = {
    measuredAt: new Date().toISOString(),
    environment: process.env.DEPLOY_ENV ?? "local",
    volumes: { orders: orderCount, customers: customerCount },
    iterations,
    results,
  };
  writeFileSync(out, JSON.stringify(evidence, null, 2));
  console.log(`evidence written to ${out}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
