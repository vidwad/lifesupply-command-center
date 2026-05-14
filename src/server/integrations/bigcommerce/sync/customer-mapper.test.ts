/**
 * Unit tests for the BC customer → Prisma upsert mapper.
 *
 * Covers the conflict policy: BC-owned fields appear in BOTH create and
 * update payloads; CC-owned fields appear ONLY in create (so Prisma upsert
 * preserves them on existing rows).
 */
import { describe, expect, it } from "vitest";

import { mapBcCustomerToUpsert, type BcCustomerPayload } from "./customer-mapper";

const baseBc: BcCustomerPayload = {
  id: 42,
  email: "Alice@Example.com",
  first_name: "Alice",
  last_name: "Anders",
  company: "Acme Co",
  phone: "555-1212",
  customer_group_id: 8,
  tax_exempt_category: null,
  date_created: "2024-01-15T00:00:00+00:00",
  date_modified: "2025-09-09T12:00:00+00:00",
};

describe("mapBcCustomerToUpsert", () => {
  it("populates BC-owned fields in both create and update payloads", () => {
    const { create, update } = mapBcCustomerToUpsert(baseBc, {
      storeId: "store-1",
      divisionId: "div-1",
      aggregate: undefined,
    });

    for (const payload of [create, update]) {
      expect(payload.email).toBe("alice@example.com"); // lowercased
      expect(payload.firstName).toBe("Alice");
      expect(payload.lastName).toBe("Anders");
      expect(payload.companyName).toBe("Acme Co");
      expect(payload.phone).toBe("555-1212");
    }
  });

  it("sets CC-owned defaults ONLY on create — never on update", () => {
    const { create, update } = mapBcCustomerToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      aggregate: undefined,
    });

    expect(create.customerType).toBe("unknown");
    expect(create.consentStatus).toBe("unknown");

    // The whole point: update payload OMITS these so Prisma preserves them.
    expect(update).not.toHaveProperty("customerType");
    expect(update).not.toHaveProperty("consentStatus");
    expect(update).not.toHaveProperty("mailchimpStatus");
    expect(update).not.toHaveProperty("reactivationScore");
    expect(update).not.toHaveProperty("notes");
    expect(update).not.toHaveProperty("billingAddress");
    expect(update).not.toHaveProperty("shippingAddress");
  });

  it("populates aggregate-derived fields in both create and update", () => {
    const aggregate = {
      count: 7,
      spend: 1234.56,
      firstMs: new Date("2024-03-01T00:00:00Z").getTime(),
      lastMs: new Date("2025-08-15T00:00:00Z").getTime(),
    };
    const { create, update } = mapBcCustomerToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      aggregate,
    });

    for (const payload of [create, update]) {
      expect(payload.lifetimeValue).toBe(1234.56);
      expect(payload.orderCount).toBe(7);
      expect(payload.firstOrderAt).toEqual(new Date("2024-03-01T00:00:00Z"));
      expect(payload.lastOrderAt).toEqual(new Date("2025-08-15T00:00:00Z"));
    }
  });

  it("zeros aggregate fields when no aggregate supplied", () => {
    const { create, update } = mapBcCustomerToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      aggregate: undefined,
    });

    for (const payload of [create, update]) {
      expect(payload.lifetimeValue).toBe(0);
      expect(payload.orderCount).toBe(0);
      expect(payload.firstOrderAt).toBeNull();
      expect(payload.lastOrderAt).toBeNull();
    }
  });

  it("trims and null-coalesces empty/whitespace strings", () => {
    const { create } = mapBcCustomerToUpsert(
      { ...baseBc, email: "  ", first_name: "", company: "  Acme  " },
      { storeId: "s1", divisionId: null, aggregate: undefined },
    );
    expect(create.email).toBeNull();
    expect(create.firstName).toBeNull();
    expect(create.companyName).toBe("Acme");
  });

  it("uses bigcommerce as sourceSystem and stringifies the BC id", () => {
    const { create } = mapBcCustomerToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      aggregate: undefined,
    });
    expect(create.sourceSystem).toBe("bigcommerce");
    expect(create.sourceId).toBe("42");
  });

  it("attaches the raw BC payload + ISO sync timestamp to metadata", () => {
    const { create, update } = mapBcCustomerToUpsert(baseBc, {
      storeId: "s1",
      divisionId: null,
      aggregate: undefined,
    });
    for (const payload of [create, update]) {
      const meta = payload.metadata as { bcRaw: unknown; bcSyncedAt: string };
      expect(meta.bcRaw).toEqual(baseBc);
      expect(meta.bcSyncedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});
