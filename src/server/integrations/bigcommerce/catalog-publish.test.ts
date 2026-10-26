/**
 * Product Studio BigCommerce content client tests.
 *
 * Behavioural, with a mocked fetch. The load-bearing claims are proved by
 * inspecting the request: the description write carries that one field and
 * nothing else, the image goes up as multipart with the file and never as a
 * URL, and nothing is ever made the thumbnail.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  buildDescriptionRequestPayload,
  buildImageDeleteRequestPayload,
  buildImageRequestPayload,
  buildImageUpdateRequestPayload,
  deleteBigCommerceProductImage,
  readBigCommerceProductContent,
  updateBigCommerceProductImage,
  uploadBigCommerceProductImage,
  writeBigCommerceProductDescription,
} from "./catalog-publish";
import type { StoreCredentials } from "./store-credentials";

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

const request = {
  productId: "77",
  fileName: "composition-1-r1.jpg",
  contentType: "image/jpeg",
  contentHash: "deadbeef",
  bytes: 3,
  altText: "Thermometer — Hero",
  sortOrder: 4,
};

describe("reading the listing before a write", () => {
  it("captures description and images and keeps the raw record", async () => {
    const calls = installFetch(() =>
      jsonResponse({
        data: {
          name: "Thermo",
          sku: "T1",
          description: "<p>old</p>",
          images: [{ id: 9, is_thumbnail: true, sort_order: 0, url_standard: "https://x/9.jpg" }],
        },
      }),
    );
    const result = await readBigCommerceProductContent({ credentials, productId: "77" });
    expect(calls[0]?.url).toBe(
      "https://api.bigcommerce.com/stores/abc123/v3/catalog/products/77?include=images",
    );
    expect(calls[0]?.init?.method).toBe("GET");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.description).toBe("<p>old</p>");
      expect(result.snapshot.images).toEqual([
        {
          id: 9,
          isThumbnail: true,
          sortOrder: 0,
          description: null,
          urlStandard: "https://x/9.jpg",
        },
      ]);
      expect(result.snapshot.raw).toMatchObject({ sku: "T1" });
    }
  });
  it("refuses on a bad status, a bad shape and a network failure", async () => {
    installFetch(() => jsonResponse({ title: "Not found" }, 404));
    expect(await readBigCommerceProductContent({ credentials, productId: "77" })).toMatchObject({
      ok: false,
      status: 404,
    });
    installFetch(() => jsonResponse({ nope: true }));
    expect(await readBigCommerceProductContent({ credentials, productId: "77" })).toMatchObject({
      ok: false,
      status: "shape",
    });
    globalThis.fetch = (() => Promise.reject(new Error("offline"))) as typeof fetch;
    expect(await readBigCommerceProductContent({ credentials, productId: "77" })).toMatchObject({
      ok: false,
      status: "network",
    });
  });
});

describe("adding an image", () => {
  it("posts multipart with the file, alt text and order, and never as thumbnail", async () => {
    const calls = installFetch(() => jsonResponse({ data: { id: 501, product_id: 77 } }));
    const result = await uploadBigCommerceProductImage({
      credentials,
      request,
      data: new Uint8Array([1, 2, 3]),
    });
    expect(result).toMatchObject({ ok: true, imageId: 501 });
    const call = calls[0]!;
    expect(call.url).toBe(
      "https://api.bigcommerce.com/stores/abc123/v3/catalog/products/77/images",
    );
    expect(call.init?.method).toBe("POST");
    const headers = call.init?.headers as Record<string, string>;
    expect(headers["X-Auth-Token"]).toBe("token-xyz");
    expect(headers["Content-Type"]).toBeUndefined();
    const form = call.init?.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    const file = form.get("image_file") as File;
    expect(file.name).toBe("composition-1-r1.jpg");
    expect(file.type).toBe("image/jpeg");
    expect(file.size).toBe(3);
    expect(form.get("description")).toBe("Thermometer — Hero");
    expect(form.get("sort_order")).toBe("4");
    expect(form.get("is_thumbnail")).toBe("false");
    expect(form.has("image_url")).toBe(false);
  });
  it("refuses an empty or oversized image without calling the store", async () => {
    const calls = installFetch(() => jsonResponse({ data: {} }));
    expect(
      await uploadBigCommerceProductImage({ credentials, request, data: new Uint8Array(0) }),
    ).toMatchObject({ ok: false, status: "refused" });
    expect(
      await uploadBigCommerceProductImage({
        credentials,
        request,
        data: new Uint8Array(8 * 1024 * 1024 + 1),
      }),
    ).toMatchObject({ ok: false, status: "refused" });
    expect(calls).toHaveLength(0);
  });
  it("returns the store's error without throwing", async () => {
    installFetch(() => jsonResponse({ title: "Unsupported", errors: { image_file: "bad" } }, 422));
    const result = await uploadBigCommerceProductImage({
      credentials,
      request,
      data: new Uint8Array([1]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Unsupported");
  });
  it("records everything but the pixels in the log payload", () => {
    const payload = buildImageRequestPayload(request);
    expect(payload).toEqual({
      method: "POST",
      path: "/v3/catalog/products/77/images",
      multipart: {
        image_file: {
          fileName: "composition-1-r1.jpg",
          contentType: "image/jpeg",
          bytes: 3,
          sha256: "deadbeef",
        },
        description: "Thermometer — Hero",
        sort_order: 4,
        is_thumbnail: false,
      },
    });
  });
});

describe("replacing an image", () => {
  it("inherits the thumbnail flag only when asked, for a replacement", async () => {
    const calls = installFetch(() => jsonResponse({ data: { id: 502 } }));
    await uploadBigCommerceProductImage({
      credentials,
      request: { ...request, isThumbnail: true, sortOrder: 0 },
      data: new Uint8Array([1]),
    });
    const form = calls[0]!.init?.body as FormData;
    expect(form.get("is_thumbnail")).toBe("true");
    expect(form.get("sort_order")).toBe("0");
    expect(buildImageRequestPayload({ ...request, isThumbnail: true }).multipart.is_thumbnail).toBe(
      true,
    );
  });
  it("deletes one image by id and nothing else", async () => {
    const calls = installFetch(() => new Response(null, { status: 204 }));
    const result = await deleteBigCommerceProductImage({
      credentials,
      productId: "77",
      imageId: 501,
    });
    expect(result).toMatchObject({ ok: true });
    expect(calls[0]?.url).toBe(
      "https://api.bigcommerce.com/stores/abc123/v3/catalog/products/77/images/501",
    );
    expect(calls[0]?.init?.method).toBe("DELETE");
    expect(calls[0]?.init?.body).toBeUndefined();
    expect(buildImageDeleteRequestPayload({ productId: "77", imageId: 501 })).toEqual({
      method: "DELETE",
      path: "/v3/catalog/products/77/images/501",
    });
  });
  it("refuses to delete without a positive image id, and reports the store's refusal", async () => {
    const calls = installFetch(() => jsonResponse({ title: "Not found" }, 404));
    expect(
      await deleteBigCommerceProductImage({ credentials, productId: "77", imageId: 0 }),
    ).toMatchObject({ ok: false, status: "refused" });
    expect(calls).toHaveLength(0);
    expect(
      await deleteBigCommerceProductImage({ credentials, productId: "77", imageId: 9 }),
    ).toMatchObject({ ok: false, status: 404 });
  });
});

describe("promoting an image to the main image", () => {
  it("sends the thumbnail flag and position for one image id, and nothing else", async () => {
    const calls = installFetch(() => jsonResponse({ data: { id: 501, is_thumbnail: true } }));
    const result = await updateBigCommerceProductImage({
      credentials,
      productId: "77",
      imageId: 501,
      isThumbnail: true,
      sortOrder: 0,
    });
    expect(result).toMatchObject({ ok: true });
    expect(calls[0]?.url).toBe(
      "https://api.bigcommerce.com/stores/abc123/v3/catalog/products/77/images/501",
    );
    expect(calls[0]?.init?.method).toBe("PUT");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ is_thumbnail: true, sort_order: 0 });
    expect(
      buildImageUpdateRequestPayload({
        productId: "77",
        imageId: 501,
        isThumbnail: true,
        sortOrder: 0,
      }),
    ).toEqual({
      method: "PUT",
      path: "/v3/catalog/products/77/images/501",
      body: { is_thumbnail: true, sort_order: 0 },
    });
  });
  it("refuses without an image id, without calling the store", async () => {
    const calls = installFetch(() => jsonResponse({ data: {} }));
    expect(
      await updateBigCommerceProductImage({
        credentials,
        productId: "77",
        imageId: 0,
        isThumbnail: true,
        sortOrder: 0,
      }),
    ).toMatchObject({ ok: false, status: "refused" });
    expect(calls).toHaveLength(0);
  });
});

describe("writing the description", () => {
  it("sends the description and no other field", async () => {
    const calls = installFetch(() => jsonResponse({ data: { description: "<p>new</p>" } }));
    const result = await writeBigCommerceProductDescription({
      credentials,
      productId: "77",
      html: "<p>new</p>",
    });
    expect(result).toMatchObject({ ok: true, descriptionAfter: "<p>new</p>" });
    const call = calls[0]!;
    expect(call.url).toBe("https://api.bigcommerce.com/stores/abc123/v3/catalog/products/77");
    expect(call.init?.method).toBe("PUT");
    expect(JSON.parse(String(call.init?.body))).toEqual({ description: "<p>new</p>" });
    expect(buildDescriptionRequestPayload({ productId: "77", html: "<p>x</p>" })).toEqual({
      method: "PUT",
      path: "/v3/catalog/products/77",
      body: { description: "<p>x</p>" },
    });
  });
  it("refuses an empty description without calling the store", async () => {
    const calls = installFetch(() => jsonResponse({ data: {} }));
    expect(
      await writeBigCommerceProductDescription({ credentials, productId: "77", html: "  " }),
    ).toMatchObject({ ok: false, status: "refused" });
    expect(calls).toHaveLength(0);
  });
});
