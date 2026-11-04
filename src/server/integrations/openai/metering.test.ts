import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const recorded: unknown[] = [];
vi.mock("@/server/services/ai/budget", () => ({
  recordAiUsage: async (input: unknown) => {
    recorded.push(input);
  },
}));

import {
  meteredFetch,
  modelFromRequestBody,
  normaliseOpenAiUsage,
  parseSseUsage,
  usageKindForRequest,
} from "./metering";

beforeEach(() => {
  recorded.length = 0;
});

describe("usageKindForRequest", () => {
  it("meters the billable POST endpoints and nothing else", () => {
    expect(usageKindForRequest("https://api.openai.com/v1/responses", "POST")).toBe("text");
    expect(usageKindForRequest("https://api.openai.com/v1/chat/completions", "post")).toBe("text");
    expect(usageKindForRequest("https://api.openai.com/v1/images/edits", "POST")).toBe("image");
    expect(usageKindForRequest("https://api.openai.com/v1/images/generations", "POST")).toBe(
      "image",
    );
    expect(usageKindForRequest("https://api.openai.com/v1/audio/transcriptions", "POST")).toBe(
      "transcription",
    );
    expect(usageKindForRequest("https://api.openai.com/v1/models", "GET")).toBeNull();
    expect(
      usageKindForRequest("https://api.openai.com/v1/realtime/client_secrets", "POST"),
    ).toBeNull();
    expect(usageKindForRequest("https://api.openai.com/v1/responses/resp_123", "GET")).toBeNull();
  });
});

describe("modelFromRequestBody", () => {
  it("reads the model from a JSON body and from multipart form data", () => {
    expect(modelFromRequestBody(JSON.stringify({ model: "gpt-5-mini", input: "x" }))).toBe(
      "gpt-5-mini",
    );
    const form = new FormData();
    form.set("model", "gpt-image-1.5");
    expect(modelFromRequestBody(form)).toBe("gpt-image-1.5");
    expect(modelFromRequestBody("not json")).toBeNull();
    expect(modelFromRequestBody(undefined)).toBeNull();
  });
});

describe("normaliseOpenAiUsage", () => {
  it("reads the Responses dialect", () => {
    expect(
      normaliseOpenAiUsage(
        {
          input_tokens: 120,
          output_tokens: 40,
          input_tokens_details: { cached_tokens: 100 },
          output_tokens_details: { reasoning_tokens: 10 },
        },
        "text",
      ),
    ).toMatchObject({ inputTokens: 120, outputTokens: 40, cachedInputTokens: 100 });
  });

  it("reads the Chat Completions dialect", () => {
    expect(
      normaliseOpenAiUsage(
        {
          prompt_tokens: 50,
          completion_tokens: 20,
          prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
        },
        "text",
      ),
    ).toMatchObject({ inputTokens: 50, outputTokens: 20, cachedInputTokens: 0 });
  });

  it("reads the image dialect, counting output tokens as image output", () => {
    expect(
      normaliseOpenAiUsage(
        {
          input_tokens: 400,
          output_tokens: 4160,
          input_tokens_details: { image_tokens: 300, text_tokens: 100 },
        },
        "image",
      ),
    ).toMatchObject({
      inputTokens: 400,
      outputTokens: 4160,
      imageInputTokens: 300,
      imageOutputTokens: 4160,
    });
  });

  it("reads the transcription and Realtime dialect with its singular detail keys", () => {
    expect(
      normaliseOpenAiUsage(
        {
          input_tokens: 900,
          output_tokens: 30,
          input_token_details: { text_tokens: 0, audio_tokens: 900 },
          output_token_details: { text_tokens: 30, audio_tokens: 0 },
        },
        "transcription",
      ),
    ).toMatchObject({
      inputTokens: 900,
      outputTokens: 30,
      audioInputTokens: 900,
      audioOutputTokens: 0,
    });
    expect(normaliseOpenAiUsage({ type: "duration", seconds: 61 }, "transcription")).toEqual({
      audioSeconds: 61,
    });
  });

  it("returns null when there is nothing to count", () => {
    expect(normaliseOpenAiUsage(null, "text")).toBeNull();
    expect(normaliseOpenAiUsage({}, "text")).toBeNull();
    expect(normaliseOpenAiUsage({ type: "duration" }, "transcription")).toBeNull();
  });
});

describe("parseSseUsage", () => {
  it("takes the usage from the Responses stream's completed event", () => {
    const text = [
      'data: {"type":"response.created","response":{"id":"r1"}}',
      "",
      'data: {"type":"response.output_text.delta","delta":"hi"}',
      "",
      'data: {"type":"response.completed","response":{"model":"gpt-5-mini-2026-08-07","usage":{"input_tokens":10,"output_tokens":2}}}',
      "",
      "data: [DONE]",
    ].join("\n");
    expect(parseSseUsage(text)).toEqual({
      usage: { input_tokens: 10, output_tokens: 2 },
      model: "gpt-5-mini-2026-08-07",
    });
  });

  it("takes the usage from a Chat stream's final chunk and ignores broken lines", () => {
    const text = [
      'data: {"choices":[{"delta":{"content":"a"}}],"usage":null,"model":"gpt-4.1"}',
      "data: {not json",
      'data: {"choices":[],"usage":{"prompt_tokens":5,"completion_tokens":1},"model":"gpt-4.1"}',
    ].join("\n");
    expect(parseSseUsage(text)).toEqual({
      usage: { prompt_tokens: 5, completion_tokens: 1 },
      model: "gpt-4.1",
    });
  });
});

describe("meteredFetch", () => {
  const jsonResponse = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  it("records a JSON response's usage under the attribution and returns the body intact", async () => {
    const fetchImpl = meteredFetch({ userId: "u1", feature: "analyst_query" }, async () =>
      jsonResponse({
        model: "gpt-5-mini",
        usage: { input_tokens: 10, output_tokens: 3 },
        output_text: "ok",
      }),
    );
    const res = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      body: JSON.stringify({ model: "gpt-5-mini" }),
    });
    expect((await res.json()).output_text).toBe("ok");
    expect(recorded).toEqual([
      {
        userId: "u1",
        feature: "analyst_query",
        kind: "text",
        modelName: "gpt-5-mini",
        usage: {
          inputTokens: 10,
          outputTokens: 3,
          cachedInputTokens: undefined,
          audioInputTokens: undefined,
          audioOutputTokens: undefined,
          imageInputTokens: undefined,
          imageOutputTokens: undefined,
        },
        metadata: { endpoint: "/v1/responses" },
      },
    ]);
  });

  it("falls back to the request's model when the response names none", async () => {
    const fetchImpl = meteredFetch({ feature: "product_studio.image_generation" }, async () =>
      jsonResponse({ data: [{ b64_json: "" }], usage: { input_tokens: 50, output_tokens: 4160 } }),
    );
    const form = new FormData();
    form.set("model", "gpt-image-1.5");
    await fetchImpl("https://api.openai.com/v1/images/edits", { method: "POST", body: form });
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({ kind: "image", modelName: "gpt-image-1.5", userId: null });
  });

  it("records nothing for an unmetered endpoint, a failed call, or a response without usage", async () => {
    const list = meteredFetch({ feature: "x" }, async () => jsonResponse({ data: [] }));
    await list("https://api.openai.com/v1/models", { method: "GET" });
    const failed = meteredFetch({ feature: "x" }, async () => new Response("{}", { status: 429 }));
    await failed("https://api.openai.com/v1/responses", { method: "POST", body: "{}" });
    const silent = meteredFetch({ feature: "x" }, async () => jsonResponse({ output_text: "" }));
    await silent("https://api.openai.com/v1/responses", { method: "POST", body: "{}" });
    expect(recorded).toEqual([]);
  });

  it("records a streamed response from its completed event without holding the stream", async () => {
    const sse = [
      'data: {"type":"response.output_text.delta","delta":"a"}',
      "",
      'data: {"type":"response.completed","response":{"model":"gpt-5","usage":{"input_tokens":4,"output_tokens":1}}}',
      "",
    ].join("\n");
    const fetchImpl = meteredFetch(
      { feature: "assistant.text" },
      async () =>
        new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } }),
    );
    const res = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      body: "{}",
    });
    expect(await res.text()).toBe(sse);
    await new Promise((r) => setTimeout(r, 0));
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      kind: "text",
      modelName: "gpt-5",
      feature: "assistant.text",
    });
  });
});

describe("every OpenAI call goes through the metered client", () => {
  const ROOT = join(__dirname, "..", "..", "..", "..");
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

  it("only the model listing opts out of metering", () => {
    const models = read("src/server/integrations/openai/models.ts");
    expect(models).toContain("getOpenAiClient({ metered: false })");
    for (const rel of [
      "src/server/services/ai/call.ts",
      "src/server/services/product-studio/openai.ts",
    ]) {
      const code = read(rel);
      expect(code, rel).not.toContain("metered: false");
      expect(code, rel).not.toContain("getOpenAiClient()");
    }
  });

  it("names a feature at every Product Studio call site, and the template at the shared wrapper", () => {
    const studio = read("src/server/services/product-studio/openai.ts");
    const sites =
      studio.match(/getOpenAiClient\(\{ feature: "product_studio\.[a-z_]+" \}\)/g) ?? [];
    expect(sites).toHaveLength(5);
    const call = read("src/server/services/ai/call.ts");
    expect(call).toContain(
      "getOpenAiClient({ userId: options.actorUserId, feature: templateKey })",
    );
  });

  it("no service builds its own OpenAI client around the wrapper", () => {
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
      }
      return out;
    };
    for (const file of walk(join(ROOT, "src"))) {
      if (file.endsWith(join("integrations", "openai", "client.ts"))) continue;
      expect(readFileSync(file, "utf8"), file).not.toMatch(/new OpenAI\(/);
    }
  });
});
