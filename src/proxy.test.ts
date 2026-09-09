import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The internal-host branch is Auth.js; it is not under test here. Stub it so
// the module loads without a secret, and so the public-host branch can be
// shown never to touch it.
const authHandler = vi.hoisted(() => vi.fn(() => new Response("internal", { status: 200 })));
vi.mock("next-auth", () => ({
  default: () => ({ auth: () => authHandler }),
}));
vi.mock("@/server/auth/config", () => ({ authConfig: {} }));

import proxy from "./proxy";
import { INTERNAL_TOP_LEVEL_SEGMENTS } from "@/lib/public-site/public-paths";

const PUBLIC_HOST = "lifesupplyhealth.com";
const INTERNAL_HOST = "lifesupply-cc-web.onrender.com";

function request(host: string, path: string) {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}

const event = {} as never;

beforeEach(() => {
  process.env.PUBLIC_SITE_MODE = "false";
  process.env.PUBLIC_SITE_HOSTS = "lifesupplyhealth.com,www.lifesupplyhealth.com";
  authHandler.mockClear();
});

afterEach(() => {
  delete process.env.PUBLIC_SITE_HOSTS;
});

describe("public host (D-03, D-12)", () => {
  it("never invokes the authentication wrapper, so no Auth.js cookie can be set", async () => {
    for (const path of [
      "/",
      "/about-us",
      "/customers",
      "/dashboard",
      "/api/public/v1/news",
      "/nothing-here",
    ]) {
      const response = await proxy(request(PUBLIC_HOST, path), event);
      expect(authHandler, path).not.toHaveBeenCalled();
      expect(response?.headers.get("set-cookie"), path).toBeNull();
    }
  });

  it("serves every registered public family, the retained profiles, the public API, and health", async () => {
    for (const path of [
      "/",
      "/about-us",
      "/our-operations/lifesupply",
      "/clinic-solutions/equipment",
      "/metabolic-health/care-kits/glp-1-support",
      "/partners/pharmacies",
      "/investor-relations/documents",
      "/our-team",
      "/news",
      "/news/some-item",
      "/resources/some-brief",
      "/shop",
      "/contact",
      "/contact-2",
      "/privacy",
      "/terms",
      "/accessibility",
      "/john-anderson-2",
      "/api/public/v1/news",
      "/api/health",
    ]) {
      const response = await proxy(request(PUBLIC_HOST, path), event);
      expect(response?.status, path).toBe(200);
      expect(response?.headers.get("location"), path).toBeNull();
    }
  });

  it("sends every internal family home rather than to /login", async () => {
    for (const segment of INTERNAL_TOP_LEVEL_SEGMENTS) {
      const response = await proxy(request(PUBLIC_HOST, `/${segment}`), event);
      expect(response?.status, segment).toBe(307);
      expect(response?.headers.get("location"), segment).toBe(`https://${PUBLIC_HOST}/`);
    }
    for (const path of [
      "/customers/123",
      "/api/exports/customers",
      "/api/auth-ish",
      "/public-web-preview/x",
    ]) {
      const response = await proxy(request(PUBLIC_HOST, path), event);
      expect(response?.headers.get("location"), path).toBe(`https://${PUBLIC_HOST}/`);
    }
  });

  it("leaves an unknown path to the 404 page instead of a soft redirect", async () => {
    const response = await proxy(request(PUBLIC_HOST, "/no-such-page"), event);
    expect(response?.status).toBe(200);
    expect(response?.headers.get("location")).toBeNull();
  });

  it("keeps the internal family list in step with the dashboard and auth route groups", () => {
    const root = join(__dirname, "app");
    const groups = ["(dashboard)", "(auth)"].flatMap((group) =>
      readdirSync(join(root, group)).filter((entry) =>
        statSync(join(root, group, entry)).isDirectory(),
      ),
    );
    for (const family of groups) {
      expect(INTERNAL_TOP_LEVEL_SEGMENTS, family).toContain(family);
    }
    // Print-group previews are internal too.
    expect(INTERNAL_TOP_LEVEL_SEGMENTS).toContain("public-web-preview");
  });
});

describe("internal host", () => {
  it("still routes through the authentication wrapper", async () => {
    await proxy(request(INTERNAL_HOST, "/dashboard"), event);
    expect(authHandler).toHaveBeenCalledTimes(1);
  });
});
