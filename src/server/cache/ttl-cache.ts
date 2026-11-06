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
 * for the database. `clear()` discards the entry and any refresh in flight;
 * `expire()` keeps the entry but marks it stale, so a write the figures
 * depend on is reflected at the next refresh while no reader waits for it.
 */
export type TtlCache<T> = {
  get(load: () => Promise<T>): Promise<T>;
  clear(): void;
  expire(): void;
};

/** One TtlCache per key; see createKeyedTtlCache. */
export type KeyedTtlCache<T> = {
  get(key: string, load: () => Promise<T>): Promise<T>;
  clear(): void;
  expire(): void;
};

export type KeyedTtlCacheOptions = TtlCacheOptions & {
  /** How many keys are held at once; the least recently read goes first. */
  maxEntries: number;
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
    expire() {
      // A load still in flight may predate the write; the next reader starts
      // another, which is the price of never serving a figure known stale as
      // fresh.
      if (entry) entry.expiresAt = 0;
    },
  };
}

/**
 * A cache per key for figures that differ by a small set of inputs
 * (2026-11-05): the products under each filter combination, for instance.
 * Each key behaves as createTtlCache does; once `maxEntries` keys are held,
 * the least recently read is dropped, so a stream of one-off searches cannot
 * grow the process without bound.
 */
export function createKeyedTtlCache<T>(
  ttlMs: number,
  options: KeyedTtlCacheOptions,
): KeyedTtlCache<T> {
  const caches = new Map<string, TtlCache<T>>();
  return {
    get(key, load) {
      let cache = caches.get(key);
      if (cache) {
        // Re-inserted so the Map's order is the order of last use.
        caches.delete(key);
      } else {
        cache = createTtlCache<T>(ttlMs, options);
      }
      caches.set(key, cache);
      while (caches.size > options.maxEntries) {
        const oldest = caches.keys().next().value;
        if (oldest === undefined) break;
        caches.delete(oldest);
      }
      return cache.get(load);
    },
    clear() {
      for (const cache of caches.values()) cache.clear();
      caches.clear();
    },
    expire() {
      for (const cache of caches.values()) cache.expire();
    },
  };
}
