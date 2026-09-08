import { beforeEach, describe, expect, it, vi } from "vitest";

const receiveInquiry = vi.hoisted(() => vi.fn());
vi.mock("@/server/public-inquiry/intake", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, receiveInquiry };
});
vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/server/services/feature-flags", () => ({
  isFeatureOn: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/server/audit", () => ({ writeAudit: vi.fn() }));

import { GET, POST } from "@/app/api/public/v1/inquiries/route";

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://cc.example.com/api/public/v1/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => receiveInquiry.mockReset());

describe("intake route", () => {
  it("answers 201 with only the reference on a new submission, uncached", async () => {
    receiveInquiry.mockResolvedValue({ ok: true, reference: "LS-ABCD1234", duplicate: false });
    const response = await POST(post({ any: "thing" }));
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ reference: "LS-ABCD1234" });
  });

  it("answers 200 on a duplicate, and maps each refusal to its status without echoing the body", async () => {
    receiveInquiry.mockResolvedValue({ ok: true, reference: "LS-ABCD1234", duplicate: true });
    expect((await POST(post({}))).status).toBe(200);
    for (const [reason, status] of [
      ["too_large", 413],
      ["forbidden_origin", 403],
      ["invalid", 400],
      ["disabled", 503],
      ["rate_limited", 429],
      ["unavailable", 503],
    ] as const) {
      receiveInquiry.mockResolvedValue({
        ok: false,
        reason,
        issues:
          reason === "invalid" ? [{ path: "contact.email", message: "Invalid email" }] : undefined,
      });
      const response = await POST(post({ contact: { email: "secret@example.com" } }));
      expect(response.status, reason).toBe(status);
      const text = await response.text();
      expect(text).not.toContain("secret@example.com");
      if (reason === "rate_limited") expect(response.headers.get("retry-after")).toBe("600");
    }
  });

  it("rejects malformed JSON as 400 without calling the service", async () => {
    const response = await POST(post("{not json"));
    expect(response.status).toBe(400);
    expect(receiveInquiry).not.toHaveBeenCalled();
  });

  it("passes the byte size so an oversized body is refused before parsing", async () => {
    receiveInquiry.mockResolvedValue({ ok: false, reason: "too_large" });
    const response = await POST(post("x".repeat(20_000)));
    expect(response.status).toBe(413);
    const call = receiveInquiry.mock.calls[0]![0] as { body: unknown; bodyBytes: number };
    expect(call.body).toBeNull();
    expect(call.bodyBytes).toBeGreaterThan(16 * 1024);
  });

  it("does not answer GET", async () => {
    expect(GET().status).toBe(405);
  });
});
