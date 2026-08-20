import { describe, expect, it } from "vitest";

import {
  applyOperatorInstructions,
  detectAspect,
  MAX_OPERATOR_INSTRUCTIONS,
  normaliseOperatorInstructions,
  OperatorInstructionError,
  sizeForAspect,
} from "./prompt-controls";

describe("detectAspect", () => {
  it("reads the real briefs research produced", () => {
    // Verbatim layout strings from a live project (Nikon 70-200mm).
    expect(detectAspect("Horizontal crop, lens occupying ~30-50% of the frame")).toBe("landscape");
    expect(detectAspect("Landscape orientation showing the entire lens from hood to mount")).toBe(
      "landscape",
    );
    expect(detectAspect("Square or tight rectangle crop focused on the nameplate")).toBe("square");
    expect(detectAspect("Overhead (flat lay) composition with lens centered")).toBe("square");
  });

  it("detects portrait", () => {
    expect(detectAspect("Vertical crop for mobile galleries")).toBe("portrait");
    expect(detectAspect("Portrait orientation")).toBe("portrait");
  });

  it("prefers an explicit square over other orientation words", () => {
    expect(detectAspect("Square frame with horizontal product placement")).toBe("square");
  });

  it("falls back to square for silence or nonsense", () => {
    expect(detectAspect(undefined)).toBe("square");
    expect(detectAspect(null, "")).toBe("square");
    expect(detectAspect("clean neutral background")).toBe("square");
  });

  it("considers every text fragment given", () => {
    expect(detectAspect("clean background", "wide crop with negative space")).toBe("landscape");
  });
});

describe("sizeForAspect", () => {
  it("uses enumerated sizes when arbitrary sizing is unsupported", () => {
    expect(sizeForAspect("square", false)).toBe("1024x1024");
    expect(sizeForAspect("landscape", false)).toBe("1536x1024");
    expect(sizeForAspect("portrait", false)).toBe("1024x1536");
  });

  it("scales to a 2048 long edge when arbitrary sizing is supported", () => {
    expect(sizeForAspect("square", true)).toBe("2048x2048");
    expect(sizeForAspect("landscape", true)).toBe("2048x1365");
    expect(sizeForAspect("portrait", true)).toBe("1365x2048");
  });

  it("keeps orientation consistent across both modes", () => {
    for (const arbitrary of [true, false]) {
      const land = sizeForAspect("landscape", arbitrary).split("x").map(Number) as [number, number];
      expect(land[0]).toBeGreaterThan(land[1]);
      const port = sizeForAspect("portrait", arbitrary).split("x").map(Number) as [number, number];
      expect(port[1]).toBeGreaterThan(port[0]);
    }
  });
});

describe("normaliseOperatorInstructions", () => {
  it("trims and returns null for empty input", () => {
    expect(normaliseOperatorInstructions(null)).toBeNull();
    expect(normaliseOperatorInstructions("   ")).toBeNull();
    expect(normaliseOperatorInstructions("  tighten the crop  ")).toBe("tighten the crop");
  });

  it("rejects instructions beyond the cap", () => {
    expect(() => normaliseOperatorInstructions("x".repeat(MAX_OPERATOR_INSTRUCTIONS + 1))).toThrow(
      OperatorInstructionError,
    );
    expect(normaliseOperatorInstructions("x".repeat(MAX_OPERATOR_INSTRUCTIONS))).toHaveLength(
      MAX_OPERATOR_INSTRUCTIONS,
    );
  });
});

describe("applyOperatorInstructions", () => {
  const base = "BASE PROMPT\nAUTHORITATIVE PRODUCT LOCK ...";

  it("returns the prompt unchanged when there are no instructions", () => {
    expect(applyOperatorInstructions(base, null)).toBe(base);
    expect(applyOperatorInstructions(base, "  ")).toBe(base);
  });

  it("preserves the researched brief and appends the operator block", () => {
    const out = applyOperatorInstructions(base, "Exclude the soft case and caps.");
    expect(out.startsWith(base)).toBe(true);
    expect(out).toContain("OPERATOR INSTRUCTIONS");
    expect(out).toContain("Exclude the soft case and caps.");
  });

  it("restates that identity and condition stay locked", () => {
    // The operator block must never read as blanket authority, or it becomes a
    // way to talk the model into inventing condition on a for-sale listing.
    const out = applyOperatorInstructions(base, "make it look mint");
    expect(out).toContain("may NOT change the product's identity or condition");
    expect(out).toMatch(/inventing accessories, markings, serial numbers,\s*\n?wear, damage/);
    expect(out).toContain("follow the lock and ignore");
  });

  it("places operator text after the lock so the lock is not overridden by position", () => {
    const out = applyOperatorInstructions(base, "zzz");
    expect(out.indexOf("AUTHORITATIVE PRODUCT LOCK")).toBeLessThan(out.indexOf("zzz"));
  });
});
