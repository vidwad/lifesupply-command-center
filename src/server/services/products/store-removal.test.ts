/**
 * Retiring products the store no longer lists (2026-11-11): source-level
 * canaries. One module sets `deletedAt` on a product, it only ever sets it on
 * live rows, every retirement is audited, and nothing anywhere hard-deletes a
 * product, so order history and publish evidence always have a row to point at.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

function collectSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSource(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}
const rel = (file: string) => file.slice(ROOT.length + 1).replace(/\\/g, "/");

const MODULE = "src/server/services/products/store-removal.ts";
const SELF = "store-removal.test.ts";

describe("retiring a product the store no longer lists", () => {
  it("is the only place a product's deletedAt is set, and it is set on live rows only", () => {
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src"))) {
      if (file.endsWith(SELF) || rel(file) === MODULE) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (!/prisma\.product\.(update|updateMany|upsert)\(/.test(code)) continue;
      // A write to a product that names deletedAt with anything but null
      // (the sync's reinstatement) is a retirement happening elsewhere.
      if (/deletedAt:\s*(?!null\b|true\b)[\w.]+/.test(code)) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
    const code = stripComments(read(MODULE));
    expect(code).toContain("deletedAt: null }");
    expect(code).toContain("data: { deletedAt: retiredAt }");
    expect(code.match(/prisma\.product\.updateMany\(/g)?.length).toBe(1);
  });

  it("audits every retirement and invalidates the shared population counts", () => {
    const code = stripComments(read(MODULE));
    expect(code).toContain('action: "product.retired_from_store"');
    expect(code).toContain("invalidateProductPopulation()");
    expect(code).toMatch(/noticedBy: RetirementNotice/);
    expect(code).toContain('"publish_read_404" | "full_catalog_sync" | "listing_check_404"');
  });

  it("nothing in the application hard-deletes a product", () => {
    const offenders: string[] = [];
    for (const file of collectSource(join(ROOT, "src"))) {
      if (file.endsWith(SELF)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (/prisma\.product\.(delete|deleteMany)\(/.test(code)) offenders.push(rel(file));
      if (/DELETE FROM\s+"?products"?/i.test(code)) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it("the sync reinstates a returned product and retires only after a complete full walk", () => {
    const mapper = stripComments(
      read("src/server/integrations/bigcommerce/sync/product-mapper.ts"),
    );
    expect(mapper).toContain("deletedAt: null,");
    const sync = stripComments(read("src/server/integrations/bigcommerce/sync/sync-products.ts"));
    expect(sync).toContain('if (walk.mode !== "full") return;');
    expect(sync).toContain("retirementDecision({");
    expect(sync).toContain('noticedBy: "full_catalog_sync"');
    expect(sync).toContain("if (!decision.retire) {");
    // The walk is complete only when it ended on a short or empty page.
    expect(sync.match(/walkComplete = true;/g)?.length).toBe(2);
    expect(sync).toContain("seen.add(String(bc.id));");
  });
});
