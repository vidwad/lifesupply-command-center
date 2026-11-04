/**
 * Recompute every customer's lifetime value, order count and first/last
 * order dates from the Order table under the shared sale rule.
 *
 * The order sync does this at the end of every run since 2026-11-03; this
 * script is the by-hand route for a database whose customers were last
 * aggregated by the older walk, which counted cancelled and declined orders.
 *
 * Usage: pnpm customers:recompute [--store=<storeId>]
 */
// Relative imports (not `@/`) so plain tsx resolves them without a
// tsconfig-paths plugin — matches scripts/cron/audit-retention.ts style.
import { prisma } from "../../src/server/db/client";
import { recomputeCustomerLifetimeMetrics } from "../../src/server/services/customers/lifetime-metrics";

async function main(): Promise<void> {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const storeId = storeArg ? storeArg.slice("--store=".length) : undefined;
  const startedAt = Date.now();
  const changed = await recomputeCustomerLifetimeMetrics({ storeId });
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `Recomputed lifetime metrics${storeId ? ` for store ${storeId}` : ""}: ` +
      `${changed.toLocaleString()} customer${changed === 1 ? "" : "s"} changed in ${seconds}s.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
