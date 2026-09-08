import { PublicContentStatus, PublicContentType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  EDITABLE_STATUSES,
  FAMILIES,
  TRANSITIONS,
  allowedDocumentHosts,
  familyOf,
  isAllowedDocumentUrl,
  isTimeValid,
  validateDraft,
} from "./families";

const newsInput = {
  slug: "annual-update-2026",
  title: "Annual update",
  summary: "A short summary of the update for listings.",
  sourceReference: null,
  effectiveAt: null,
  expiresAt: null,
  payload: {
    date: "2026-09-01",
    body: ["First paragraph.", "Second paragraph."],
    source: { label: "Newswire", href: "https://www.newswire.ca/x" },
    related: [],
  },
};

describe("draft validation", () => {
  it("accepts a well-formed news draft and stamps revision and reviewer from the workflow, not the form", () => {
    const draft = validateDraft(
      "news",
      { ...newsInput, payload: { ...newsInput.payload, revision: 99, reviewerId: "forged" } },
      { revision: 3, reviewerId: null },
    );
    expect(draft.payload).toMatchObject({ kind: "news", revision: 3, reviewerId: null });
    expect(draft.slug).toBe("annual-update-2026");
  });

  it("rejects an http source, a bad slug, an expiry before the effective date, and an unknown payload field", () => {
    expect(() =>
      validateDraft(
        "news",
        {
          ...newsInput,
          payload: { ...newsInput.payload, source: { label: "x", href: "http://insecure" } },
        },
        { revision: 1, reviewerId: null },
      ),
    ).toThrow();
    expect(() =>
      validateDraft("news", { ...newsInput, slug: "Bad Slug" }, { revision: 1, reviewerId: null }),
    ).toThrow();
    expect(() =>
      validateDraft(
        "news",
        { ...newsInput, effectiveAt: "2026-09-02T00:00:00Z", expiresAt: "2026-09-01T00:00:00Z" },
        { revision: 1, reviewerId: null },
      ),
    ).toThrow(/Expiry/);
    expect(() =>
      validateDraft(
        "news",
        { ...newsInput, payload: { ...newsInput.payload, price: "$10" } },
        { revision: 1, reviewerId: null },
      ),
    ).toThrow();
  });

  it("requires author, reviewer, and both dates on a resource", () => {
    const base = { ...newsInput, payload: { body: ["Guidance."], action: "discuss_program" } };
    expect(() => validateDraft("resource", base, { revision: 1, reviewerId: null })).toThrow();
    const ok = validateDraft(
      "resource",
      {
        ...base,
        payload: {
          ...base.payload,
          author: "A. Person",
          reviewer: "B. Person",
          published: "2026-09-01",
          reviewed: "2026-09-02",
        },
      },
      { revision: 1, reviewerId: null },
    );
    expect(ok.payload.kind).toBe("resource");
  });
});

describe("family mapping", () => {
  it("maps resources onto corporate_page rows by payload kind, and ignores other rows", () => {
    expect(familyOf({ contentType: PublicContentType.news_item, payload: { kind: "news" } })).toBe(
      "news",
    );
    expect(
      familyOf({ contentType: PublicContentType.corporate_page, payload: { kind: "resource" } }),
    ).toBe("resource");
    expect(
      familyOf({ contentType: PublicContentType.corporate_page, payload: { kind: "page" } }),
    ).toBeNull();
    expect(familyOf({ contentType: PublicContentType.news_item, payload: null })).toBeNull();
    expect(FAMILIES.resource.contentType).toBe(PublicContentType.corporate_page);
  });
});

describe("state machine", () => {
  it("only publishes from approved, only approves from under review, and archives from anywhere but archived", () => {
    expect(TRANSITIONS.publish.from).toEqual([PublicContentStatus.approved]);
    expect(TRANSITIONS.approve.from).toEqual([PublicContentStatus.under_review]);
    expect(TRANSITIONS.archive.from).not.toContain(PublicContentStatus.archived);
    expect(TRANSITIONS.unpublish.to).toBe(PublicContentStatus.approved);
    expect(EDITABLE_STATUSES).toEqual([
      PublicContentStatus.draft,
      PublicContentStatus.under_review,
    ]);
  });
});

describe("time validity", () => {
  const now = new Date("2026-09-08T12:00:00Z");
  it("shows only published rows inside their window; expiry is exclusive, effective is inclusive", () => {
    const row = (
      overrides: Partial<{
        status: PublicContentStatus;
        effectiveAt: Date | null;
        expiresAt: Date | null;
      }>,
    ) => ({
      status: PublicContentStatus.published,
      effectiveAt: null,
      expiresAt: null,
      ...overrides,
    });
    expect(isTimeValid(row({}), now)).toBe(true);
    expect(isTimeValid(row({ status: PublicContentStatus.approved }), now)).toBe(false);
    expect(isTimeValid(row({ status: PublicContentStatus.archived }), now)).toBe(false);
    expect(isTimeValid(row({ effectiveAt: new Date("2026-09-09T00:00:00Z") }), now)).toBe(false);
    expect(isTimeValid(row({ effectiveAt: now }), now)).toBe(true);
    expect(isTimeValid(row({ expiresAt: now }), now)).toBe(false);
    expect(isTimeValid(row({ expiresAt: new Date("2026-09-08T12:00:01Z") }), now)).toBe(true);
  });
});

describe("document hosts", () => {
  it("accepts only https URLs on the configured allowlist, and nothing when the list is empty", () => {
    expect(allowedDocumentHosts({})).toEqual([]);
    expect(isAllowedDocumentUrl("https://files.example.com/a.pdf", [])).toBe(false);
    const hosts = allowedDocumentHosts({
      PUBLIC_DOCUMENT_HOSTS: "Files.Example.com, other.example.org",
    });
    expect(hosts).toEqual(["files.example.com", "other.example.org"]);
    expect(isAllowedDocumentUrl("https://files.example.com/a.pdf", hosts)).toBe(true);
    expect(isAllowedDocumentUrl("http://files.example.com/a.pdf", hosts)).toBe(false);
    expect(isAllowedDocumentUrl("https://evil.example.net/a.pdf", hosts)).toBe(false);
    expect(isAllowedDocumentUrl("not a url", hosts)).toBe(false);
    expect(isAllowedDocumentUrl(null, hosts)).toBe(false);
  });
});
