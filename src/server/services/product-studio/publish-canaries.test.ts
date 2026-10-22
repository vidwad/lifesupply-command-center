/**
 * Product Studio publish source-level canaries (2026-10-22).
 *
 * The structural guarantees of the second external write-back that cannot be
 * expressed as unit tests: that exactly one module can send content to a
 * store, that the log is written before each request, that no background or
 * bulk path exists, that a page render never loads the write path, and that
 * the price client stays untouched by this feature.
 *
 * The helpers below are deliberate copies of the ones in the pricing canaries.
 * A canary suite that imported its own reading machinery from the code it
 * polices would be weaker for it.
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
const allSource = () => collectSource(join(ROOT, "src"));

const SERVICE = "src/server/services/product-studio/publish.ts";
const RULES = "src/server/services/product-studio/publish-eligibility.ts";
const READ_ONLY = "src/server/services/product-studio/publish-read.ts";
const CLIENT = "src/server/integrations/bigcommerce/catalog-publish.ts";
// The price client is deliberately not named here: its own canaries keep it
// price-only and police who may mention it.
const ACTIONS = "src/app/(dashboard)/products/studio/publish-actions.ts";
const PANEL = "src/app/(dashboard)/products/studio/[id]/publish-panel.tsx";
const PAGE = "src/app/(dashboard)/products/studio/[id]/page.tsx";

const CLIENT_IMPORT = "integrations/bigcommerce/catalog-publish";
const SERVICE_IMPORT_RE = /["']@?[^"']*services\/product-studio\/publish["']/;

const SELF = "publish-canaries.test.ts";

describe("only one module can send Product Studio content to a store", () => {
  it("creates ProductStudioPublishLog rows only in the publish service", () => {
    const allowed = new Set([SERVICE, "src/server/security/chokepoints.test.ts"]);
    const offenders: string[] = [];
    for (const file of allSource()) {
      if (file.endsWith(SELF)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (code.includes("productStudioPublishLog.create") && !allowed.has(rel(file))) {
        offenders.push(rel(file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("imports the content client only from the publish service and its own test", () => {
    const allowed = new Set([
      SERVICE,
      RULES,
      "src/server/integrations/bigcommerce/catalog-publish.test.ts",
    ]);
    const offenders: string[] = [];
    for (const file of allSource()) {
      if (file.endsWith(SELF)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (code.includes(CLIENT_IMPORT) && !allowed.has(rel(file))) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it("the rules module takes only a constant from the client, never a request function", () => {
    const code = stripComments(read(RULES));
    expect(code).toMatch(
      /import \{ MAX_IMAGE_ALT_LENGTH \} from "@\/server\/integrations\/bigcommerce\/catalog-publish"/,
    );
    expect(code).not.toMatch(/fetch\(|uploadBigCommerce|writeBigCommerce|readBigCommerce/);
  });

  it("the client adds an image and sets a description, and nothing else", () => {
    const code = stripComments(read(CLIENT));
    // The description body is that one field as a literal, never a spread,
    // and it is the only JSON body the module ever serialises.
    expect(code).toContain("body: { description: args.html }");
    expect(code).not.toMatch(/\.\.\.args|\.\.\.request/);
    expect(code.match(/JSON\.stringify\(/g)?.length).toBe(1);
    // The multipart form carries exactly these four fields: the bytes, the
    // alt text, the order, and the thumbnail flag pinned to false.
    const appended = [...code.matchAll(/form\.append\(\s*"([a-z_]+)"/g)].map((m) => m[1]);
    expect(appended.sort()).toEqual(["description", "image_file", "is_thumbnail", "sort_order"]);
    expect(code).toContain('form.append("is_thumbnail", "false")');
    // No deletes, and never a URL the store would have to fetch.
    expect(code).not.toMatch(/method:\s*"DELETE"/);
    expect(code).not.toContain("image_url");
    expect(code).not.toContain("sale_price");
  });
});

describe("the publish service is gated, logged and single-shot", () => {
  it("requires all three flags, re-asserts the Super Admin permission, and audits every outcome", () => {
    const code = stripComments(read(SERVICE));
    expect(code).toContain("flagsBlockingPublish()");
    expect(code).toContain("actorPermissions.includes(PUBLISH_PERMISSION)");
    expect(stripComments(read(RULES))).toContain(
      "PUBLISH_PERMISSION = PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE",
    );
    for (const action of [
      "product_studio.publish_refused",
      "product_studio.publish_requested",
      "product_studio.publish_succeeded",
      "product_studio.publish_failed",
    ]) {
      expect(code, "must audit " + action).toContain(action);
    }
  });

  it("writes each log row before its request goes out", () => {
    const code = stripComments(read(SERVICE));
    const imageLog = code.indexOf("productStudioPublishLog.create");
    const imageCall = code.indexOf("uploadBigCommerceProductImage({");
    expect(imageLog).toBeGreaterThan(-1);
    expect(imageLog).toBeLessThan(imageCall);
    const descriptionLog = code.indexOf("productStudioPublishLog.create", imageCall);
    const descriptionCall = code.indexOf("writeBigCommerceProductDescription({");
    expect(descriptionLog).toBeGreaterThan(-1);
    expect(descriptionLog).toBeLessThan(descriptionCall);
  });

  it("refuses to write without a successful pre-write read", () => {
    const code = stripComments(read(SERVICE));
    expect(code).toContain("readBigCommerceProductContent({");
    expect(code).toContain('reason: "pre_write_read_failed"');
    expect(code.indexOf("readBigCommerceProductContent({")).toBeLessThan(
      code.indexOf("productStudioPublishLog.create"),
    );
  });

  it("sends each item once, stops at the first failure, and has no scheduler or bulk path", () => {
    const code = stripComments(read(SERVICE));
    expect(code).toContain("publishedAt: writtenAt");
    expect(code).toContain("descriptionPublishedAt: writtenAt");
    expect(code).not.toMatch(
      /inngest|createFunction|cron|setInterval|findMany\(\s*\{\s*where:\s*\{\s*status/,
    );
    // Two `break` statements: one per item kind, each after a failure.
    expect(code.match(/\bbreak;/g)?.length).toBe(2);
  });

  it("is unreachable from any background function or the worker entrypoint", () => {
    const offenders: string[] = [];
    for (const file of allSource()) {
      const path = rel(file);
      if (!path.startsWith("src/server/inngest/") && !path.includes("worker")) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (SERVICE_IMPORT_RE.test(code) || code.includes(CLIENT_IMPORT)) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });

  it("is imported by the publish actions and nothing else", () => {
    const allowed = new Set([ACTIONS]);
    const offenders: string[] = [];
    for (const file of allSource()) {
      if (file.endsWith(SELF)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      if (SERVICE_IMPORT_RE.test(code) && !allowed.has(rel(file))) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it("is never imported by a page or layout render; the page reads only the read-only module", () => {
    const page = stripComments(read(PAGE));
    expect(page).toContain("product-studio/publish-read");
    expect(page).toContain("product-studio/publish-eligibility");
    expect(page).not.toMatch(SERVICE_IMPORT_RE);
    expect(page).not.toContain(CLIENT_IMPORT);
    expect(page).toContain("canUserPublish(user)");
    const readOnly = stripComments(read(READ_ONLY));
    expect(readOnly).not.toMatch(/integrations\/bigcommerce|fetch\(/);
  });

  it("every publish action requires the Super Admin-only permission at the boundary", () => {
    const code = stripComments(read(ACTIONS));
    expect(code).toContain("requirePermission(PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE)");
    const actions = code.match(/export async function \w+Action/g) ?? [];
    expect(actions.length).toBe(3);
    expect(code.match(/await requirePublisher\(\)/g)?.length).toBe(3);
    const panel = stripComments(read(PANEL));
    expect(panel).toContain('variant="destructive"');
    expect(panel).toContain("Super Admin only");
  });

  it("gives the publish permission to no role but Super Admin", () => {
    const seed = stripComments(read("prisma/seed/auth.ts"));
    const occurrences = seed.match(/PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE/g) ?? [];
    // Super Admin receives it through ALL_PERMISSION_KEYS, so no role block
    // may name it explicitly.
    expect(occurrences).toEqual([]);
  });
});
