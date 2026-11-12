/**
 * Safety tests for the retire-removed-listings script. It runs against the
 * production database as a one-off job, so what has to be proved is the shape
 * of what it can touch: the pure argument handling, which audit rows count,
 * the production guard, and that the only write is the one retirement module.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  isProductionEnvironment,
  parseArgs,
  PRODUCTION_ACK,
  refusedProductIds,
} from "./retire-removed-listings";

const source = readFileSync(join(__dirname, "retire-removed-listings.ts"), "utf8").replace(
  /\r\n/g,
  "\n",
);
const code = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("parseArgs", () => {
  it("reads the actor, the optional product ids and the acknowledgements", () => {
    expect(
      parseArgs([
        "--actor-email",
        "owner@example.com",
        "--product-id",
        "a",
        "--product-id",
        "b",
        "--apply",
        PRODUCTION_ACK,
      ]),
    ).toEqual({
      actorEmail: "owner@example.com",
      productIds: ["a", "b"],
      apply: true,
      acknowledged: true,
    });
    expect(parseArgs(["--actor-email", "o@x.com"])).toMatchObject({
      productIds: [],
      apply: false,
      acknowledged: false,
    });
  });

  it("refuses a missing actor, a missing value and an unknown argument", () => {
    expect(parseArgs([])).toMatchObject({ error: /--actor-email is required/ });
    expect(parseArgs(["--product-id", "--actor-email", "o@x.com"])).toMatchObject({
      error: /--product-id needs a value/,
    });
    expect(parseArgs(["--actor-email", "o@x.com", "--force"])).toMatchObject({
      error: /Unknown argument: --force/,
    });
  });
});

describe("which refusals name a removed listing", () => {
  it("takes a 'was not found' pre-write read failure and the explicit listing_removed reason", () => {
    expect(
      refusedProductIds([
        {
          afterData: {
            productId: "p1",
            refusedBecause: "pre_write_read_failed",
            message: "A product with the id of 10747 was not found",
          },
        },
        { afterData: { productId: "p2", refusedBecause: "listing_removed", message: "x" } },
        { afterData: { productId: "p1", refusedBecause: "listing_removed" } },
        {
          afterData: {
            productId: "p3",
            refusedBecause: "pre_write_read_failed",
            message: "fetch failed",
          },
        },
        { afterData: { productId: "p4", refusedBecause: "missing_credentials" } },
        { afterData: { refusedBecause: "listing_removed" } },
        { afterData: null },
        { afterData: "text" },
      ]),
    ).toEqual(["p1", "p2"]);
  });
});

describe("the production guard", () => {
  it("recognises production by NODE_ENV, DEPLOY_ENV or RENDER", () => {
    expect(isProductionEnvironment({})).toBe(false);
    expect(isProductionEnvironment({ NODE_ENV: "production" })).toBe(true);
    expect(isProductionEnvironment({ DEPLOY_ENV: "Production" })).toBe(true);
    expect(isProductionEnvironment({ RENDER: "true" })).toBe(true);
  });

  it("writes nothing without --apply, and in production not without the acknowledgement", () => {
    expect(code).toContain("if (!parsed.apply) {");
    expect(code).toContain("DRY RUN: nothing written");
    expect(code).toContain("if (isProductionEnvironment(process.env) && !parsed.acknowledged) {");
    expect(code.indexOf("if (!parsed.apply) {")).toBeLessThan(
      code.indexOf("retireProductsRemovedFromStore({"),
    );
  });
});

describe("the write surface", () => {
  it("retires only through the one retirement module, only what the store answered 404 to", () => {
    expect(code.match(/retireProductsRemovedFromStore\(\{/g)?.length).toBe(1);
    expect(code).toContain('noticedBy: "listing_check_404"');
    expect(code).toContain('if (verdict.verdict === "gone") gone.push(candidate);');
    expect(code).toContain('else if (read.status === 404) out.set(product.id, { verdict: "gone"');
    expect(code).not.toMatch(/prisma\.\w+\.(update|updateMany|upsert|delete|deleteMany|create)\(/);
    expect(code).not.toMatch(/\$executeRaw|\$queryRaw/);
    // The store is read through the publish service's own read, never written.
    expect(code).toContain("readBigCommerceProductContent({");
    expect(code).not.toMatch(/uploadBigCommerce|writeBigCommerce|deleteBigCommerce/);
    // The actor must hold the publish permission.
    expect(code).toContain("PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE");
  });
});
