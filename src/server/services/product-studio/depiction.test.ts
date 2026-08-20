import { describe, expect, it } from "vitest";

import {
  buildDepictionQaRules,
  buildDepictionRules,
  DEFAULT_PRODUCT_MODE,
  parseDepictableSpec,
  parseProductMode,
} from "./depiction";

// Verbatim from a live project: research confirmed this against the FDA GUDID
// record, so it is specification-verifiable rather than unit-specific.
const SPEC = [
  "Syringe barrel graduated 0-30 units (0.3 mL / 3-10 cc) with half-unit marks",
  "31 gauge, 5/16 inch (8 mm) permanently attached needle with orange cap",
  "Sterile poly bags of 10 syringes; 100 per retail box",
];

describe("parseProductMode", () => {
  it("defaults to used, the conservative mode", () => {
    // Projects researched before this field existed must not silently gain
    // permission to depict things absent from their photographs.
    expect(parseProductMode(undefined)).toBe(DEFAULT_PRODUCT_MODE);
    expect(parseProductMode(null)).toBe("used");
    expect(parseProductMode("anything-else")).toBe("used");
    expect(parseProductMode({})).toBe("used");
  });

  it("recognises new_sealed only when stated exactly", () => {
    expect(parseProductMode("new_sealed")).toBe("new_sealed");
    expect(parseProductMode("New_Sealed")).toBe("used");
  });
});

describe("parseDepictableSpec", () => {
  it("keeps non-empty strings and drops everything else", () => {
    expect(parseDepictableSpec([...SPEC, "", "   ", null, 7])).toEqual(SPEC);
    expect(parseDepictableSpec("not an array")).toEqual([]);
    expect(parseDepictableSpec(undefined)).toEqual([]);
  });
});

describe("buildDepictionRules", () => {
  it("forbids adding anything for a used item", () => {
    const rules = buildDepictionRules({ mode: "used", depictableSpec: [] });
    expect(rules).toContain("SECOND-HAND ITEM");
    expect(rules).toContain("Depict only the item and accessories visible in the reference");
    expect(rules).toContain("OMIT it");
  });

  it("permits specified contents for a new sealed product", () => {
    const rules = buildDepictionRules({ mode: "new_sealed", depictableSpec: SPEC });
    expect(rules).toContain("NEW, SEALED, MASS-PRODUCED RETAIL PRODUCT");
    expect(rules).toContain("MAY depict the manufacturer-specified contents");
    for (const line of SPEC) expect(rules).toContain(line);
  });

  it("requires a depicted item to match the spec exactly", () => {
    // The live failure was a syringe drawn with a 0-100 scale. Depicting the
    // syringe was legitimate; depicting the wrong one was not.
    const rules = buildDepictionRules({ mode: "new_sealed", depictableSpec: SPEC });
    expect(rules).toContain("MUST match the specification exactly");
    expect(rules).toContain("plausible but incorrect variant is worse than omitting it");
  });

  it("still forbids anything outside the spec in new_sealed mode", () => {
    const rules = buildDepictionRules({ mode: "new_sealed", depictableSpec: SPEC });
    expect(rules).toContain("NOT in this list and NOT visible in the reference photographs");
  });

  it("falls back to photograph-only when new_sealed has no spec", () => {
    const rules = buildDepictionRules({ mode: "new_sealed", depictableSpec: [] });
    expect(rules).toContain("none supplied");
  });

  it("never permits unit-specific or regulatory identifiers, in either mode", () => {
    // QA caught a generated box printing an NRC that differed from the real
    // packaging. Fabricated identifiers on a medical device are a hard no.
    for (const mode of ["used", "new_sealed"] as const) {
      const rules = buildDepictionRules({ mode, depictableSpec: SPEC });
      expect(rules, mode).toContain("NEVER render");
      for (const term of [
        "serial numbers",
        "lot or batch codes",
        "expiry dates",
        "GS1/DI or UDI",
      ]) {
        expect(rules, `${mode}: ${term}`).toContain(term);
      }
    }
  });
});

describe("buildDepictionQaRules", () => {
  it("grades a used item against the photographs", () => {
    const qa = buildDepictionQaRules({ mode: "used", depictableSpec: [] });
    expect(qa).toContain("not present in the authoritative source photographs is a defect");
  });

  it("grades a new sealed item against the specification, not the photographs", () => {
    // Composition 4 invented a five-box case and QA passed it at 95% identity,
    // because QA had no standard to grade contents against.
    const qa = buildDepictionQaRules({ mode: "new_sealed", depictableSpec: SPEC });
    expect(qa).toContain("Judge them against the specification below, not against the photographs");
    expect(qa).toContain("CONTRADICTS the specification");
    expect(qa).toContain("neither specified below nor visible in the sources");
  });

  it("always rejects fabricated identifiers", () => {
    const qa = buildDepictionQaRules({ mode: "new_sealed", depictableSpec: SPEC });
    expect(qa).toContain("fabricated identifiers are always a defect");
  });
});
