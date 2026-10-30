import { describe, expect, it } from "vitest";

import { createTtlCache } from "./ttl-cache";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe("createTtlCache", () => {
  it("serves one load to every caller until the time to live passes", async () => {
    let clock = 1_000;
    let loads = 0;
    const cache = createTtlCache<number>(60_000, { now: () => clock });
    const load = async () => ++loads;

    await expect(cache.get(load)).resolves.toBe(1);
    await expect(cache.get(load)).resolves.toBe(1);
    clock += 59_999;
    await expect(cache.get(load)).resolves.toBe(1);
    clock += 1;
    await expect(cache.get(load)).resolves.toBe(2);
    expect(loads).toBe(2);
  });

  it("shares an in-flight load between concurrent callers", async () => {
    let loads = 0;
    let release!: (value: string) => void;
    const cache = createTtlCache<string>(60_000, { now: () => 0 });
    const load = () => {
      loads += 1;
      return new Promise<string>((resolve) => {
        release = resolve;
      });
    };

    const first = cache.get(load);
    const second = cache.get(load);
    release("ready");
    await expect(first).resolves.toBe("ready");
    await expect(second).resolves.toBe("ready");
    expect(loads).toBe(1);
  });

  it("does not keep a failed load", async () => {
    let loads = 0;
    const cache = createTtlCache<number>(60_000, { now: () => 0 });
    await expect(
      cache.get(async () => {
        loads += 1;
        throw new Error("database away");
      }),
    ).rejects.toThrow("database away");
    await expect(cache.get(async () => ++loads)).resolves.toBe(2);
  });

  it("clears on demand", async () => {
    let loads = 0;
    const cache = createTtlCache<number>(60_000, { now: () => 0 });
    await cache.get(async () => ++loads);
    cache.clear();
    await expect(cache.get(async () => ++loads)).resolves.toBe(2);
  });

  describe("stale while revalidate", () => {
    it("serves the expired value at once and installs the fresh one when it lands", async () => {
      let clock = 0;
      let loads = 0;
      const cache = createTtlCache<number>(1_000, { now: () => clock, staleWhileRevalidate: true });
      const load = async () => ++loads;

      await expect(cache.get(load)).resolves.toBe(1);
      clock = 5_000;
      // Expired: the reader gets the old figure without waiting.
      await expect(cache.get(load)).resolves.toBe(1);
      expect(loads).toBe(2); // one refresh started
      await flush();
      await expect(cache.get(load)).resolves.toBe(2);
      expect(loads).toBe(2); // the fresh entry is current again; no third load
    });

    it("starts only one refresh however many readers arrive", async () => {
      let clock = 0;
      let loads = 0;
      let release!: (value: number) => void;
      const cache = createTtlCache<number>(1_000, { now: () => clock, staleWhileRevalidate: true });
      await cache.get(async () => ++loads);
      clock = 5_000;
      const slow = () => {
        loads += 1;
        return new Promise<number>((resolve) => {
          release = resolve;
        });
      };
      await expect(cache.get(slow)).resolves.toBe(1);
      await expect(cache.get(slow)).resolves.toBe(1);
      await expect(cache.get(slow)).resolves.toBe(1);
      expect(loads).toBe(2);
      release(7);
      await flush();
      await expect(cache.get(slow)).resolves.toBe(7);
    });

    it("keeps the stale value when the refresh fails", async () => {
      let clock = 0;
      const cache = createTtlCache<number>(1_000, { now: () => clock, staleWhileRevalidate: true });
      await cache.get(async () => 1);
      clock = 5_000;
      await expect(
        cache.get(async () => {
          throw new Error("database away");
        }),
      ).resolves.toBe(1);
      await flush();
      // Still stale, still served; the next reader tries again.
      let loads = 0;
      await expect(cache.get(async () => ++loads + 10)).resolves.toBe(1);
      expect(loads).toBe(1);
    });

    it("does not reinstate a refresh that began before a clear", async () => {
      let clock = 0;
      const cache = createTtlCache<number>(1_000, { now: () => clock, staleWhileRevalidate: true });
      await cache.get(async () => 1);
      clock = 5_000;
      let release!: (value: number) => void;
      await expect(
        cache.get(
          () =>
            new Promise<number>((resolve) => {
              release = resolve;
            }),
        ),
      ).resolves.toBe(1);
      cache.clear();
      release(2); // the old refresh lands after the clear
      await flush();
      // A reader after the clear loads anew rather than seeing the pre-clear refresh.
      await expect(cache.get(async () => 3)).resolves.toBe(3);
    });

    it("waits for the load when nothing has ever settled", async () => {
      const cache = createTtlCache<number>(1_000, { now: () => 0, staleWhileRevalidate: true });
      await expect(cache.get(async () => 42)).resolves.toBe(42);
    });
  });
});
