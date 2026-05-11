/**
 * Daily audit-log retention cron.
 *
 * Wired in render.yaml as a separate Cron service so it runs in its own
 * container outside the request path. Same `runAuditRetention()` the
 * /admin/audit-logs button calls — see src/server/services/audit-logs/retention.ts.
 *
 * Exits 0 on success, 1 on failure so Render reports a failed run.
 */

// Relative imports (not `@/`) so plain tsx resolves them without a
// tsconfig-paths plugin — matches prisma/seed.ts style.
import { runAuditRetention } from "../../src/server/services/audit-logs/retention";
import { logger } from "../../src/server/logger";
import { prisma } from "../../src/server/db/client";

async function main() {
  logger.info("audit-retention cron starting");
  const report = await runAuditRetention();
  logger.info(
    {
      retentionDays: report.retentionDays,
      scanned: report.scanned,
      pruned: report.pruned,
      preserved: report.preserved,
      durationMs: report.durationMs,
    },
    "audit-retention cron complete",
  );
}

main()
  .catch((err) => {
    logger.error({ err }, "audit-retention cron failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
