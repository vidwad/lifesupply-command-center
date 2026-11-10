/**
 * The web fonts ship with the repository (2026-11-10). `next/font/google`
 * downloaded them from Google Fonts on every build and failed the build when
 * the download failed, which the required CI build check cannot afford. These
 * hold the layout to the local files and the files to real WOFF2.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const layout = readFileSync(join(__dirname, "layout.tsx"), "utf8").replace(/\r\n/g, "\n");

describe("the root layout's fonts", () => {
  it("loads every family from the repository, never from Google Fonts at build time", () => {
    expect(layout).toContain('import localFont from "next/font/local";');
    expect(layout).not.toContain("next/font/google");
  });

  it("points at files that exist and are WOFF2", () => {
    const sources = [...layout.matchAll(/src: "\.\/fonts\/([^"]+)"/g)].flatMap((m) =>
      m[1] ? [m[1]] : [],
    );
    expect(sources.sort()).toEqual([
      "inter-latin.woff2",
      "jetbrains-mono-latin.woff2",
      "roboto-condensed-latin.woff2",
      "roboto-latin.woff2",
    ]);
    for (const file of sources) {
      const bytes = readFileSync(join(__dirname, "fonts", file));
      // WOFF2 files begin with the signature "wOF2".
      expect(bytes.subarray(0, 4).toString("latin1")).toBe("wOF2");
      expect(bytes.length).toBeGreaterThan(10_000);
    }
  });

  it("declares each variable font's weight range, so every weight the UI asks for resolves", () => {
    expect(layout).toMatch(/inter-latin\.woff2",\s*weight: "100 900"/);
    expect(layout).toMatch(/jetbrains-mono-latin\.woff2",\s*weight: "100 800"/);
    expect(layout).toMatch(/roboto-latin\.woff2",\s*weight: "100 900"/);
    expect(layout).toMatch(/roboto-condensed-latin\.woff2",\s*weight: "100 900"/);
  });
});
