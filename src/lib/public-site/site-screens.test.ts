import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SITE_SCREENS, type SiteScreen } from "./site-screens";

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

describe("store home-page screens", () => {
  const entries = Object.entries(SITE_SCREENS) as [string, SiteScreen][];

  it("ships each screen at its declared size, under 400 KB, under /lsh/sites/", () => {
    for (const [key, screen] of entries) {
      expect(screen.src, key).toMatch(/^\/lsh\/sites\/[a-z-]+\.jpg$/);
      const rel = `public${screen.src}`;
      expect(existsSync(join(ROOT, rel)), key).toBe(true);
      expect(jpegSize(rel), key).toEqual({ width: screen.width, height: screen.height });
      expect(readFileSync(join(ROOT, rel)).length, key).toBeLessThan(400 * 1024);
    }
  });

  it("dates every capture, names the host it shows, and calls it a real screen", () => {
    for (const [key, screen] of entries) {
      expect(screen.capturedOn, key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(screen.alt, key).toContain(screen.host);
      expect(screen.provenance, key).toContain("A real screen, not a conceptual image");
      expect(screen.alt, key).not.toMatch(/^Conceptual/);
    }
  });
});
