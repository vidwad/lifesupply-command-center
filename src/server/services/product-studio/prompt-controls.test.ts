import { describe, expect, it } from "vitest";

import {
  applyOperatorInstructions,
  buildEffectivePrompt,
  MAX_QA_CORRECTIONS,
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

  it("measures the way a textarea does, so CRLF from submission does not overflow", () => {
    // A textarea maxLength counts a newline as one character while typing, but
    // form submission normalises newlines to CRLF. Measuring the raw value
    // rejected input the UI had already accepted — the live 500 that sent an
    // operator to the generic error page with a digest reference.
    const CRLF = String.fromCharCode(13) + String.fromCharCode(10);
    const LF = String.fromCharCode(10);
    const submitted = Array.from({ length: 40 }, () => "x".repeat(24)).join(CRLF);
    expect(submitted.length).toBeGreaterThan(submitted.split(CRLF).join(LF).length);
    expect(() => normaliseOperatorInstructions(submitted)).not.toThrow();
    expect(normaliseOperatorInstructions("a" + CRLF + "b")).toBe("a" + LF + "b");
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

describe("buildEffectivePrompt", () => {
  const base = `BASE PROMPT
AUTHORITATIVE PRODUCT LOCK ...`;
  // Verbatim from a live QA result (SureComfort insulin syringes, composition 2).
  const corrections = [
    "Replace the syringe with one that uses the correct U-100 3/10 cc graduation layout.",
    "Use a strict top-down (90°) camera angle with minimal perspective.",
  ];

  it("returns the base prompt when there is nothing to add", () => {
    expect(buildEffectivePrompt({ basePrompt: base })).toBe(base);
    expect(
      buildEffectivePrompt({ basePrompt: base, qaCorrections: [], operatorInstructions: "" }),
    ).toBe(base);
  });

  it("feeds the previous revision's QA corrections back in, numbered", () => {
    // Regression: requiredCorrections were displayed and then discarded, so a
    // regeneration repeated the same mistakes the QA model had just described.
    const out = buildEffectivePrompt({ basePrompt: base, qaCorrections: corrections });
    expect(out).toContain("REQUIRED CORRECTIONS FROM THE PREVIOUS REVISION");
    expect(out).toContain("1. Replace the syringe");
    expect(out).toContain("2. Use a strict top-down");
  });

  it("forbids corrections being used to authorise invention", () => {
    // QA output is model-authored text. A correction like "show the half-unit
    // markings" must not license drawing markings absent from the references.
    const out = buildEffectivePrompt({ basePrompt: base, qaCorrections: corrections });
    expect(out).toContain("never authorise adding anything absent from the");
    expect(out).toContain("omit that element and leave it out of the frame");
  });

  it("ignores blank entries and caps the list", () => {
    const many = Array.from({ length: MAX_QA_CORRECTIONS + 5 }, (_, i) => `fix ${i + 1}`);
    const out = buildEffectivePrompt({ basePrompt: base, qaCorrections: ["", "   ", ...many] });
    expect(out).toContain(`${MAX_QA_CORRECTIONS}. fix ${MAX_QA_CORRECTIONS}`);
    expect(out).not.toContain(`${MAX_QA_CORRECTIONS + 1}. fix`);
  });

  it("puts operator instructions after QA corrections so a human can override", () => {
    const out = buildEffectivePrompt({
      basePrompt: base,
      qaCorrections: corrections,
      operatorInstructions: "Omit the loose syringe entirely; box only.",
    });
    expect(out.indexOf("REQUIRED CORRECTIONS")).toBeLessThan(out.indexOf("OPERATOR INSTRUCTIONS"));
    expect(out).toContain("Omit the loose syringe entirely; box only.");
  });

  it("tolerates a malformed corrections array", () => {
    const out = buildEffectivePrompt({
      basePrompt: base,
      qaCorrections: [null, 42, "keep this"] as unknown as string[],
    });
    expect(out).toContain("1. keep this");
  });
});
