/**
 * A one-entry, in-process cache with a time to live (2026-10-30).
 *
 * The Command Center runs as one web process, so figures that are the same
 * for every user and cost seconds on the database — the executive dashboard,
 * the product sales index — are loaded once and shared. Concurrent callers
 * share the in-flight load; a failed load is not kept.
 *
 * With `staleWhileRevalidate`, an expired entry is still served while one
 * fresh load runs in the background, so after the first load no reader waits
 * for the database. `clear()` discards the entry and any refresh in flight.
 */
export type TtlCache<T> = {
  get(load: () => Promise<T>): Promise<T>;
  clear(): void;
};

export type TtlCacheOptions = {
  /** The clock, for tests. */
  now?: () => number;
  /** Serve the last good value past its expiry while the next load runs. */
  staleWhileRevalidate?: boolean;
};

type Entry<T> = { expiresAt: number; value: Promise<T>; settled: boolean };

export function createTtlCache<T>(ttlMs: number, options: TtlCacheOptions = {}): TtlCache<T> {
  const now = options.now ?? Date.now;
  const staleWhileRevalidate = options.staleWhileRevalidate ?? false;
  let entry: Entry<T> | null = null;
  let refreshing = false;
  // Bumped by clear(), so a refresh that started before a clear cannot
  // reinstate figures the caller meant to drop.
  let generation = 0;

  const begin = (load: () => Promise<T>): Entry<T> => {
    const next: Entry<T> = { expiresAt: now() + ttlMs, value: load(), settled: false };
    next.value.then(
      () => {
        next.settled = true;
      },
      () => {
        if (entry === next) entry = null;
      },
    );
    return next;
  };

  return {
    get(load) {
      const current = entry;
      if (current && current.expiresAt > now()) return current.value;
      if (staleWhileRevalidate && current?.settled) {
        if (!refreshing) {
          refreshing = true;
          const startedIn = generation;
          const next = begin(load);
          next.value
            .then(
              () => {
                if (generation === startedIn) entry = next;
              },
              () => {
                // The stale copy stays until the next reader tries again.
              },
            )
            .finally(() => {
              refreshing = false;
            });
        }
        return current.value;
      }
      const next = begin(load);
      entry = next;
      return next.value;
    },
    clear() {
      generation += 1;
      entry = null;
      refreshing = false;
    },
  };
}
