/**
 * BigCommerce product content client for Product Studio publishing — the
 * ONLY module that sends an image or a description to a store, and the only
 * outbound HTTP in the publish path (2026-10-22).
 *
 * Deliberately narrow, like the price client beside it. It can read a
 * product's description and image list, add ONE image, and set the
 * description. It cannot delete or reorder images, change the thumbnail,
 * set a name, price, SKU, inventory or visibility, and there is no generic
 * "update product" helper here for a later phase to reach for. Widening this
 * file is a deliberate act, not a convenience.
 *
 * Kept out of the price client because that module's canaries hold it to
 * `sale_price` and nothing else, and out of services/product-studio so the
 * service layer performs no outbound HTTP of its own.
 */
import { BC_BASE, type StoreCredentials } from "./store-credentials";

const REQUEST_TIMEOUT_MS = 30_000;

/** BigCommerce's documented ceiling for an uploaded product image. */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
/** BigCommerce caps an image's alt text (`description`) at 255 characters. */
export const MAX_IMAGE_ALT_LENGTH = 255;

function productPath(productId: string): string {
  return "/v3/catalog/products/" + encodeURIComponent(productId);
}

function productUrl(credentials: StoreCredentials, productId: string, suffix = ""): string {
  return (
    BC_BASE +
    "/stores/" +
    encodeURIComponent(credentials.storeHash) +
    productPath(productId) +
    suffix
  );
}

function authHeaders(credentials: StoreCredentials): Record<string, string> {
  return { "X-Auth-Token": credentials.apiToken, Accept: "application/json" };
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text.slice(0, 2000) };
  }
}

function dataOf(body: unknown): Record<string, unknown> | null {
  if (body == null || typeof body !== "object") return null;
  const data = (body as { data?: unknown }).data;
  return data != null && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null;
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title : null;
    const errors =
      record.errors && typeof record.errors === "object"
        ? Object.entries(record.errors as Record<string, unknown>)
            .map(([key, value]) => key + ": " + String(value))
            .join("; ")
        : null;
    if (title || errors) return [title, errors].filter(Boolean).join(" — ");
  }
  return "BigCommerce responded with HTTP " + String(status) + ".";
}

/** One image as the store lists it, kept for the before-write snapshot. */
export type StoreImage = {
  id: number | null;
  isThumbnail: boolean;
  sortOrder: number | null;
  description: string | null;
  urlStandard: string | null;
};

/** The product content captured before a write, kept as rollback evidence. */
export type ProductContentSnapshot = {
  name: string | null;
  sku: string | null;
  description: string | null;
  images: StoreImage[];
  /** The raw record as returned, so a rollback is not limited to what we parsed. */
  raw: unknown;
};

export type ReadContentOutcome =
  | { ok: true; snapshot: ProductContentSnapshot }
  | { ok: false; status: number | "network" | "shape"; message: string };

function toImage(value: unknown): StoreImage {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: typeof record.id === "number" ? record.id : null,
    isThumbnail: record.is_thumbnail === true,
    sortOrder: typeof record.sort_order === "number" ? record.sort_order : null,
    description: typeof record.description === "string" ? record.description : null,
    urlStandard: typeof record.url_standard === "string" ? record.url_standard : null,
  };
}

/**
 * Reads the product's current description and image list. Never throws: a
 * network failure or an unexpected body is returned as a refusal so the caller
 * can decline to write when there is nothing to roll back to.
 */
export async function readBigCommerceProductContent(args: {
  credentials: StoreCredentials;
  productId: string;
}): Promise<ReadContentOutcome> {
  let response: Response;
  try {
    response = await fetch(productUrl(args.credentials, args.productId, "?include=images"), {
      method: "GET",
      headers: authHeaders(args.credentials),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      status: "network",
      message: error instanceof Error ? error.message : "Network failure reading the product.",
    };
  }
  const body = await parseBody(response);
  if (!response.ok) {
    return { ok: false, status: response.status, message: errorMessage(body, response.status) };
  }
  const data = dataOf(body);
  if (!data) {
    return {
      ok: false,
      status: "shape",
      message: "BigCommerce returned a product without a data record.",
    };
  }
  return {
    ok: true,
    snapshot: {
      name: typeof data.name === "string" ? data.name : null,
      sku: typeof data.sku === "string" ? data.sku : null,
      description: typeof data.description === "string" ? data.description : null,
      images: Array.isArray(data.images) ? data.images.map(toImage) : [],
      raw: data,
    },
  };
}

export type ImageUploadRequest = {
  productId: string;
  fileName: string;
  contentType: string;
  /** SHA-256 of the bytes, recorded in the log in place of the bytes. */
  contentHash: string;
  bytes: number;
  altText: string;
  sortOrder: number;
  /**
   * True only when the upload replaces an image that was the listing's
   * thumbnail, so the listing keeps one (2026-10-26). A fresh image is never
   * made the thumbnail.
   */
  isThumbnail?: boolean;
};

/** What the log records about an image request: everything but the pixels. */
export function buildImageRequestPayload(request: ImageUploadRequest) {
  return {
    method: "POST" as const,
    path: productPath(request.productId) + "/images",
    multipart: {
      image_file: {
        fileName: request.fileName,
        contentType: request.contentType,
        bytes: request.bytes,
        sha256: request.contentHash,
      },
      description: request.altText.slice(0, MAX_IMAGE_ALT_LENGTH),
      sort_order: request.sortOrder,
      is_thumbnail: request.isThumbnail === true,
    },
  };
}

export type UploadOutcome =
  | { ok: true; imageId: number | null; response: unknown }
  | { ok: false; status: number | "network" | "refused"; message: string; response?: unknown };

/**
 * Adds one image to the product as a multipart upload. The bytes come from
 * the Command Center database, where Product Studio keeps them behind an
 * authenticated route, so the store cannot fetch them by URL.
 *
 * A new image is never made the thumbnail: the store keeps whatever it had,
 * and a merchant can promote the image from the control panel. The one
 * exception is a replacement for the image that was the thumbnail, which
 * inherits the flag so the listing is never left without one.
 */
export async function uploadBigCommerceProductImage(args: {
  credentials: StoreCredentials;
  request: ImageUploadRequest;
  data: Uint8Array;
}): Promise<UploadOutcome> {
  const { request } = args;
  if (args.data.byteLength === 0) {
    return { ok: false, status: "refused", message: "Refusing to upload an empty image." };
  }
  if (args.data.byteLength > MAX_IMAGE_UPLOAD_BYTES) {
    return {
      ok: false,
      status: "refused",
      message: "Refusing to upload an image larger than BigCommerce's 8 MB limit.",
    };
  }
  const payload = buildImageRequestPayload(request);
  const form = new FormData();
  form.append(
    "image_file",
    new Blob([args.data as BlobPart], { type: request.contentType }),
    request.fileName,
  );
  form.append("description", payload.multipart.description);
  form.append("sort_order", String(payload.multipart.sort_order));
  form.append("is_thumbnail", payload.multipart.is_thumbnail ? "true" : "false");

  let response: Response;
  try {
    // No Content-Type header: fetch sets the multipart boundary itself.
    response = await fetch(productUrl(args.credentials, request.productId, "/images"), {
      method: "POST",
      headers: authHeaders(args.credentials),
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      ok: false,
      status: "network",
      message: error instanceof Error ? error.message : "Network failure uploading the image.",
    };
  }
  const body = await parseBody(response);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: errorMessage(body, response.status),
      response: body,
    };
  }
  const data = dataOf(body);
  return { ok: true, imageId: typeof data?.id === "number" ? data.id : null, response: body };
}

export type DeleteOutcome =
  | { ok: true; response: unknown }
  | { ok: false; status: number | "network" | "refused"; message: string; response?: unknown };

/** What the log records about removing a replaced image. */
export function buildImageDeleteRequestPayload(args: { productId: string; imageId: number }) {
  return {
    method: "DELETE" as const,
    path: productPath(args.productId) + "/images/" + String(args.imageId),
  };
}

/**
 * Removes ONE image the Command Center itself uploaded earlier, after its
 * replacement has been uploaded (2026-10-26). The service passes only an
 * image id it recorded on a published draft; this module cannot list or
 * choose images, and never touches one it did not put there.
 */
export async function deleteBigCommerceProductImage(args: {
  credentials: StoreCredentials;
  productId: string;
  imageId: number;
}): Promise<DeleteOutcome> {
  if (!Number.isInteger(args.imageId) || args.imageId <= 0) {
    return { ok: false, status: "refused", message: "Refusing to delete without an image id." };
  }
  const payload = buildImageDeleteRequestPayload(args);
  let response: Response;
  try {
    response = await fetch(
      BC_BASE + "/stores/" + encodeURIComponent(args.credentials.storeHash) + payload.path,
      {
        method: "DELETE",
        headers: authHeaders(args.credentials),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
  } catch (error) {
    return {
      ok: false,
      status: "network",
      message: error instanceof Error ? error.message : "Network failure removing the image.",
    };
  }
  const body = await parseBody(response);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: errorMessage(body, response.status),
      response: body,
    };
  }
  return { ok: true, response: body };
}

/** What the log records about promoting an image to the listing's main image. */
export function buildImageUpdateRequestPayload(args: {
  productId: string;
  imageId: number;
  isThumbnail: boolean;
  sortOrder: number;
}) {
  return {
    method: "PUT" as const,
    path: productPath(args.productId) + "/images/" + String(args.imageId),
    body: { is_thumbnail: args.isThumbnail, sort_order: args.sortOrder },
  };
}

export type ImageUpdateOutcome =
  | { ok: true; response: unknown }
  | { ok: false; status: number | "network" | "refused"; message: string; response?: unknown };

/**
 * Sets ONE image's thumbnail flag and position (2026-10-26), for an image
 * the Command Center itself uploaded earlier. The body carries those two
 * fields and nothing else; the store clears the flag on its previous
 * thumbnail itself.
 */
export async function updateBigCommerceProductImage(args: {
  credentials: StoreCredentials;
  productId: string;
  imageId: number;
  isThumbnail: boolean;
  sortOrder: number;
}): Promise<ImageUpdateOutcome> {
  if (!Number.isInteger(args.imageId) || args.imageId <= 0) {
    return { ok: false, status: "refused", message: "Refusing to update without an image id." };
  }
  const payload = buildImageUpdateRequestPayload(args);
  let response: Response;
  try {
    response = await fetch(
      BC_BASE + "/stores/" + encodeURIComponent(args.credentials.storeHash) + payload.path,
      {
        method: "PUT",
        headers: { ...authHeaders(args.credentials), "Content-Type": "application/json" },
        body: JSON.stringify(payload.body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
  } catch (error) {
    return {
      ok: false,
      status: "network",
      message: error instanceof Error ? error.message : "Network failure updating the image.",
    };
  }
  const body = await parseBody(response);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: errorMessage(body, response.status),
      response: body,
    };
  }
  return { ok: true, response: body };
}

/** What the log records about a description request. */
export function buildDescriptionRequestPayload(args: { productId: string; html: string }) {
  return {
    method: "PUT" as const,
    path: productPath(args.productId),
    body: { description: args.html },
  };
}

export type DescriptionOutcome =
  | { ok: true; response: unknown; descriptionAfter: string | null }
  | { ok: false; status: number | "network" | "refused"; message: string; response?: unknown };

/**
 * Sets the product description. The body carries that one field and nothing
 * else, so no other catalogue attribute can ride along.
 */
export async function writeBigCommerceProductDescription(args: {
  credentials: StoreCredentials;
  productId: string;
  html: string;
}): Promise<DescriptionOutcome> {
  if (!args.html.trim()) {
    return { ok: false, status: "refused", message: "Refusing to write an empty description." };
  }
  const payload = buildDescriptionRequestPayload(args).body;
  let response: Response;
  try {
    response = await fetch(productUrl(args.credentials, args.productId), {
      method: "PUT",
      headers: { ...authHeaders(args.credentials), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      ok: false,
      status: "network",
      message: error instanceof Error ? error.message : "Network failure writing the description.",
    };
  }
  const body = await parseBody(response);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: errorMessage(body, response.status),
      response: body,
    };
  }
  const data = dataOf(body);
  return {
    ok: true,
    response: body,
    descriptionAfter: typeof data?.description === "string" ? data.description : null,
  };
}
