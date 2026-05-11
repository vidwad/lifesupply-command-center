import { describe, expect, it } from "vitest";

import { parsePrice, resolvePortalUrl } from "./best-buy-medical";

describe("parsePrice", () => {
  it("parses dollar-sign + decimals", () => {
    expect(parsePrice("$89.50")).toBe(89.5);
    expect(parsePrice("$1,234.56")).toBe(1234.56);
  });

  it("parses comma-decimal European notation", () => {
    expect(parsePrice("89,50 $")).toBe(89.5);
  });

  it("strips currency-code prefixes", () => {
    expect(parsePrice("CAD 159.00")).toBe(159);
    expect(parsePrice("USD12.34")).toBe(12.34);
  });

  it("returns null for null / empty / unparseable", () => {
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("price not available")).toBeNull();
  });

  it("returns null for plain whitespace", () => {
    expect(parsePrice("   ")).toBeNull();
  });
});

describe("resolvePortalUrl", () => {
  const originalEnv = process.env.SUPPLIER_PORTAL_BBM01_URL;
  const originalApp = process.env.NEXT_PUBLIC_APP_URL;

  it("prefers an explicit per-credential loginUrl", () => {
    expect(
      resolvePortalUrl({
        username: "u",
        password: "p",
        loginUrl: "https://portal.example.com",
      }),
    ).toBe("https://portal.example.com");
  });

  it("falls back to env, then to the in-repo mock portal URL", () => {
    delete process.env.SUPPLIER_PORTAL_BBM01_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(resolvePortalUrl({ username: "u", password: "p" })).toBe(
      "http://localhost:3000/dev/mock-portals/bbm01/index.html",
    );
  });

  it.afterEach(() => {
    if (originalEnv === undefined) delete process.env.SUPPLIER_PORTAL_BBM01_URL;
    else process.env.SUPPLIER_PORTAL_BBM01_URL = originalEnv;
    if (originalApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = originalApp;
  });
});
