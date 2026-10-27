import { describe, expect, it } from "vitest";

import { pickModelChoices } from "./models";

describe("narrowing the OpenAI model list to the two fields", () => {
  it("keeps the chat families and the image models, and drops variants Product Studio cannot drive", () => {
    const choices = pickModelChoices([
      "gpt-5",
      "gpt-5-mini",
      "gpt-5-mini",
      "gpt-4.1",
      "gpt-4.1-nano",
      "o3",
      "o4-mini",
      "gpt-5-pro",
      "gpt-4o-audio-preview",
      "gpt-4o-realtime-preview",
      "gpt-4o-mini-tts",
      "gpt-4o-transcribe",
      "gpt-4o-search-preview",
      "text-embedding-3-large",
      "omni-moderation-latest",
      "gpt-5-codex",
      "gpt-image-1",
      "gpt-image-1.5",
      "gpt-image-2",
      "dall-e-3",
      "whisper-1",
    ]);
    expect(choices.text).toEqual([
      "gpt-4.1",
      "gpt-4.1-nano",
      "gpt-5",
      "gpt-5-mini",
      "o3",
      "o4-mini",
    ]);
    expect(choices.image).toEqual(["gpt-image-1", "gpt-image-1.5", "gpt-image-2"]);
  });
  it("returns empty lists for an empty account", () => {
    expect(pickModelChoices([])).toEqual({ text: [], image: [] });
  });
});
