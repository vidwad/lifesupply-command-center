import { beforeEach, describe, expect, it, vi } from "vitest";

const readers = vi.hoisted(() => ({
  listPublishedNewsItems: vi.fn(),
  getPublishedNewsItem: vi.fn(),
  listPublishedResources: vi.fn(),
  getPublishedResource: vi.fn(),
  listPublishedDocuments: vi.fn(),
  resolvePublishedDocumentFile: vi.fn(),
}));
const captureException = vi.hoisted(() => vi.fn());
vi.mock("@/server/public-web/readers", () => readers);
vi.mock("@/server/logger/error-tracking", () => ({ captureException, captureMessage: vi.fn() }));

import { GET as getNews } from "@/app/api/public/v1/news/route";
import { GET as getNewsItem } from "@/app/api/public/v1/news/[slug]/route";
import { GET as getDocumentFile } from "@/app/api/public/v1/documents/[id]/file/route";

const params = <T extends object>(value: T) => ({ params: Promise.resolve(value) });

beforeEach(() => {
  for (const fn of Object.values(readers)) fn.mockReset();
  captureException.mockReset();
});

describe("public family endpoints", () => {
  it("returns the published list with shared caching", async () => {
    readers.listPublishedNewsItems.mockResolvedValue([{ slug: "a" }]);
    const response = await getNews();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    const body = await response.json();
    expect(body).toMatchObject({ siteKey: "lifesupply-health", items: [{ slug: "a" }] });
  });

  it("turns any reader failure into a generic, uncached 503 that names no cause", async () => {
    readers.listPublishedNewsItems.mockRejectedValue(
      new Error("connect ECONNREFUSED 10.0.0.5:5432"),
    );
    const response = await getNews();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(text).not.toMatch(/ECONNREFUSED|5432|10\.0\.0/);
    expect(JSON.parse(text)).toEqual({ error: "Public website data is temporarily unavailable." });
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("answers 404, uncached, for a slug that is not published", async () => {
    readers.getPublishedNewsItem.mockResolvedValue(null);
    const response = await getNewsItem(
      new Request("http://x/api/public/v1/news/gone"),
      params({ slug: "gone" }),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("document file route", () => {
  it("is 404 for an unpublished, withdrawn, restricted, or guessed id", async () => {
    readers.resolvePublishedDocumentFile.mockResolvedValue(null);
    const response = await getDocumentFile(new Request("http://x"), params({ id: "clzzzguess" }));
    expect(response.status).toBe(404);
    expect(readers.resolvePublishedDocumentFile).toHaveBeenCalledWith("clzzzguess");
  });

  it("redirects, uncached, to the approved file for a published document", async () => {
    readers.resolvePublishedDocumentFile.mockResolvedValue({
      url: "https://files.example.com/r.pdf",
      title: "R",
    });
    const response = await getDocumentFile(new Request("http://x"), params({ id: "d1" }));
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://files.example.com/r.pdf");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("fails closed with the generic 503 when the lookup itself fails", async () => {
    readers.resolvePublishedDocumentFile.mockRejectedValue(new Error("db down"));
    const response = await getDocumentFile(new Request("http://x"), params({ id: "d1" }));
    expect(response.status).toBe(503);
  });
});
