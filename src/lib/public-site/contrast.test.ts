/**
 * Colour-contrast check for the public palette (Stage 9 accessibility
 * evidence). Reads the tokens from the stylesheet so a palette change
 * cannot silently drop a pairing below WCAG AA. Body text needs 4.5:1;
 * the display eyebrows are small caps at 10–11 px, so they are held to
 * 4.5:1 as well rather than the 3:1 allowed for large text.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "../../styles/globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--lsh-${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match) throw new Error(`token --lsh-${name} not found`);
  return match[1]!;
}

function rgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]) {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function composite(fg: [number, number, number], bg: [number, number, number], alpha: number) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i]! * (1 - alpha))) as [number, number, number];
}

function ratio(fg: [number, number, number], bg: [number, number, number]) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

describe("public palette contrast (WCAG AA)", () => {
  const paper = rgb(token("paper"));
  const surface = rgb(token("surface"));
  const ink = rgb(token("ink"));
  const charcoal = rgb(token("charcoal"));
  const muted = rgb(token("muted"));
  const red = rgb(token("brand-red"));
  const redOnInk = rgb(token("red-on-ink"));
  const white: [number, number, number] = [255, 255, 255];

  const pairs: [string, [number, number, number], [number, number, number], number][] = [
    ["charcoal on paper", charcoal, paper, 4.5],
    ["charcoal on surface", charcoal, surface, 4.5],
    ["muted on paper", muted, paper, 4.5],
    ["muted on surface", muted, surface, 4.5],
    ["brand red eyebrow on paper", red, paper, 4.5],
    ["brand red eyebrow on surface", red, surface, 4.5],
    ["white on ink", white, ink, 4.5],
    ["white on charcoal", white, charcoal, 4.5],
    ["white at 75% on charcoal", composite(white, charcoal, 0.75), charcoal, 4.5],
    ["red-on-ink eyebrow on charcoal", redOnInk, charcoal, 4.5],
    ["white on brand red (primary action)", white, red, 4.5],
  ];

  for (const [name, fg, bg, minimum] of pairs) {
    it(`${name} is at least ${minimum}:1`, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(minimum);
    });
  }
});
