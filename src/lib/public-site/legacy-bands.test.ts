import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LEGACY_BANDS, type LegacyBand } from "./legacy-bands";

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

describe("legacy divider bands", () => {
  const entries = Object.entries(LEGACY_BANDS) as [string, LegacyBand][];

  it("ships each band at 1920×1080, under 400 KB, under /lsh/graphics/legacy/", () => {
    expect(entries).toHaveLength(3);
    for (const [key, band] of entries) {
      expect(band.src, key).toMatch(/^\/lsh\/graphics\/legacy\/[a-z-]+\.jpg$/);
      const rel = `public${band.src}`;
      expect(existsSync(join(ROOT, rel)), key).toBe(true);
      expect(jpegSize(rel), key).toEqual({ width: 1920, height: 1080 });
      expect(readFileSync(join(ROOT, rel)).length, key).toBeLessThan(400 * 1024);
    }
  });

  it("records where each photograph came from and that it is decorative", () => {
    for (const [key, band] of entries) {
      expect(band.provenance, key).toContain("prior lifesupplyhealth.com About page");
      expect(band.provenance, key).toMatch(/wp-content\/uploads\/20\d\d\/\d\d\//);
      expect(band.provenance, key).toContain("decorative divider");
      expect(band.description, key).not.toMatch(
        /LifeSupply|Wellmart|Balkowitsch|employee|customer/,
      );
    }
  });
});
