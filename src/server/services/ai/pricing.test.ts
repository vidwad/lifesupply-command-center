import { describe, expect, it } from "vitest";

import { estimateCostUsd, FALLBACK_RATES, MODEL_RATES, rateForModel } from "./pricing";

describe("rateForModel", () => {
  it("matches the longest prefix, so a variant is not priced as its base model", () => {
    expect(rateForModel("gpt-5-mini-2026-08-07", "text").rate).toBe(
      MODEL_RATES.find(([p]) => p === "gpt-5-mini")![1],
    );
    expect(rateForModel("gpt-5", "text").rate).toBe(MODEL_RATES.find(([p]) => p === "gpt-5")![1]);
    expect(rateForModel("gpt-realtime-mini", "realtime").rate).toBe(
      MODEL_RATES.find(([p]) => p === "gpt-realtime-mini")![1],
    );
    expect(rateForModel("gpt-4o-mini-transcribe", "transcription").rate).toBe(
      MODEL_RATES.find(([p]) => p === "gpt-4o-mini-transcribe")![1],
    );
  });

  it("prices an unknown model at the dearest rate of its kind, so a cap stops early rather than failing open", () => {
    const unknown = rateForModel("gpt-9-ultra", "text");
    expect(unknown.known).toBe(false);
    expect(unknown.rate).toBe(FALLBACK_RATES.text);
    for (const [, rate] of MODEL_RATES) {
      if (rate.inputAudio == null && rate.perAudioMinute == null && rate.outputImage == null) {
        expect(rate.inputText).toBeLessThanOrEqual(FALLBACK_RATES.text.inputText);
        expect(rate.outputText).toBeLessThanOrEqual(FALLBACK_RATES.text.outputText);
      }
    }
  });

  it("is case-insensitive", () => {
    expect(rateForModel("GPT-5-Mini", "text").known).toBe(true);
  });
});

describe("estimateCostUsd", () => {
  it("prices a text call from input and output tokens", () => {
    // gpt-5-mini: $0.25 in, $2 out per million.
    const { usd, known } = estimateCostUsd("gpt-5-mini", "text", {
      inputTokens: 1_000_000,
      outputTokens: 500_000,
    });
    expect(known).toBe(true);
    expect(usd).toBeCloseTo(0.25 + 1, 4);
  });

  it("charges cached input at the cached rate, not the full rate", () => {
    const full = estimateCostUsd("gpt-5", "text", { inputTokens: 1_000_000, outputTokens: 0 });
    const cached = estimateCostUsd("gpt-5", "text", {
      inputTokens: 1_000_000,
      cachedInputTokens: 1_000_000,
      outputTokens: 0,
    });
    expect(full.usd).toBeCloseTo(1.25, 4);
    expect(cached.usd).toBeCloseTo(0.125, 4);
  });

  it("prices realtime audio tokens at the audio rate and the rest as text", () => {
    // gpt-realtime: text $4/$16, audio $32/$64 per million.
    const { usd } = estimateCostUsd("gpt-realtime", "realtime", {
      inputTokens: 10_000,
      audioInputTokens: 8_000,
      outputTokens: 5_000,
      audioOutputTokens: 5_000,
    });
    const expected = (2_000 / 1e6) * 4 + (8_000 / 1e6) * 32 + (5_000 / 1e6) * 64;
    expect(usd).toBeCloseTo(expected, 4);
  });

  it("prices an image call's output tokens as image output, never as text", () => {
    // gpt-image-1: image output $40 per million; a 1024px high-quality
    // image is about 4,160 tokens.
    const { usd } = estimateCostUsd("gpt-image-1", "image", {
      inputTokens: 300,
      outputTokens: 4_160,
    });
    expect(usd).toBeCloseTo((300 / 1e6) * 5 + (4_160 / 1e6) * 40, 4);
  });

  it("prices a GPT-Live session by the second, at five cents a minute", () => {
    const { usd, known } = estimateCostUsd("gpt-live-1", "realtime", { audioSeconds: 90 });
    expect(known).toBe(true);
    expect(usd).toBeCloseTo(0.075, 4);
    // Tokens the session itself reports are not priced twice.
    expect(
      estimateCostUsd("gpt-live-1", "realtime", { audioSeconds: 60, inputTokens: 1000 }).usd,
    ).toBeCloseTo(0.05, 4);
  });

  it("prices whisper by the minute", () => {
    const { usd } = estimateCostUsd("whisper-1", "transcription", { audioSeconds: 120 });
    expect(usd).toBeCloseTo(0.012, 4);
  });

  it("prices token-billed transcription from audio input tokens", () => {
    // gpt-4o-mini-transcribe: $3 per million audio input tokens.
    const { usd } = estimateCostUsd("gpt-4o-mini-transcribe", "transcription", {
      inputTokens: 1_000,
      audioInputTokens: 1_000,
      outputTokens: 50,
    });
    expect(usd).toBeCloseTo((1_000 / 1e6) * 3 + (50 / 1e6) * 5, 4);
  });

  it("treats absent, negative and non-finite counts as zero", () => {
    expect(estimateCostUsd("gpt-5", "text", {}).usd).toBe(0);
    expect(estimateCostUsd("gpt-5", "text", { inputTokens: -5, outputTokens: NaN }).usd).toBe(0);
  });

  it("rounds to the ledger's four decimals", () => {
    const { usd } = estimateCostUsd("gpt-5-nano", "text", { inputTokens: 7, outputTokens: 3 });
    expect(usd).toBe(Math.round(usd * 10_000) / 10_000);
  });
});
