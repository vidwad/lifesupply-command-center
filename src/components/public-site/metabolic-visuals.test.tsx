import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  MetabolicCoordinationGrid,
  MetabolicEditorialVisual,
  MetabolicReplenishmentRhythm,
} from "./metabolic-visuals";

const ROOT = join(__dirname, "../../..");
const source = readFileSync(join(__dirname, "metabolic-visuals.tsx"), "utf8");
const styles = readFileSync(join(ROOT, "src/styles/globals.css"), "utf8");

describe("Metabolic Health visual layer", () => {
  it("removes the opening orbit so the first content section stays copy-led", () => {
    const pageSource = readFileSync(join(__dirname, "pages/metabolic.tsx"), "utf8");

    expect(source).not.toContain("MetabolicSupplyOrbit");
    expect(pageSource).not.toContain("MetabolicSupplyOrbit");
    expect(styles).not.toContain(".lsh-metabolic-orbit");
  });

  it("keeps the new hero artwork conceptual and excludes clinical product imagery", () => {
    expect(source).toContain("files.manuscdn.com");
    expect(source).toContain("non-drug supply-planning still");
    expect(source).not.toMatch(/needle|syringe|prescription|dose|clinician/i);
  });

  it("renders each additional editorial visual as an empty-alt decorative image", () => {
    for (const visual of ["pathways", "replenishment", "collaboration"] as const) {
      const markup = renderToStaticMarkup(<MetabolicEditorialVisual visual={visual} />);
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('alt=""');
      expect(markup).toContain("%2Flsh%2Fgraphics%2F");
    }

    expect(renderToStaticMarkup(<MetabolicReplenishmentRhythm />)).not.toContain("<text");
    expect(renderToStaticMarkup(<MetabolicCoordinationGrid />)).not.toContain("<text");
  });

  it("gates decorative Metabolic Health motion behind the reduced-motion preference", () => {
    expect(styles).toContain(".lsh-metabolic-hero-halo--one");
    expect(styles).toContain(".lsh-metabolic-editorial img");
    expect(styles).toContain(".lsh-metabolic-coordinates");
    expect(styles).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
