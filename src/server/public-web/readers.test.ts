import { PublicContentStatus, PublicContentType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  publicContentItem: { findMany: vi.fn() },
  publicDocument: { findMany: vi.fn(), findFirst: vi.fn() },
}));
const captureMessage = vi.hoisted(() => vi.fn());
vi.mock("@/server/db/client", () => ({ prisma: db }));
vi.mock("@/server/logger/error-tracking", () => ({ captureMessage, captureException: vi.fn() }));

import {
  getPublishedNewsItem,
  listPublishedDocuments,
  listPublishedNewsItems,
  listPublishedResources,
  projectDocument,
  publishedWindowWhere,
  resolvePublishedDocumentFile,
} from "./readers";

const NOW = new Date("2026-09-08T12:00:00Z");

function published(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    slug: "update",
    title: "Update",
    summary: "Summary text.",
    contentType: PublicContentType.news_item,
    payload: {
      kind: "news",
      date: "2026-09-01",
      body: ["Body."],
      source: null,
      related: [],
      revision: 1,
      reviewerId: "u2",
    },
    status: PublicContentStatus.published,
    effectiveAt: null,
    expiresAt: null,
    publishedAt: NOW,
    preparedById: "u1",
    approvedById: "u2",
    ...overrides,
  };
}

beforeEach(() => {
  db.publicContentItem.findMany.mockReset();
  db.publicDocument.findMany.mockReset();
  db.publicDocument.findFirst.mockReset();
  captureMessage.mockReset();
  delete process.env.PUBLIC_DOCUMENT_HOSTS;
});

describe("published-only projection", () => {
  it("queries only published rows inside their effective window", async () => {
    db.publicContentItem.findMany.mockResolvedValue([]);
    await listPublishedNewsItems(NOW);
    const where = db.publicContentItem.findMany.mock.calls[0]![0].where;
    expect(where).toMatchObject({ contentType: "news_item", ...publishedWindowWhere(NOW) });
    expect(where.status).toBe("published");
  });

  it("projects a row to the strict DTO with no identifiers, actors, or statuses", async () => {
    db.publicContentItem.findMany.mockResolvedValue([published()]);
    const [item] = await listPublishedNewsItems(NOW);
    expect(item).toEqual({
      slug: "update",
      title: "Update",
      summary: "Summary text.",
      date: "2026-09-01",
      body: ["Body."],
      source: null,
      related: [],
    });
    expect(Object.keys(item!)).not.toContain("id");
    expect(JSON.stringify(item)).not.toMatch(/u1|u2|revision|status|preparedBy/);
  });

  it("excludes an expired or not-yet-effective row even if the database returned it, and skips an invalid payload", async () => {
    db.publicContentItem.findMany.mockResolvedValue([
      published({ id: "expired", slug: "expired", expiresAt: new Date("2026-09-08T11:59:59Z") }),
      published({ id: "future", slug: "future", effectiveAt: new Date("2026-09-09T00:00:00Z") }),
      published({ id: "broken", slug: "broken", payload: { kind: "news", revision: 1 } }),
      published({ id: "ok", slug: "ok" }),
    ]);
    const items = await listPublishedNewsItems(NOW);
    expect(items.map((item) => item.slug)).toEqual(["ok"]);
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage.mock.calls[0]![1]).toMatchObject({ id: "broken" });
  });

  it("returns null for a slug that is not published (a withdrawn item disappears)", async () => {
    db.publicContentItem.findMany.mockResolvedValue([]);
    expect(await getPublishedNewsItem("gone", NOW)).toBeNull();
  });

  it("reads resources from corporate_page rows carrying the resource kind", async () => {
    db.publicContentItem.findMany.mockResolvedValue([
      published({
        contentType: PublicContentType.corporate_page,
        payload: {
          kind: "resource",
          body: ["Guidance."],
          author: "A. Person",
          reviewer: "B. Person",
          published: "2026-09-01",
          reviewed: "2026-09-02",
          action: "discuss_program",
          revision: 1,
          reviewerId: null,
        },
      }),
    ]);
    const [item] = await listPublishedResources(NOW);
    expect(item).toMatchObject({
      author: "A. Person",
      reviewer: "B. Person",
      action: "discuss_program",
    });
    expect(db.publicContentItem.findMany.mock.calls[0]![0].where.contentType).toBe(
      "corporate_page",
    );
  });
});

describe("documents", () => {
  const doc = {
    id: "d1",
    title: "Report",
    documentType: "annual_report",
    periodLabel: "FY2025",
    publicUrl: "https://files.example.com/report.pdf",
    disclosureText: null,
    sourceReference: null,
    publishedAt: NOW,
  };

  it("exposes a download path only when the file host is approved", () => {
    expect(projectDocument(doc).downloadPath).toBeNull();
    process.env.PUBLIC_DOCUMENT_HOSTS = "files.example.com";
    expect(projectDocument(doc).downloadPath).toBe("/api/public/v1/documents/d1/file");
    expect(projectDocument({ ...doc, publicUrl: null }).downloadPath).toBeNull();
  });

  it("lists only published documents and never the raw URL", async () => {
    process.env.PUBLIC_DOCUMENT_HOSTS = "files.example.com";
    db.publicDocument.findMany.mockResolvedValue([doc]);
    const [item] = await listPublishedDocuments();
    expect(db.publicDocument.findMany.mock.calls[0]![0].where.status).toBe("published");
    expect(JSON.stringify(item)).not.toContain("files.example.com");
  });

  it("resolves a file only for a published document on an approved host; anything else is nothing", async () => {
    process.env.PUBLIC_DOCUMENT_HOSTS = "files.example.com";
    db.publicDocument.findFirst.mockResolvedValue(null);
    expect(await resolvePublishedDocumentFile("guess")).toBeNull();
    expect(db.publicDocument.findFirst.mock.calls[0]![0].where.status).toBe("published");
    db.publicDocument.findFirst.mockResolvedValue({
      ...doc,
      publicUrl: "https://elsewhere.example.net/x.pdf",
    });
    expect(await resolvePublishedDocumentFile("d1")).toBeNull();
    db.publicDocument.findFirst.mockResolvedValue(doc);
    expect(await resolvePublishedDocumentFile("d1")).toEqual({
      url: doc.publicUrl,
      title: "Report",
    });
  });
});
