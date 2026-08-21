import { describe, expect, it } from "vitest";

import { rebuildCompositionBrief, rebuildIdentity, rebuildListing } from "./recompile";

const row = {
  slot: 2,
  name: "Technical/Specification Flat Lay",
  rationale: "Lets buyers confirm graduations and packaging.",
  sourceSeller: "Total Diabetes Supply",
  sourceUrl: "https://example.com/p",
  referenceImageUrl: null,
  attributes: {
    purpose: "condition view",
    layout: "Flat lay: box left, syringe right",
    background: "seamless white",
    lighting: "even, shadow-soft",
    cameraAngle: "Top down (90°)",
    productOrientation: "barrel facing camera",
    productPlacement: "right two-thirds",
    shadowTreatment: "minimal",
    cropAndNegativeSpace: "space above for overlay",
    depthOfField: "f/8-f/11",
    props: ["one unpacked syringe"],
    accessoriesExclude: ["extra syringes"],
    conditionMustShow: ["half-unit markings"],
    negativeConstraints: ["no hands"],
  },
};

describe("rebuildCompositionBrief", () => {
  it("restores every field the compiler needs from the stored row", () => {
    const brief = rebuildCompositionBrief(row);
    expect(brief.slot).toBe(2);
    expect(brief.name).toBe("Technical/Specification Flat Lay");
    // rationale is stored under a different name than the compiler expects
    expect(brief.whyEffective).toBe("Lets buyers confirm graduations and packaging.");
    expect(brief.layout).toBe("Flat lay: box left, syringe right");
    expect(brief.cameraAngle).toBe("Top down (90°)");
    expect(brief.props).toEqual(["one unpacked syringe"]);
    expect(brief.conditionMustShow).toEqual(["half-unit markings"]);
    expect(brief.sourceSeller).toBe("Total Diabetes Supply");
  });

  it("substitutes neutral text rather than leaving a field blank", () => {
    // The compiler interpolates these directly; an empty line reads to the
    // image model as permission to decide for itself.
    const brief = rebuildCompositionBrief({ ...row, attributes: {}, rationale: "" });
    expect(brief.layout).toBe("not recorded");
    expect(brief.whyEffective).toBe("not recorded");
    expect(brief.background).toBe("clean neutral studio background");
    expect(brief.depthOfField).toContain("fully sharp");
  });

  it("survives malformed or missing attributes", () => {
    for (const attributes of [null, undefined, "nonsense", [1, 2, 3]]) {
      const brief = rebuildCompositionBrief({ ...row, attributes });
      expect(brief.props).toEqual([]);
      expect(brief.layout).toBe("not recorded");
    }
  });

  it("drops non-string and blank array entries", () => {
    const brief = rebuildCompositionBrief({
      ...row,
      attributes: { ...row.attributes, props: ["keep", "", "   ", 7, null] },
    });
    expect(brief.props).toEqual(["keep"]);
  });
});

describe("rebuildIdentity", () => {
  it("reads the identity block from stored research", () => {
    const identity = rebuildIdentity({
      identifiedProduct: {
        brand: "Allison Medical",
        model: "22-6504",
        modelIdentifiers: ["22-6504"],
        conditionNotes: ["new, sealed"],
      },
    });
    expect(identity.brand).toBe("Allison Medical");
    expect(identity.modelIdentifiers).toEqual(["22-6504"]);
  });

  it("defers to the photographs when research is missing or malformed", () => {
    for (const summary of [null, undefined, {}, "nope"]) {
      const identity = rebuildIdentity(summary);
      expect(identity.brand).toContain("reference photographs");
      expect(identity.conditionNotes).toEqual([]);
    }
  });
});

describe("rebuildListing", () => {
  const fallback = { title: "Intake title", shortDescription: "Intake description" };

  it("prefers the researched listing copy", () => {
    const listing = rebuildListing(
      { optimizedListing: { title: "Researched title", shortDescription: "Researched desc" } },
      fallback,
    );
    expect(listing.title).toBe("Researched title");
  });

  it("falls back to intake copy when research has none", () => {
    expect(rebuildListing(null, fallback)).toEqual(fallback);
    expect(rebuildListing({ optimizedListing: { title: "  " } }, fallback).title).toBe(
      "Intake title",
    );
  });
});
