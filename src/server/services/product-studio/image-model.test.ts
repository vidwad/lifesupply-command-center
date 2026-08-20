import { describe, expect, it } from "vitest";

import {
  ARBITRARY_SQUARE,
  DEFAULT_IMAGE_MODEL,
  ENUMERATED_MAX_SQUARE,
  imageModelCapabilities,
} from "./image-model";

describe("imageModelCapabilities", () => {
  it("defaults to a model that supports input fidelity", () => {
    const caps = imageModelCapabilities(undefined);
    expect(caps.model).toBe(DEFAULT_IMAGE_MODEL);
    expect(caps.supportsInputFidelity).toBe(true);
    expect(caps.size).toBe(ENUMERATED_MAX_SQUARE);
  });

  it("treats blank and whitespace-only overrides as unset", () => {
    expect(imageModelCapabilities("").model).toBe(DEFAULT_IMAGE_MODEL);
    expect(imageModelCapabilities("   ").model).toBe(DEFAULT_IMAGE_MODEL);
    expect(imageModelCapabilities(null).model).toBe(DEFAULT_IMAGE_MODEL);
  });

  it("trims a configured model name", () => {
    expect(imageModelCapabilities("  gpt-image-1.5  ").model).toBe("gpt-image-1.5");
  });

  it("omits input fidelity for gpt-image-2, which rejects it with a 400", () => {
    // Regression: sending input_fidelity to gpt-image-2 returned
    // `400 image_generation_user_error` and failed every generation.
    const caps = imageModelCapabilities("gpt-image-2");
    expect(caps.supportsInputFidelity).toBe(false);
    expect(caps.supportsArbitrarySize).toBe(true);
    expect(caps.size).toBe(ARBITRARY_SQUARE);
  });

  it("applies the gpt-image-2 rules to its dated snapshots", () => {
    const caps = imageModelCapabilities("gpt-image-2-2026-04-21");
    expect(caps.supportsInputFidelity).toBe(false);
    expect(caps.size).toBe(ARBITRARY_SQUARE);
  });

  it("does not mistake gpt-image-1 family members for gpt-image-2", () => {
    for (const model of ["gpt-image-1", "gpt-image-1.5", "gpt-image-1-mini"]) {
      const caps = imageModelCapabilities(model);
      expect(caps.supportsInputFidelity, model).toBe(true);
      expect(caps.supportsArbitrarySize, model).toBe(false);
      expect(caps.size, model).toBe(ENUMERATED_MAX_SQUARE);
    }
  });

  it("keeps enumerated sizing for unknown models rather than guessing", () => {
    // Arbitrary sizing is the narrower capability; assuming it for an unknown
    // model would 400. Enumerated 1024x1024 is accepted by every GPT image model.
    const caps = imageModelCapabilities("some-future-model");
    expect(caps.supportsArbitrarySize).toBe(false);
    expect(caps.size).toBe(ENUMERATED_MAX_SQUARE);
  });
});
