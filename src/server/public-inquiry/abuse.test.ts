import { describe, expect, it } from "vitest";

import { FixedWindowRateLimiter, allowedOrigins, clientAddress, isAllowedOrigin } from "./abuse";

describe("origin check", () => {
  const env = {
    PUBLIC_SITE_ORIGINS: "https://lifesupplyhealth.com, https://www.lifesupplyhealth.com/",
    NEXT_PUBLIC_COMMAND_CENTER_URL: "https://cc.example.com",
    NODE_ENV: "production",
  };

  it("normalises configured origins and includes the Command Center origin", () => {
    expect(allowedOrigins(env)).toEqual([
      "https://lifesupplyhealth.com",
      "https://www.lifesupplyhealth.com",
      "https://cc.example.com",
    ]);
  });

  it("accepts an allowed Origin, falls back to Referer, and refuses anything else including no header", () => {
    expect(isAllowedOrigin(new Headers({ origin: "https://lifesupplyhealth.com" }), env)).toBe(
      true,
    );
    expect(
      isAllowedOrigin(new Headers({ referer: "https://www.lifesupplyhealth.com/contact/" }), env),
    ).toBe(true);
    expect(isAllowedOrigin(new Headers({ origin: "https://evil.example.net" }), env)).toBe(false);
    expect(isAllowedOrigin(new Headers({ origin: "null" }), env)).toBe(false);
    expect(isAllowedOrigin(new Headers(), env)).toBe(false);
    expect(isAllowedOrigin(new Headers({ referer: "not a url" }), env)).toBe(false);
  });
});

describe("client address", () => {
  it("takes the first forwarded hop, then x-real-ip, else unknown", () => {
    expect(clientAddress(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe(
      "203.0.113.9",
    );
    expect(clientAddress(new Headers({ "x-real-ip": "203.0.113.10" }))).toBe("203.0.113.10");
    expect(clientAddress(new Headers())).toBe("unknown");
  });
});

describe("rate limiter", () => {
  it("allows up to the maximum per window, refuses the next, and resets after the window", () => {
    const limiter = new FixedWindowRateLimiter(1000, 3);
    expect(limiter.allow("k", 0)).toBe(true);
    expect(limiter.allow("k", 10)).toBe(true);
    expect(limiter.allow("k", 20)).toBe(true);
    expect(limiter.allow("k", 30)).toBe(false);
    expect(limiter.allow("other", 30)).toBe(true);
    expect(limiter.allow("k", 1001)).toBe(true);
  });
});
