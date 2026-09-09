import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DIAGRAMS, type Diagram } from "./diagrams";

const ROOT = join(__dirname, "../../..");

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

describe("diagrams", () => {
  const entries = Object.entries(DIAGRAMS) as [string, Diagram][];

  it("ships each diagram at its declared size, under 400 KB, under /lsh/graphics/diagrams/", () => {
    for (const [key, diagram] of entries) {
      expect(diagram.src, key).toMatch(/^\/lsh\/graphics\/diagrams\/[a-z-]+\.jpg$/);
      const rel = `public${diagram.src}`;
      expect(existsSync(join(ROOT, rel)), key).toBe(true);
      expect(jpegSize(rel), key).toEqual({ width: diagram.width, height: diagram.height });
      expect(readFileSync(join(ROOT, rel)).length, key).toBeLessThan(400 * 1024);
    }
  });

  it("describes what each diagram shows and records where it came from", () => {
    for (const [key, diagram] of entries) {
      expect(diagram.alt, key).toMatch(/diagram/i);
      expect(diagram.provenance, key).toContain("Gamma");
      expect(diagram.provenance, key).toMatch(/S-\d{3}/);
      expect(diagram.provenance, key).toContain("own copy");
    }
  });
});
