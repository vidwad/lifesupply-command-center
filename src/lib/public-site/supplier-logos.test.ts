import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GRAPHICS } from "./graphics";
import { SUPPLIER_LOGOS } from "./supplier-logos";

const ROOT = join(__dirname, "../../..");

/** Width and height from a PNG's IHDR chunk. */
function pngSize(rel: string) {
  const bytes = readFileSync(join(ROOT, rel));
  expect(bytes.subarray(1, 4).toString("ascii"), rel).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("supplier logo registry", () => {
  it("ships every logo at its declared size, greyscale-treated, under 40 KB", () => {
    for (const logo of SUPPLIER_LOGOS) {
      const rel = `public${logo.src}`;
      expect(existsSync(join(ROOT, rel)), logo.slug).toBe(true);
      expect(pngSize(rel), logo.slug).toEqual({ width: logo.width, height: logo.height });
      // 96px tall at most, so a 2x file for a 48px display and never a poster.
      expect(logo.height, logo.slug).toBeLessThanOrEqual(96);
      expect(readFileSync(join(ROOT, rel)).length, logo.slug).toBeLessThan(40 * 1024);
      // The IHDR colour type: 4 is greyscale with alpha, which the treatment
      // writes; a colour logo (2 or 6) would break the greyscale identity.
      expect(readFileSync(join(ROOT, rel))[25], logo.slug).toBe(4);
    }
  });

  it("names every brand once, from a store's own brands directory, with no URL in the code", () => {
    const slugs = SUPPLIER_LOGOS.map((logo) => logo.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = SUPPLIER_LOGOS.map((logo) => logo.name);
    expect(new Set(names).size).toBe(names.length);
    for (const logo of SUPPLIER_LOGOS) {
      expect(logo.name.trim(), logo.slug).toBe(logo.name);
      expect(logo.name.length, logo.slug).toBeGreaterThan(1);
      expect(["lifesupply", "wellmart"], logo.slug).toContain(logo.observedOn);
      expect(logo.verifiedAt, logo.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(logo.src, logo.slug).toMatch(/^\/lsh\/logos\/[a-z0-9-]+\.png$/);
    }
    // The registry never carries a CDN address; provenance lives in the docs.
    const source = readFileSync(join(__dirname, "supplier-logos.ts"), "utf8");
    expect(source).not.toMatch(/https?:\/\//);
  });

  it("keeps the logos out of the conceptual registry, and never calls one conceptual", () => {
    const conceptual = new Set<string>(Object.values(GRAPHICS).map((g) => g.src));
    for (const logo of SUPPLIER_LOGOS) {
      expect(conceptual.has(logo.src), logo.slug).toBe(false);
      expect(logo.name, logo.slug).not.toMatch(/conceptual/i);
    }
  });

  it("is a set worth looping: enough marks to fill a wide screen twice over", () => {
    expect(SUPPLIER_LOGOS.length).toBeGreaterThanOrEqual(20);
  });
});
