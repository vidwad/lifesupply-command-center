import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GRAPHICS, type Graphic } from "./graphics";

const ROOT = join(__dirname, "../../..");

/** Width and height from a baseline JPEG's SOF0/SOF2 marker. */
function jpegSize(rel: string) {
  const bytes = readFileSync(join(ROOT, rel));
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`bad marker at ${offset} in ${rel}`);
    const marker = bytes[offset + 1]!;
    const length = bytes.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error(`no SOF marker in ${rel}`);
}

describe("conceptual graphics registry", () => {
  const entries = Object.entries(GRAPHICS) as [string, Graphic][];

  it("ships every registered graphic at its declared size, under 400 KB", () => {
    for (const [key, graphic] of entries) {
      const rel = `public${graphic.src}`;
      expect(existsSync(join(ROOT, rel)), key).toBe(true);
      expect(jpegSize(rel), key).toEqual({ width: graphic.width, height: graphic.height });
      expect(readFileSync(join(ROOT, rel)).length, key).toBeLessThan(400 * 1024);
    }
  });

  it("labels every graphic as conceptual with provenance and a descriptive alt", () => {
    for (const [key, graphic] of entries) {
      expect(graphic.alt, key).toMatch(/^Conceptual/);
      expect(graphic.provenance, key).toContain("conceptual, not operational photography");
      expect(graphic.alt, key).not.toMatch(/LifeSupply|Wellmart|Balkowitsch|patient|customer/);
    }
  });
});
