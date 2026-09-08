import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchPublishedDocuments,
  fetchPublishedNews,
  fetchPublishedNewsItem,
  publishedContentOrigin,
  publishedDocumentUrl,
} from "./published";

const ok = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const item = {
  slug: "update",
  title: "Update",
  summary: "Summary.",
  date: "2026-09-01",
  body: ["Body."],
  source: null,
  related: [],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  process.env.PUBLIC_CONTENT_API_ORIGIN = "https://cc.example.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PUBLIC_CONTENT_API_ORIGIN;
});

describe("origin", () => {
  it("prefers PUBLIC_CONTENT_API_ORIGIN, then the Command Center URL, then the Render default, and never a same-host path", () => {
    expect(publishedContentOrigin({ PUBLIC_CONTENT_API_ORIGIN: "https://a.example.com/x" })).toBe(
      "https://a.example.com",
    );
    expect(
      publishedContentOrigin({ NEXT_PUBLIC_COMMAND_CENTER_URL: "https://b.example.com" }),
    ).toBe("https://b.example.com");
    expect(publishedContentOrigin({})).toBe("https://lifesupply-cc-web.onrender.com");
    expect(() => publishedContentOrigin({ PUBLIC_CONTENT_API_ORIGIN: "ftp://x" })).toThrow();
    expect(publishedDocumentUrl("/api/public/v1/documents/d1/file")).toBe(
      "https://cc.example.com/api/public/v1/documents/d1/file",
    );
  });
});

describe("fail-closed fetching", () => {
  it("returns the validated items on success, requesting the family endpoint with revalidation", async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok({ siteKey: "lifesupply-health", generatedAt: new Date().toISOString(), items: [item] }),
    );
    const result = await fetchPublishedNews();
    expect(result).toEqual({ ok: true, data: [item] });
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://cc.example.com/api/public/v1/news");
    expect((init as { next?: { revalidate?: number } }).next?.revalidate).toBe(300);
  });

  it("is { ok: false } on a network error, a 503, and a body that breaks the contract", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    expect(await fetchPublishedNews()).toEqual({ ok: false });
    vi.mocked(fetch).mockResolvedValueOnce(ok({ error: "unavailable" }, 503));
    expect(await fetchPublishedNews()).toEqual({ ok: false });
    vi.mocked(fetch).mockResolvedValueOnce(
      ok({
        siteKey: "lifesupply-health",
        generatedAt: new Date().toISOString(),
        items: [{ ...item, internalId: "leak" }],
      }),
    );
    expect(await fetchPublishedNews()).toEqual({ ok: false });
    vi.mocked(fetch).mockResolvedValueOnce(new Response("<html>", { status: 200 }));
    expect(await fetchPublishedDocuments()).toEqual({ ok: false });
    // A list endpoint that does not exist is an outage, never an empty list.
    vi.mocked(fetch).mockResolvedValueOnce(ok({ error: "Not found." }, 404));
    expect(await fetchPublishedNews()).toEqual({ ok: false });
  });

  it("treats a 404 for a single item as a real absence, not an outage", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ error: "Not found." }, 404));
    expect(await fetchPublishedNewsItem("gone")).toEqual({ ok: true, data: null });
    vi.mocked(fetch).mockResolvedValueOnce(ok(item));
    expect(await fetchPublishedNewsItem("update")).toEqual({ ok: true, data: item });
    expect(vi.mocked(fetch).mock.calls[1]![0]).toBe(
      "https://cc.example.com/api/public/v1/news/update",
    );
  });
});
