/**
 * API route authorization coverage (Phase 11C — rows 11C-03/11C-05).
 *
 * Source-level guard: every API route handler must call requirePermission
 * unless it is on the explicit allowlist below. A new route added without
 * an auth call fails this test, so permission coverage cannot silently
 * regress. Live per-role probing is the staging half (11C-04).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const API_ROOT = join(__dirname, "..", "..", "app", "api");

/** Routes deliberately without requirePermission — each with a reason. */
const ALLOWLIST: Record<string, string> = {
  "auth/[...nextauth]/route.ts": "NextAuth handler — authentication itself",
  "health/route.ts":
    "Unauthenticated uptime probe by design (docs/16 §12); body reviewed in 11B-12",
};

function collectRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectRouteFiles(full));
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}

describe("API route authorization coverage", () => {
  const routes = collectRouteFiles(API_ROOT);

  it("finds the API surface (sanity: at least 20 routes)", () => {
    expect(routes.length).toBeGreaterThanOrEqual(20);
  });

  it("every route calls requirePermission unless explicitly allowlisted", () => {
    const unprotected: string[] = [];
    for (const file of routes) {
      const rel = relative(API_ROOT, file).replace(/\\/g, "/");
      if (ALLOWLIST[rel]) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("requirePermission(")) unprotected.push(rel);
    }
    expect(unprotected, `routes missing requirePermission: ${unprotected.join(", ")}`).toEqual([]);
  });

  it("allowlist entries actually exist (no stale exemptions)", () => {
    const rels = new Set(routes.map((f) => relative(API_ROOT, f).replace(/\\/g, "/")));
    for (const entry of Object.keys(ALLOWLIST)) {
      expect(rels.has(entry), `stale allowlist entry: ${entry}`).toBe(true);
    }
  });

  it("every export route requires an export-specific permission", () => {
    const exportRoutes = routes.filter((f) => {
      const rel = relative(API_ROOT, f).replace(/\\/g, "/");
      return rel.startsWith("exports/") || rel.includes("/export/");
    });
    expect(exportRoutes.length).toBeGreaterThanOrEqual(6);
    for (const file of exportRoutes) {
      const src = readFileSync(file, "utf8");
      expect(
        /requirePermission\(PERMISSIONS\.[A-Z_]*EXPORT[A-Z_]*\)/.test(src),
        `${relative(API_ROOT, file)} must gate on an *_EXPORT permission`,
      ).toBe(true);
    }
  });
});
