/**
 * DP-6 BigCommerce price client tests.
 *
 * Behavioural, with a mocked fetch. The claim that this module writes ONLY
 * `sale_price` is the load-bearing one in the whole phase, so it is proved by
 * inspecting the request body rather than by reading the source.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  buildSalePriceRequestPayload,
  readBigCommercePrice,
  writeBigCommerceSalePrice,
  type StoreCredentials,
} from "./price-writeback";

const realFetch = globalThis.fetch;

const credentials: StoreCredentials = {
  storeHash: "abc123",
  apiToken: "token-xyz",
  connectionId: "conn-1",
};

type Call = { url: string; init?: RequestInit };

function installFetch(handler: (url: string, init?: RequestInit) => Response): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init });
    return Promise.resolve(handler(url, init));
  }) as typeof fetch;
  return calls;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("reading the price before a write", () => {
  it("returns the live snapshot and keeps the raw record", () => {
    const calls = installFetch(() =>
      jsonResponse({ data: { price: 120, sale_price: 110, retail_price: 130, sku: "S1" } }),
    );
    return readBigCommercePrice({
      credentials,
      target: { scope: "product", productId: "77" },
    }).then((result) => {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.snapshot.price).toBe(120);
        expect(result.snapshot.salePrice).toBe(110);
        expect(result.snapshot.raw).toMatchObject({ sku: "S1" });
      }
      expect(calls[0]?.init?.method).toBe("GET");
      expect(calls[0]?.url).toContain("/stores/abc123/v3/catalog/products/77");
    });
  });

  it("addresses a variant under its parent product", async () => {
    const calls = installFetch(() => jsonResponse({ data: { price: 10, sale_price: 9 } }));
    await readBigCommercePrice({
      credentials,
      target: { scope: "variant", productId: "77", variantId: "88" },
    });
    expect(calls[0]?.url).toContain("/v3/catalog/products/77/variants/88");
  });

  it("fails on an unexpected response shape rather than assuming a price", async () => {
    installFetch(() => jsonResponse({ notData: true }));
    const result = await readBigCommercePrice({
      credentials,
      target: { scope: "product", productId: "77" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("shape");
  });

  it("fails on unreadable JSON", async () => {
    installFetch(() => new Response("<html>nope", { status: 200 }));
    const result = await readBigCommercePrice({
      credentials,
      target: { scope: "product", productId: "77" },
    });
    expect(result.ok).toBe(false);
  });

  it("fails on an HTTP error", async () => {
    installFetch(() => jsonResponse({ error: "nope" }, 404));
    const result = await readBigCommercePrice({
      credentials,
      target: { scope: "product", productId: "77" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("sends the auth token as a header, never in the URL", async () => {
    const calls = installFetch(() => jsonResponse({ data: { price: 1 } }));
    await readBigCommercePrice({ credentials, target: { scope: "product", productId: "77" } });
    expect(calls[0]?.url).not.toContain("token-xyz");
    expect((calls[0]?.init?.headers as Record<string, string>)["X-Auth-Token"]).toBe("token-xyz");
  });
});

describe("writing the sale price", () => {
  /**
   * The most important assertion in DP-6: the request body carries exactly one
   * key. If a later change lets any other catalogue field ride along with a
   * price update, this fails.
   */
  it("sends sale_price and nothing else", async () => {
    const calls = installFetch(() => jsonResponse({ data: { sale_price: 99.99 } }));
    await writeBigCommerceSalePrice({
      credentials,
      target: { scope: "product", productId: "77" },
      salePrice: 99.99,
    });
    const body = JSON.parse(String(calls[0]?.init?.body));
    expect(Object.keys(body)).toEqual(["sale_price"]);
    expect(body.sale_price).toBe(99.99);
    expect(calls[0]?.init?.method).toBe("PUT");
  });

  it("never sends price, cost, inventory, or content fields", async () => {
    const calls = installFetch(() => jsonResponse({ data: { sale_price: 5 } }));
    await writeBigCommerceSalePrice({
      credentials,
      target: { scope: "variant", productId: "1", variantId: "2" },
      salePrice: 5,
    });
    const body = JSON.parse(String(calls[0]?.init?.body));
    for (const forbidden of [
      "price",
      "retail_price",
      "cost_price",
      "inventory_level",
      "name",
      "description",
      "sku",
      "images",
    ]) {
      expect(body, forbidden).not.toHaveProperty(forbidden);
    }
  });

  it("reports the sale price the store echoes back", async () => {
    installFetch(() => jsonResponse({ data: { sale_price: 42.5 } }));
    const result = await writeBigCommerceSalePrice({
      credentials,
      target: { scope: "product", productId: "77" },
      salePrice: 42.5,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.salePriceAfter).toBe(42.5);
  });

  it("refuses a non-positive price without making a request", async () => {
    const calls = installFetch(() => jsonResponse({ data: {} }));
    for (const price of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = await writeBigCommerceSalePrice({
        credentials,
        target: { scope: "product", productId: "77" },
        salePrice: price,
      });
      expect(result.ok).toBe(false);
    }
    expect(calls).toHaveLength(0);
  });

  it("returns a failure with the body on an HTTP error", async () => {
    installFetch(() => jsonResponse({ title: "Bad price" }, 422));
    const result = await writeBigCommerceSalePrice({
      credentials,
      target: { scope: "product", productId: "77" },
      salePrice: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.response).toMatchObject({ title: "Bad price" });
    }
  });

  it("returns a failure on a network error rather than throwing", async () => {
    globalThis.fetch = (() => Promise.reject(new Error("ECONNRESET"))) as typeof fetch;
    const result = await writeBigCommerceSalePrice({
      credentials,
      target: { scope: "product", productId: "77" },
      salePrice: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("ECONNRESET");
  });
});

describe("the recorded request payload", () => {
  it("matches what is actually sent", async () => {
    const calls = installFetch(() => jsonResponse({ data: { sale_price: 12 } }));
    const target = { scope: "variant", productId: "3", variantId: "4" } as const;
    await writeBigCommerceSalePrice({ credentials, target, salePrice: 12 });
    const recorded = buildSalePriceRequestPayload({ target, salePrice: 12 });
    expect(recorded.body).toEqual(JSON.parse(String(calls[0]?.init?.body)));
    expect(recorded.method).toBe("PUT");
    expect(String(recorded.path)).toBe("/v3/catalog/products/3/variants/4");
  });

  it("records no credentials", () => {
    const recorded = JSON.stringify(
      buildSalePriceRequestPayload({
        target: { scope: "product", productId: "9" },
        salePrice: 1,
      }),
    );
    expect(recorded).not.toContain("token-xyz");
    expect(recorded).not.toContain("abc123");
  });
});
