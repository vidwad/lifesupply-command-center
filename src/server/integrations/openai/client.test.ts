import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const settings = new Map<string, string>();

vi.mock("@/server/services/system-settings", () => ({
  getSetting: async (key: string) => settings.get(key) ?? "",
}));
vi.mock("@/server/services/integrations", () => ({
  resolveCredential: async () => null,
}));

import {
  DEFAULT_OPENAI_IMAGE_MODEL,
  DEFAULT_OPENAI_MODEL,
  resolveOpenAiImageModel,
  resolveOpenAiModel,
} from "./client";

const ENV = ["OPENAI_MODEL", "OPENAI_IMAGE_MODEL"] as const;
const saved: Partial<Record<(typeof ENV)[number], string | undefined>> = {};

beforeEach(() => {
  settings.clear();
  for (const key of ENV) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});
afterEach(() => {
  for (const key of ENV) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("the OpenAI text model", () => {
  it("falls back to the built-in default when nothing is configured", async () => {
    settings.set("ai.default_provider", "anthropic");
    expect(await resolveOpenAiModel()).toBe(DEFAULT_OPENAI_MODEL);
  });
  it("uses the shared default model only when the provider is OpenAI", async () => {
    settings.set("ai.default_provider", "openai");
    settings.set("ai.default_model", "gpt-5");
    expect(await resolveOpenAiModel()).toBe("gpt-5");
    settings.set("ai.default_provider", "anthropic");
    expect(await resolveOpenAiModel()).toBe(DEFAULT_OPENAI_MODEL);
  });
  it("prefers the dedicated Product Studio setting over the shared one", async () => {
    settings.set("ai.default_provider", "openai");
    settings.set("ai.default_model", "gpt-5");
    settings.set("ai.openai_model", "gpt-4.1");
    expect(await resolveOpenAiModel()).toBe("gpt-4.1");
  });
  it("lets the environment win over every setting", async () => {
    settings.set("ai.openai_model", "gpt-4.1");
    process.env.OPENAI_MODEL = "gpt-5";
    expect(await resolveOpenAiModel()).toBe("gpt-5");
  });
});

describe("the OpenAI image model", () => {
  it("falls back to the built-in default, then the setting, then the environment", async () => {
    expect(await resolveOpenAiImageModel()).toBe(DEFAULT_OPENAI_IMAGE_MODEL);
    settings.set("ai.openai_image_model", "gpt-image-2");
    expect(await resolveOpenAiImageModel()).toBe("gpt-image-2");
    process.env.OPENAI_IMAGE_MODEL = "gpt-image-1";
    expect(await resolveOpenAiImageModel()).toBe("gpt-image-1");
  });
  it("treats a blank setting as unset", async () => {
    settings.set("ai.openai_image_model", "   ");
    expect(await resolveOpenAiImageModel()).toBe(DEFAULT_OPENAI_IMAGE_MODEL);
  });
});
