/**
 * QuickBooks read-only certification canaries (Phase 11D — row 11D-14).
 *
 * QuickBooks is the accounting source of truth (CLAUDE.md §12): the Command
 * Center must hold no write scope and no write path. These source-level
 * guards make adding either one a CI failure until it is consciously gated
 * and this file is updated alongside an approved control design.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..");
const QBO_DIR = join(SRC, "server", "integrations", "quickbooks");

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectFiles(full));
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("QuickBooks stays read-only", () => {
  const qboFiles = collectFiles(QBO_DIR);

  it("OAuth requests only the accounting scope", () => {
    const client = readFileSync(join(QBO_DIR, "client.ts"), "utf8");
    expect(client).toContain('scope: "com.intuit.quickbooks.accounting"');
    // No payments, payroll, or OpenID write-adjacent scopes anywhere.
    for (const file of qboFiles) {
      const src = readFileSync(file, "utf8");
      expect(src, `${relative(SRC, file)} must not widen the OAuth scope`).not.toMatch(
        /com\.intuit\.quickbooks\.(payment|payroll)/,
      );
    }
  });

  it("the only non-GET request is the OAuth token exchange", () => {
    const offenders: string[] = [];
    for (const file of qboFiles) {
      const src = readFileSync(file, "utf8");
      const rel = relative(SRC, file);
      const matches = src.match(/method:\s*"(POST|PUT|PATCH|DELETE)"/g) ?? [];
      for (const m of matches) {
        // client.ts's single POST is the OAuth token request to Intuit's
        // token endpoint — not the accounting API.
        if (rel === join("server", "integrations", "quickbooks", "client.ts") && m.includes("POST"))
          continue;
        offenders.push(`${rel}: ${m}`);
      }
    }
    expect(offenders, `unexpected write-capable requests: ${offenders.join("; ")}`).toEqual([]);
    const client = readFileSync(join(QBO_DIR, "client.ts"), "utf8");
    expect(client.match(/method:\s*"POST"/g) ?? []).toHaveLength(1);
  });

  it("every accounting-API URL in src/ is a /reports/ read", () => {
    const files = collectSourceFiles(join(SRC));
    const offenders: string[] = [];
    for (const file of files) {
      if (relative(SRC, file) === join("server", "security", "qbo-read-only.test.ts")) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("/v3/company")) continue;
      for (const line of src.split("\n")) {
        if (line.includes("/v3/company") && !line.includes("/reports/")) {
          offenders.push(`${relative(SRC, file)}: ${line.trim()}`);
        }
      }
    }
    expect(offenders, `non-report QBO API paths found: ${offenders.join("; ")}`).toEqual([]);
  });

  it("QUICKBOOKS_WRITEBACKS has no enforcement call sites — because no write path exists", () => {
    // The flag is declared and covered by the kill switch, but nothing may
    // reference it outside flag infrastructure: a reference implies someone
    // added a QBO write path. That requires an approved control design
    // (permission + flag + approval + audit) and a conscious update here.
    const ALLOWED = new Set(
      [
        join("lib", "feature-flags.ts"),
        join("lib", "feature-flags.test.ts"),
        join("server", "services", "feature-flags", "kill-switch.ts"),
        join("server", "security", "chokepoints.test.ts"),
        join("server", "security", "qbo-read-only.test.ts"),
        // Health surfaces high-risk flag STATE (read-only) for the smoke test.
        join("app", "api", "health", "route.ts"),
      ].map((p) => p),
    );
    const offenders: string[] = [];
    for (const file of collectSourceFiles(SRC)) {
      const rel = relative(SRC, file);
      if (ALLOWED.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      if (src.includes("QUICKBOOKS_WRITEBACKS")) offenders.push(rel);
    }
    expect(
      offenders,
      `unexpected QUICKBOOKS_WRITEBACKS references: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
