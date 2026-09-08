import { beforeEach, describe, expect, it, vi } from "vitest";

const writeAudit = vi.hoisted(() => vi.fn());
const captureException = vi.hoisted(() => vi.fn());
vi.mock("@/server/audit", () => ({ writeAudit }));
vi.mock("@/server/logger/error-tracking", () => ({ captureException, captureMessage: vi.fn() }));
vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/server/services/feature-flags", () => ({
  isFeatureOn: vi.fn().mockResolvedValue(false),
}));

import { FixedWindowRateLimiter } from "./abuse";
import { receiveInquiry } from "./intake";
import { MemoryInquiryStore, type InquiryStore } from "./store";

const ORIGIN = "https://lifesupplyhealth.com";
process.env.PUBLIC_SITE_ORIGINS = ORIGIN;

const body = {
  intent: "supplier",
  sourceBrand: "corporate",
  sourcePath: "/partners/suppliers/",
  contact: {
    name: "Supplier Person",
    email: "supplier@example.com",
    organization: "Example Supply Co.",
  },
  fields: { categories: "Wound care", regions: "Canada" },
  consent: { serviceResponse: true },
  idempotencyKey: "supplier-key-0000000001",
};

function headers(extra: Record<string, string> = {}) {
  return new Headers({ origin: ORIGIN, "x-forwarded-for": "203.0.113.5", ...extra });
}

function deps(store: InquiryStore, overrides: Partial<Parameters<typeof receiveInquiry>[1]> = {}) {
  return {
    store,
    limiter: new FixedWindowRateLimiter(60_000, 5),
    flagOn: async () => true,
    ...overrides,
  };
}

beforeEach(() => {
  writeAudit.mockReset();
  captureException.mockReset();
});

describe("single persistence per valid submission", () => {
  it("stores exactly one record, audits it without contact data, and returns a reference", async () => {
    const store = new MemoryInquiryStore();
    const result = await receiveInquiry({ body, bodyBytes: 500, headers: headers() }, deps(store));
    expect(result).toMatchObject({ ok: true, duplicate: false });
    expect(store.size()).toBe(1);
    const [record] = await store.list();
    expect(record!.ownerChannel).toBe("info@lifesupply.com");
    expect(record!.clientHash).not.toContain("203.0.113");
    expect(record!.consentMarketing).toBe(false);
    expect(record!.acknowledgment.state).toBe("pending");
    expect(writeAudit).toHaveBeenCalledTimes(1);
    const audit = JSON.stringify(writeAudit.mock.calls[0]![0]);
    expect(audit).toContain("public_inquiry.received");
    expect(audit).not.toMatch(/supplier@example\.com|Supplier Person|Example Supply/);
  });

  it("returns the same reference for a retry with the same idempotency key, without a second record or audit", async () => {
    const store = new MemoryInquiryStore();
    const first = await receiveInquiry({ body, bodyBytes: 500, headers: headers() }, deps(store));
    const second = await receiveInquiry({ body, bodyBytes: 500, headers: headers() }, deps(store));
    expect(second).toEqual({
      ok: true,
      reference: (first as { reference: string }).reference,
      duplicate: true,
    });
    expect(store.size()).toBe(1);
    expect(writeAudit).toHaveBeenCalledTimes(1);
  });

  it("stores two records for two different keys from the same visitor", async () => {
    const store = new MemoryInquiryStore();
    await receiveInquiry({ body, bodyBytes: 500, headers: headers() }, deps(store));
    await receiveInquiry(
      {
        body: { ...body, idempotencyKey: "supplier-key-0000000002" },
        bodyBytes: 500,
        headers: headers(),
      },
      deps(store),
    );
    expect(store.size()).toBe(2);
  });
});

describe("invalid and abusive requests fail safely", () => {
  it("refuses an oversized body before parsing", async () => {
    const store = new MemoryInquiryStore();
    expect(
      await receiveInquiry({ body: null, bodyBytes: 20_000, headers: headers() }, deps(store)),
    ).toEqual({ ok: false, reason: "too_large" });
    expect(store.size()).toBe(0);
  });

  it("refuses a cross-origin or origin-less POST", async () => {
    const store = new MemoryInquiryStore();
    expect(
      await receiveInquiry(
        { body, bodyBytes: 500, headers: new Headers({ origin: "https://evil.example.net" }) },
        deps(store),
      ),
    ).toEqual({ ok: false, reason: "forbidden_origin" });
    expect(
      await receiveInquiry({ body, bodyBytes: 500, headers: new Headers() }, deps(store)),
    ).toEqual({ ok: false, reason: "forbidden_origin" });
    expect(store.size()).toBe(0);
  });

  it("refuses an invalid body with field issues and no visitor data echoed", async () => {
    const store = new MemoryInquiryStore();
    const result = await receiveInquiry(
      { body: { ...body, to: "attacker@example.net" }, bodyBytes: 500, headers: headers() },
      deps(store),
    );
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(JSON.stringify(result)).not.toContain("attacker@example.net");
    expect(store.size()).toBe(0);
  });

  it("refuses the existing-order intent", async () => {
    const store = new MemoryInquiryStore();
    const result = await receiveInquiry(
      {
        body: { ...body, intent: "existing_order_support", fields: {} },
        bodyBytes: 500,
        headers: headers(),
      },
      deps(store),
    );
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(store.size()).toBe(0);
  });

  it("rate-limits a hashed address after the allowance", async () => {
    const store = new MemoryInquiryStore();
    const limiter = new FixedWindowRateLimiter(60_000, 2);
    for (let index = 0; index < 2; index += 1) {
      const result = await receiveInquiry(
        {
          body: { ...body, idempotencyKey: `supplier-key-00000000${index}x` },
          bodyBytes: 500,
          headers: headers(),
        },
        deps(store, { limiter }),
      );
      expect(result.ok).toBe(true);
    }
    const blocked = await receiveInquiry(
      {
        body: { ...body, idempotencyKey: "supplier-key-0000000099" },
        bodyBytes: 500,
        headers: headers(),
      },
      deps(store, { limiter }),
    );
    expect(blocked).toEqual({ ok: false, reason: "rate_limited" });
    expect(store.size()).toBe(2);
  });

  it("reads a failed flag lookup as disabled rather than failing open or crashing", async () => {
    const store = new MemoryInquiryStore();
    const result = await receiveInquiry(
      { body, bodyBytes: 500, headers: headers() },
      deps(store, {
        flagOn: async () => {
          throw new Error("no database");
        },
      }),
    );
    expect(result).toEqual({ ok: false, reason: "disabled" });
    expect(store.size()).toBe(0);
  });

  it("refuses everything while the intake flag is off, before any storage", async () => {
    const store = new MemoryInquiryStore();
    expect(
      await receiveInquiry(
        { body, bodyBytes: 500, headers: headers() },
        deps(store, { flagOn: async () => false }),
      ),
    ).toEqual({ ok: false, reason: "disabled" });
    expect(store.size()).toBe(0);
  });
});

describe("no success without persistence", () => {
  it("answers unavailable when the table is not provisioned", async () => {
    const store = new MemoryInquiryStore(false);
    expect(await receiveInquiry({ body, bodyBytes: 500, headers: headers() }, deps(store))).toEqual(
      { ok: false, reason: "unavailable" },
    );
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("answers unavailable when the store throws, logs only the class, and writes no received event", async () => {
    const store: InquiryStore = {
      isReady: async () => true,
      createIfAbsent: async () => {
        throw new Error("connection refused 10.0.0.5");
      },
      get: async () => null,
      list: async () => [],
      update: async () => null,
    };
    expect(await receiveInquiry({ body, bodyBytes: 500, headers: headers() }, deps(store))).toEqual(
      { ok: false, reason: "unavailable" },
    );
    expect(writeAudit).not.toHaveBeenCalled();
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(captureException.mock.calls[0]![1])).not.toMatch(
      /supplier@example|Supplier Person/,
    );
  });
});
