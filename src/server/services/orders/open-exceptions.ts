import type { ExceptionStatus } from "@prisma/client";

import { createTtlCache } from "@/server/cache/ttl-cache";
import { prisma } from "@/server/db/client";
import { logger } from "@/server/logger";

/** Exception states that still need someone's attention. */
export const OPEN_EXCEPTION_STATUSES = [
  "flagged",
  "in_review",
] as const satisfies readonly ExceptionStatus[];

/**
 * How many orders carry an open exception. The bell in the shell shows it on
 * every full page load and the dashboard shows it as a KPI; both used to
 * count it themselves, and the count walks the exception index with a heap
 * fetch for most rows (0.4 s on the production database, 2026-11-05). It is
 * the same for every user, so one count serves every reader for a minute,
 * the last count is served while the next runs, and the web process counts
 * as it starts. Resolving an exception marks it stale; the sync, which also
 * flags orders, runs in the worker, so the figure can trail it by a minute.
 */
export const OPEN_EXCEPTION_COUNT_TTL_MS = 60_000;

const countCache = createTtlCache<number>(OPEN_EXCEPTION_COUNT_TTL_MS, {
  staleWhileRevalidate: true,
});

export function countOpenExceptions(): Promise<number> {
  return countCache.get(() =>
    prisma.order.count({ where: { exceptionStatus: { in: [...OPEN_EXCEPTION_STATUSES] } } }),
  );
}

/** The next reader is served the current count while a fresh one runs. */
export function expireOpenExceptionCount(): void {
  countCache.expire();
}

/**
 * Counts ahead of the first reader, at process start. Never throws: a
 * database that is not ready yet is logged, and the first reader counts.
 */
export async function warmOpenExceptionCount(): Promise<void> {
  try {
    const exceptions = await countOpenExceptions();
    logger.info({ exceptions }, "open exception count warmed");
  } catch (err) {
    logger.warn({ err }, "open exception count could not be warmed");
  }
}
