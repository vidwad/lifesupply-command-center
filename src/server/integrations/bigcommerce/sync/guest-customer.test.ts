import { describe, expect, it } from "vitest";

import {
  buildGuestCustomerUpsert,
  GUEST_SOURCE_SYSTEM,
  normalizeEmail,
  resolveOrderCustomerLink,
} from "./guest-customer";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  John.Doe@Example.COM ")).toBe("john.doe@example.com");
  });
  it("returns null for empty / missing", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
});

function maps(over?: {
  registeredByBcId?: [number, string][];
  registeredByEmail?: [string, string][];
  guestByEmail?: [string, string][];
}) {
  return {
    registeredByBcId: new Map(over?.registeredByBcId ?? []),
    registeredByEmail: new Map(over?.registeredByEmail ?? []),
    guestByEmail: new Map(over?.guestByEmail ?? []),
  };
}

describe("resolveOrderCustomerLink", () => {
  it("links a registered order to its synced customer", () => {
    const link = resolveOrderCustomerLink({
      bcCustomerId: 42,
      billingEmail: "whatever@x.com",
      ...maps({ registeredByBcId: [[42, "cust_42"]] }),
    });
    expect(link).toEqual({ kind: "registered", customerId: "cust_42" });
  });

  it("leaves a registered order unlinked when its customer isn't synced yet", () => {
    const link = resolveOrderCustomerLink({
      bcCustomerId: 99,
      billingEmail: "a@b.com",
      ...maps({ registeredByEmail: [["a@b.com", "cust_a"]] }),
    });
    // Does NOT fall back to email for registered orders — avoids mis-attribution.
    expect(link).toEqual({ kind: "unlinked", reason: "customer-not-synced" });
  });

  it("dedups a guest whose email matches a registered customer", () => {
    const link = resolveOrderCustomerLink({
      bcCustomerId: 0,
      billingEmail: "Reg@Example.com",
      ...maps({ registeredByEmail: [["reg@example.com", "cust_reg"]] }),
    });
    expect(link).toEqual({ kind: "guest-registered-dedup", customerId: "cust_reg" });
  });

  it("links a guest to an already-known guest customer", () => {
    const link = resolveOrderCustomerLink({
      bcCustomerId: 0,
      billingEmail: "guest@x.com",
      ...maps({ guestByEmail: [["guest@x.com", "cust_guest"]] }),
    });
    expect(link).toEqual({ kind: "guest-existing", customerId: "cust_guest" });
  });

  it("flags a brand-new guest for creation (normalized email)", () => {
    const link = resolveOrderCustomerLink({
      bcCustomerId: 0,
      billingEmail: "  NEW@Guest.com ",
      ...maps(),
    });
    expect(link).toEqual({ kind: "guest-create", email: "new@guest.com" });
  });

  it("leaves a guest order with no billing email unlinked", () => {
    const link = resolveOrderCustomerLink({ bcCustomerId: 0, billingEmail: null, ...maps() });
    expect(link).toEqual({ kind: "unlinked", reason: "no-email" });
  });

  it("prefers a registered match over a guest match for the same email", () => {
    const link = resolveOrderCustomerLink({
      bcCustomerId: 0,
      billingEmail: "dup@x.com",
      ...maps({
        registeredByEmail: [["dup@x.com", "cust_reg"]],
        guestByEmail: [["dup@x.com", "cust_guest"]],
      }),
    });
    expect(link).toEqual({ kind: "guest-registered-dedup", customerId: "cust_reg" });
  });
});

describe("buildGuestCustomerUpsert", () => {
  const built = buildGuestCustomerUpsert({
    email: "guest@x.com",
    identity: { firstName: "Guest", lastName: "Buyer", companyName: null, phone: "555" },
    storeId: "store_1",
    divisionId: "div_1",
    sourceOrderId: 1234,
  });

  it("keys the guest under the guest source system + email", () => {
    expect(built.create.sourceSystem).toBe(GUEST_SOURCE_SYSTEM);
    expect(built.create.sourceId).toBe("guest@x.com");
    expect(built.create.email).toBe("guest@x.com");
    expect(built.create.storeId).toBe("store_1");
  });

  it("sets CC-owned defaults on create only, not on update", () => {
    expect(built.create.customerType).toBe("unknown");
    expect(built.create.consentStatus).toBe("unknown");
    expect(built.update).not.toHaveProperty("customerType");
    expect(built.update).not.toHaveProperty("consentStatus");
    expect(built.update).not.toHaveProperty("sourceSystem");
  });

  it("refreshes identity on both create and update", () => {
    expect(built.create.firstName).toBe("Guest");
    expect(built.update.firstName).toBe("Guest");
    expect(built.update.phone).toBe("555");
  });

  it("marks the record as a guest in metadata with traceability", () => {
    const meta = built.create.metadata as Record<string, unknown>;
    expect(meta.guest).toBe(true);
    expect(meta.source).toBe(GUEST_SOURCE_SYSTEM);
    expect(meta.identityFromBcOrderId).toBe(1234);
  });
});
