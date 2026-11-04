/**
 * The assistant's read-only promise, pinned (2026-11-04).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/server/services/ai", () => ({ filterDashboardForAi: () => ({}) }));
vi.mock("@/server/services/dashboard", () => ({ getDashboardData: async () => ({}) }));
vi.mock("@/server/services/exceptions", () => ({ listExceptions: async () => [] }));
vi.mock("@/server/services/orders", () => ({
  listOrders: async () => [],
  countOrders: async () => 0,
  getOrderById: async () => null,
}));
vi.mock("@/server/services/pricing", () => ({ listPricingCompetitors: async () => [] }));
vi.mock("@/server/services/sales-intelligence", () => ({
  getSalesOverview: async () => ({}),
  getProductSalesStats: async () => [],
}));
vi.mock("@/server/integrations/bigcommerce/store-credentials", () => ({
  BC_BASE: "https://api.bigcommerce.com",
  resolveStoreCredentials: async () => ({ ok: false, reason: "none" }),
}));

import { PERMISSIONS } from "@/lib/permissions";

import { ASSISTANT_TOOLS, canQueryDatabase, runAssistantTool, toolsForPermissions } from "./tools";
import { buildBcQuery, isAllowedBcPath } from "./bigcommerce-read";
import { flattenContent, readWebsiteSection } from "./website";

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const sources = readdirSync(__dirname)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => ({ name: f, code: stripComments(readFileSync(join(__dirname, f), "utf8")) }));

describe("every tool is gated and unique", () => {
  it("has a name, a description, a JSON schema and at least one permission", () => {
    const names = new Set<string>();
    for (const tool of ASSISTANT_TOOLS) {
      expect(tool.name).toMatch(/^[a-z_]+$/);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.parameters).toMatchObject({ type: "object" });
      expect(tool.permissions.length).toBeGreaterThan(0);
      expect(names.has(tool.name), tool.name).toBe(false);
      names.add(tool.name);
    }
  });

  it("offers the SQL tools to an account with every AI data context, and to no one else", () => {
    const owner = [
      PERMISSIONS.AI_USE,
      PERMISSIONS.AI_USE_FINANCIAL_CONTEXT,
      PERMISSIONS.AI_USE_CUSTOMER_CONTEXT,
      PERMISSIONS.AI_USE_INVESTOR_CONTEXT,
    ];
    expect(canQueryDatabase(owner.slice(0, 3))).toBe(false);
    expect(canQueryDatabase(owner)).toBe(true);
    expect(toolsForPermissions(owner).map((t) => t.name)).toContain("database_query");
    const analyst = [PERMISSIONS.AI_USE, PERMISSIONS.ORDERS_VIEW];
    expect(canQueryDatabase(analyst)).toBe(false);
    const offered = toolsForPermissions(analyst).map((t) => t.name);
    expect(offered).not.toContain("database_query");
    expect(offered).not.toContain("database_schema");
    expect(offered).not.toContain("search_customers");
    expect(offered).toContain("search_orders");
  });

  it("refuses a call from a person who may not use the tool, before running it", async () => {
    const result = await runAssistantTool(
      "database_query",
      { sql: "SELECT 1" },
      {
        userId: "u",
        permissions: [PERMISSIONS.AI_USE],
        now: new Date(),
      },
    );
    expect(result).toEqual({ ok: false, error: 'The person asking may not use "database_query".' });
    expect(
      await runAssistantTool("no_such_tool", {}, { userId: "u", permissions: [], now: new Date() }),
    ).toEqual({
      ok: false,
      error: 'Unknown tool "no_such_tool".',
    });
  });
});

describe("the assistant never writes", () => {
  const all = sources.map((f) => f.code).join("\n");

  it("makes no Prisma mutation except the answer's own AiOutput row", () => {
    const writes =
      all.match(
        /prisma\.[a-zA-Z]+\.(createMany|create|updateMany|update|upsert|deleteMany|delete)\b/g,
      ) ?? [];
    expect(writes).toEqual(["prisma.aiOutput.create"]);
  });

  it("uses raw SQL only inside the read-only transaction, and only its two SET lines execute", () => {
    const executes = all.match(/\$executeRawUnsafe\(([^)]*)\)/g) ?? [];
    expect(executes).toEqual([
      '$executeRawUnsafe("SET TRANSACTION READ ONLY")',
      '$executeRawUnsafe("SET LOCAL statement_timeout = 10000")',
    ]);
    expect(all).not.toContain("$executeRaw`");
    expect(all.match(/\$queryRawUnsafe/g)?.length).toBe(1);
    expect(all).toContain("guardReadOnlySql(");
  });

  it("reaches no feature flag, credential helper or write-back service", () => {
    for (const forbidden of [
      "setFeatureFlag",
      "resolveCredential(",
      "MASTER_ENCRYPTION_KEY",
      "price-writeback",
      "catalog-publish",
      "mailchimp",
      "quickbooks",
    ]) {
      expect(all, forbidden).not.toContain(forbidden);
    }
  });
});

describe("the BigCommerce window is GET-only and allowlisted", () => {
  it("allows the read paths and nothing else", () => {
    for (const path of [
      "/v2/orders",
      "/v2/orders/123",
      "/v2/orders/123/products",
      "/v3/catalog/products",
      "/v3/customers",
      "/v2/store",
    ]) {
      expect(isAllowedBcPath(path), path).toBe(true);
    }
    for (const path of [
      "/v2/orders/123/status",
      "/v3/catalog/products/1/custom-fields",
      "/v3/pricelists/1/records",
      "/v2/orders/../store",
      "/v3/carts",
      "v2/orders",
      "/v2/orders?x=1",
    ]) {
      expect(isAllowedBcPath(path), path).toBe(false);
    }
  });

  it("caps the page size and drops odd keys", () => {
    expect(buildBcQuery({ limit: 500, page: 2, status_id: 2, "bad key": "x" })).toBe(
      "limit=50&page=2&status_id=2",
    );
    expect(buildBcQuery(undefined)).toBe("limit=50");
    expect(buildBcQuery({ limit: 10 })).toBe("limit=10");
  });

  it("only ever issues GET", () => {
    const code = sources.find((f) => f.name === "bigcommerce-read.ts")?.code ?? "";
    expect(code).toContain('method: "GET"');
    expect(code).not.toMatch(/method: "(POST|PUT|PATCH|DELETE)"/);
  });
});

describe("the website window reads the published copy", () => {
  it("flattens string leaves and skips asset references", () => {
    expect(
      flattenContent({
        hero: { title: "Hi", image: "/images/x.png", href: "https://x" },
        list: ["a", ""],
      }),
    ).toEqual(["hero.title: Hi", "list[0]: a"]);
  });

  it("reads a real section and refuses an unknown one", async () => {
    const about = await readWebsiteSection("about");
    expect(about.ok).toBe(true);
    if (about.ok) expect(about.text).toContain("hero.title");
    const unknown = await readWebsiteSection("secret");
    expect(unknown.ok).toBe(false);
  });
});
