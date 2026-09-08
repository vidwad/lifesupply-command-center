import { describe, expect, it } from "vitest";

import {
  DEFAULT_RETENTION_DAYS,
  INQUIRY_INTENTS,
  InquiryValidationError,
  OWNER_CHANNELS,
  PERSISTED_INTENTS,
  clientHash,
  newReference,
  redactForLog,
  resolveOwnerChannel,
  retentionUntil,
  validateInquiry,
} from "./contract";

const valid = {
  intent: "clinic_development",
  sourceBrand: "corporate",
  sourcePath: "/clinic-solutions/design-build/",
  contact: {
    name: "Dr. Example",
    email: "Clinic@Example.com",
    organization: "Example Clinic",
    region: "BC",
  },
  fields: { clinicType: "Family practice", location: "Surrey, BC", currentStage: "Planning" },
  consent: { serviceResponse: true, marketing: false },
  idempotencyKey: "abcdefghijklmnop1234",
};

describe("inquiry validation", () => {
  it("accepts a valid submission, lower-cases the email, and keeps the eleven intents", () => {
    const request = validateInquiry(valid);
    expect(request.contact.email).toBe("clinic@example.com");
    expect(INQUIRY_INTENTS).toHaveLength(11);
    expect(PERSISTED_INTENTS).toHaveLength(10);
  });

  it("refuses the existing-order intent: it goes to the originating store, never the queue", () => {
    expect(() => validateInquiry({ ...valid, intent: "existing_order_support" })).toThrow(
      /store that took the order/,
    );
  });

  it("refuses any browser-provided recipient, redirect, owner, or record id", () => {
    for (const key of [
      "to",
      "recipient",
      "recipients",
      "cc",
      "bcc",
      "redirect",
      "redirectUrl",
      "returnUrl",
      "id",
      "assignedTo",
      "owner",
    ]) {
      expect(() => validateInquiry({ ...valid, [key]: "attacker@example.net" }), key).toThrow(
        InquiryValidationError,
      );
    }
    // Unknown keys are refused too, at every level.
    expect(() => validateInquiry({ ...valid, extra: 1 })).toThrow();
    expect(() => validateInquiry({ ...valid, contact: { ...valid.contact, to: "x" } })).toThrow();
    expect(() =>
      validateInquiry({ ...valid, consent: { serviceResponse: true, marketing: false, to: "x" } }),
    ).toThrow();
  });

  it("refuses fields that are not allowlisted for the intent, and free text over the limit", () => {
    expect(() => validateInquiry({ ...valid, fields: { ...valid.fields, purpose: "x" } })).toThrow(
      /Not a field/,
    );
    expect(() => validateInquiry({ ...valid, fields: { clinicType: "x".repeat(501) } })).toThrow();
    expect(() =>
      validateInquiry({ ...valid, intent: "shareholder", fields: { purpose: "Address change" } }),
    ).not.toThrow();
  });

  it("requires the service-response consent and keeps marketing separate and optional", () => {
    expect(() => validateInquiry({ ...valid, consent: { serviceResponse: false } })).toThrow();
    expect(() => validateInquiry({ ...valid, consent: { marketing: true } })).toThrow();
    expect(
      validateInquiry({ ...valid, consent: { serviceResponse: true } }).consent.marketing,
    ).toBeUndefined();
  });

  it("refuses a source path with a host, a query string, or a fragment, and a filled honeypot", () => {
    for (const sourcePath of ["https://x/y", "/contact/?email=a@b.c", "/contact/#x", "contact"]) {
      expect(() => validateInquiry({ ...valid, sourcePath }), sourcePath).toThrow();
    }
    expect(() => validateInquiry({ ...valid, website: "http://spam" })).toThrow();
    expect(() => validateInquiry({ ...valid, website: "" })).not.toThrow();
  });

  it("refuses a malformed idempotency key and an invalid email, and non-object bodies", () => {
    expect(() => validateInquiry({ ...valid, idempotencyKey: "short" })).toThrow();
    expect(() =>
      validateInquiry({ ...valid, contact: { ...valid.contact, email: "not-an-email" } }),
    ).toThrow();
    expect(() => validateInquiry(null)).toThrow();
    expect(() => validateInquiry([valid])).toThrow();
  });
});

describe("server-side derivations", () => {
  it("maps every persisted intent to an approved directory channel, ignoring anything in the body", () => {
    for (const intent of PERSISTED_INTENTS) {
      expect(resolveOwnerChannel(intent)).toMatch(/^(info|ben|invest|abdul)@lifesupply\.com$/);
    }
    expect(Object.keys(OWNER_CHANNELS)).toHaveLength(10);
  });

  it("derives retention from the receive time and the configured days", () => {
    const received = new Date("2026-09-08T00:00:00Z");
    expect(retentionUntil(received, {}).getTime() - received.getTime()).toBe(
      DEFAULT_RETENTION_DAYS * 86_400_000,
    );
    expect(
      retentionUntil(received, { PUBLIC_INQUIRY_RETENTION_DAYS: "30" }).getTime() -
        received.getTime(),
    ).toBe(30 * 86_400_000);
  });

  it("issues references that are not derived from ids and hashes addresses with a salt", () => {
    expect(newReference()).toMatch(/^LS-[0-9A-F]{8}$/);
    expect(newReference()).not.toBe(newReference());
    expect(clientHash("203.0.113.9", { PUBLIC_INQUIRY_HASH_SALT: "a" })).not.toBe(
      clientHash("203.0.113.9", { PUBLIC_INQUIRY_HASH_SALT: "b" }),
    );
    expect(clientHash("203.0.113.9")).not.toContain("203.0.113");
  });

  it("redacts a record to identifiers and classification only", () => {
    const redacted = redactForLog({
      id: "i1",
      reference: "LS-1",
      intent: "general",
      sourceBrand: "corporate",
      status: "received",
    });
    expect(Object.keys(redacted).sort()).toEqual([
      "id",
      "intent",
      "reference",
      "sourceBrand",
      "status",
    ]);
  });
});
