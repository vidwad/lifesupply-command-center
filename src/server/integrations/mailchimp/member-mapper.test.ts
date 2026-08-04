import { describe, expect, it } from "vitest";

import {
  abuseComplaintPatch,
  mapMemberToConsentPatch,
  normalizeEmail,
  tagNames,
  type MailchimpMember,
} from "./member-mapper";

function member(over: Partial<MailchimpMember> = {}): MailchimpMember {
  return {
    id: "abc123",
    email_address: "Buyer@Example.com",
    status: "subscribed",
    timestamp_opt: "2025-03-01T10:00:00+00:00",
    last_changed: "2026-01-15T08:30:00+00:00",
    tags: [{ id: 1, name: "b2b" }, { id: 2, name: " clinic " }, { name: "" }],
    merge_fields: { FNAME: "Pat" },
    ...over,
  };
}

describe("normalizeEmail / tagNames", () => {
  it("normalizes emails and trims tag names", () => {
    expect(normalizeEmail(" A@B.com ")).toBe("a@b.com");
    expect(normalizeEmail("")).toBeNull();
    expect(tagNames(member())).toEqual(["b2b", "clinic"]);
  });
});

describe("mapMemberToConsentPatch", () => {
  it("subscribed → express consent from Mailchimp, suppression cleared", () => {
    const p = mapMemberToConsentPatch(member());
    expect(p).toMatchObject({
      consentStatus: "subscribed",
      consentBasis: "express",
      consentSource: "mailchimp",
      suppressionReason: null,
      suppressedAt: null,
      mailchimpStatus: "subscribed",
    });
    expect(p?.consentObtainedAt?.toISOString()).toBe("2025-03-01T10:00:00.000Z");
    expect(p?.consentExpiresAt).toBeNull(); // express never expires
  });

  it("subscribed without timestamp_opt falls back to last_changed", () => {
    const p = mapMemberToConsentPatch(member({ timestamp_opt: null }));
    expect(p?.consentObtainedAt?.toISOString()).toBe("2026-01-15T08:30:00.000Z");
  });

  it("unsubscribed → suppressed with reason + timestamp", () => {
    const p = mapMemberToConsentPatch(member({ status: "unsubscribed" }));
    expect(p).toMatchObject({
      consentStatus: "unsubscribed",
      suppressionReason: "mailchimp_unsubscribed",
    });
    expect(p?.suppressedAt?.toISOString()).toBe("2026-01-15T08:30:00.000Z");
    // Does NOT touch consent basis/source — evidence of past consent remains.
    expect(p).not.toHaveProperty("consentBasis");
  });

  it("cleaned → suppressed as bounced", () => {
    const p = mapMemberToConsentPatch(member({ status: "cleaned" }));
    expect(p).toMatchObject({
      consentStatus: "cleaned",
      suppressionReason: "mailchimp_cleaned_bounced",
    });
  });

  it("pending → pending only (no basis change)", () => {
    const p = mapMemberToConsentPatch(member({ status: "pending" }));
    expect(p).toEqual({ consentStatus: "pending", mailchimpStatus: "pending" });
  });

  it("transactional → transactional_only basis", () => {
    const p = mapMemberToConsentPatch(member({ status: "transactional" }));
    expect(p).toMatchObject({
      consentStatus: "transactional",
      consentBasis: "transactional_only",
      consentSource: "mailchimp",
    });
  });

  it("archived and unknown statuses leave customer consent untouched", () => {
    expect(mapMemberToConsentPatch(member({ status: "archived" }))).toBeNull();
    expect(mapMemberToConsentPatch(member({ status: "surprise" }))).toBeNull();
  });
});

describe("abuseComplaintPatch", () => {
  it("marks the customer complained with the abuse suppression reason", () => {
    const at = new Date("2026-02-02T00:00:00Z");
    expect(abuseComplaintPatch(at)).toEqual({
      consentStatus: "complained",
      suppressionReason: "mailchimp_abuse_complaint",
      suppressedAt: at,
      mailchimpStatus: "complained",
    });
  });
});
