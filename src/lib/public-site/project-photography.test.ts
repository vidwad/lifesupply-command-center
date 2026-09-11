import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GRAPHICS } from "./graphics";
import { PROJECT_PHOTOGRAPHS, type ProjectPhotograph } from "./project-photography";

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

describe("completed project photography", () => {
  const entries = Object.entries(PROJECT_PHOTOGRAPHS) as [string, ProjectPhotograph][];

  it("ships every photograph at its declared size, under 400 KB", () => {
    for (const [key, photo] of entries) {
      const rel = `public${photo.src}`;
      expect(existsSync(join(ROOT, rel)), key).toBe(true);
      expect(jpegSize(rel), key).toEqual({ width: photo.width, height: photo.height });
      expect(readFileSync(join(ROOT, rel)).length, key).toBeLessThan(400 * 1024);
    }
  });

  it("names the published project page every photograph and its facts come from", () => {
    for (const [key, photo] of entries) {
      expect(photo.source, key).toMatch(
        /^https:\/\/www\.lifesupplyclinics\.com\/portfolio\/[a-z0-9-]+\/$/,
      );
      expect(photo.provenance, key).toContain("Real photography of a real completed facility");
    }
  });

  /**
   * The inverse of the conceptual registry's canary. Generated imagery must
   * never be presented as a real facility; these are real facilities, and
   * calling one conceptual would be just as wrong in the other direction.
   */
  it("never describes a real photograph as conceptual, and shows no person", () => {
    for (const [key, photo] of entries) {
      expect(photo.alt, key).not.toMatch(/conceptual/i);
      expect(photo.provenance, key).not.toMatch(/conceptual/i);
      expect(photo.alt, key).not.toMatch(
        /\b(patient|customer|staff|employee|clinician|nurse|doctor|person|people)\b/i,
      );
      // And never a brand name, which would read as an endorsement.
      expect(photo.alt, key).not.toMatch(/LifeSupply|Wellmart|Balkowitsch/);
    }
  });

  it("keeps the two registries separate, so neither can be used for the other", () => {
    const conceptual = new Set<string>(Object.values(GRAPHICS).map((g) => g.src));
    for (const [key, photo] of entries) {
      expect(conceptual.has(photo.src), key).toBe(false);
      expect(photo.src, key).toMatch(/^\/lsh\/graphics\/projects\//);
    }
  });
});
