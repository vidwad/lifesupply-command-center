/**
 * Guards the query the catalog sync actually sends.
 *
 * Two production failures came from this one URL, and neither was visible from
 * the mapper's own tests — the mappers were correct, they were just fed data
 * the request never asked for:
 *
 *   F-10  `date_modified:min` carried milliseconds -> HTTP 422 on every
 *         incremental run, importing zero products.
 *   F-13  `images` was not included, so `deriveImageStatus` saw
 *         `bc.images === undefined` on every product and flagged the entire
 *         catalogue as missing an image.
 *
 * Both are properties of the request string, so that is what is asserted here.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { deriveImageStatus } from "./product-mapper";

const source = readFileSync(join(__dirname, "sync-products.ts"), "utf8").replace(/\r\n/g, "\n");

describe("the catalog request", () => {
  it("includes images, or every product is flagged as missing one", () => {
    expect(source).toContain('const INCLUDE = "include=variants,images"');
  });

  it("uses the same include for full and incremental", () => {
    // An include that differs by mode means image status silently depends on
    // which sync last touched the product.
    const full = /: `\?\$\{INCLUDE\}`/.test(source);
    const incremental =
      /date_modified:min=\$\{encodeURIComponent\(input\.sinceIso\)\}&\$\{INCLUDE\}/.test(source);
    expect(full, "full-sync branch must use INCLUDE").toBe(true);
    expect(incremental, "incremental branch must use INCLUDE").toBe(true);
  });

  it("formats the incremental watermark through bigCommerceTimestamp, not toISOString", () => {
    // Asserted at the job that builds sinceIso — see sync-products inngest fn.
    const job = readFileSync(
      join(__dirname, "..", "..", "..", "inngest", "functions", "bigcommerce", "sync-products.ts"),
      "utf8",
    ).replace(/\r\n/g, "\n");
    expect(job).toContain("bigCommerceTimestamp(conn.lastSuccessfulSyncAt)");
    expect(job).not.toContain("lastSuccessfulSyncAt.toISOString()");
  });
});

describe("deriveImageStatus against real API shapes", () => {
  it("reports missing when the key is absent — the shape the old request produced", () => {
    // This is exactly what `?include=variants` returned: no `images` key at all.
    expect(deriveImageStatus({ images: undefined } as never)).toBe("missing");
  });

  it("reports present for the real BB V6222 payload", () => {
    // Trimmed from the live response for product 69815 with include=images.
    const bc = {
      images: [
        {
          id: 135928,
          is_thumbnail: true,
          url_standard:
            "https://cdn11.bigcommerce.com/s-76ccf/products/69815/images/135928/bbv6222-c_01__19080.1752606511.500.659.jpg?c=2",
        },
      ],
    };
    expect(deriveImageStatus(bc as never)).toBe("present");
  });

  it("still reports missing for a genuinely empty image list", () => {
    expect(deriveImageStatus({ images: [] } as never)).toBe("missing");
  });
});
