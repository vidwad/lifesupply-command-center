import { toFile } from "openai";
import type { ImageEditParamsNonStreaming } from "openai/resources/images";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";

import { getOpenAiClient, resolveOpenAiModel } from "@/server/integrations/openai/client";
import { AiProviderNotConfiguredError } from "@/server/services/ai/errors";

import { buildImageQaPrompt, buildProductResearchPrompt } from "./prompts";
import {
  productStudioQaSchema,
  productStudioResearchSchema,
  type ProductStudioQa,
  type ProductStudioResearch,
} from "./types";

type ReferenceAsset = {
  fileName: string;
  contentType: string;
  data: Uint8Array;
};

type Usage = { inputTokens: number | null; outputTokens: number | null };

export type ResearchCallResult = {
  result: ProductStudioResearch;
  prompt: string;
  rawOutput: string;
  modelName: string;
  usage: Usage;
  verifiedSourceUrls: string[];
};

const researchJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "identifiedProduct",
    "optimizedListing",
    "benchmarkListing",
    "market",
    "sources",
    "compositions",
    "methodology",
    "warnings",
  ],
  properties: {
    identifiedProduct: {
      type: "object",
      additionalProperties: false,
      required: [
        "brand",
        "model",
        "canonicalTitle",
        "modelIdentifiers",
        "conditionNotes",
        "confidence",
      ],
      properties: {
        brand: { type: "string" },
        model: { type: "string" },
        canonicalTitle: { type: "string" },
        modelIdentifiers: { type: "array", items: { type: "string" } },
        conditionNotes: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
    },
    optimizedListing: {
      type: "object",
      additionalProperties: false,
      required: ["title", "shortDescription", "keyDetails"],
      properties: {
        title: { type: "string" },
        shortDescription: { type: "string" },
        keyDetails: { type: "array", items: { type: "string" } },
      },
    },
    benchmarkListing: {
      type: "object",
      additionalProperties: false,
      required: [
        "sellerName",
        "url",
        "heroImageUrl",
        "whyStrongDescription",
        "whyStrongHero",
      ],
      properties: {
        sellerName: { type: "string" },
        url: { type: "string" },
        heroImageUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
        whyStrongDescription: { type: "string" },
        whyStrongHero: { type: "string" },
      },
    },
    market: {
      type: "object",
      additionalProperties: false,
      required: ["currency", "low", "high", "median", "basis", "observations"],
      properties: {
        currency: { type: "string" },
        low: { type: "number", minimum: 0 },
        high: { type: "number", minimum: 0 },
        median: { anyOf: [{ type: "number", minimum: 0 }, { type: "null" }] },
        basis: { type: "string" },
        observations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["sellerName", "url", "price", "currency", "condition"],
            properties: {
              sellerName: { type: "string" },
              url: { type: "string" },
              price: { type: "number", minimum: 0 },
              currency: { type: "string" },
              condition: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
          },
        },
      },
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sellerName",
          "pageTitle",
          "url",
          "heroImageUrl",
          "sourceType",
          "notes",
        ],
        properties: {
          sellerName: { type: "string" },
          pageTitle: { anyOf: [{ type: "string" }, { type: "null" }] },
          url: { type: "string" },
          heroImageUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
          sourceType: {
            type: "string",
            enum: ["manufacturer", "retailer", "used_specialist", "marketplace"],
          },
          notes: { type: "string" },
        },
      },
    },
    compositions: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "slot",
          "name",
          "sourceSeller",
          "sourceUrl",
          "referenceImageUrl",
          "whyEffective",
          "layout",
          "background",
          "lighting",
          "cameraAngle",
          "productPlacement",
          "props",
          "negativeConstraints",
        ],
        properties: {
          slot: { type: "integer", minimum: 1, maximum: 4 },
          name: { type: "string" },
          sourceSeller: { anyOf: [{ type: "string" }, { type: "null" }] },
          sourceUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
          referenceImageUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
          whyEffective: { type: "string" },
          layout: { type: "string" },
          background: { type: "string" },
          lighting: { type: "string" },
          cameraAngle: { type: "string" },
          productPlacement: { type: "string" },
          props: { type: "array", items: { type: "string" } },
          negativeConstraints: { type: "array", items: { type: "string" } },
        },
      },
    },
    methodology: { type: "string" },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

const qaJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "identityScore",
    "conditionFidelityScore",
    "compositionScore",
    "textIntegrity",
    "verdict",
    "differences",
    "warnings",
  ],
  properties: {
    identityScore: { type: "number", minimum: 0, maximum: 1 },
    conditionFidelityScore: { type: "number", minimum: 0, maximum: 1 },
    compositionScore: { type: "number", minimum: 0, maximum: 1 },
    textIntegrity: { type: "string", enum: ["pass", "not_applicable", "fail"] },
    verdict: { type: "string", enum: ["pass", "needs_review", "reject"] },
    differences: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

function asDataUrl(asset: ReferenceAsset): string {
  return `data:${asset.contentType};base64,${Buffer.from(asset.data).toString("base64")}`;
}

function parseJson<T>(raw: string, parser: { parse: (value: unknown) => T }): T {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return parser.parse(JSON.parse(trimmed));
}

function collectHttpUrls(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) found.add(value);
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectHttpUrls(item, found);
    return found;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectHttpUrls(item, found);
  }
  return found;
}

function hostname(value: string): string {
  return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
}

export async function researchProduct(args: {
  title: string;
  shortDescription: string;
  references: ReferenceAsset[];
}): Promise<ResearchCallResult> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const model = await resolveOpenAiModel();
  const prompt = buildProductResearchPrompt({
    title: args.title,
    shortDescription: args.shortDescription,
    sourcePhotoCount: args.references.length,
  });

  const content = [
    { type: "input_text", text: prompt },
    ...args.references.map((asset) => ({
      type: "input_image",
      image_url: asDataUrl(asset),
      detail: "high",
    })),
  ];
  const request = {
    model,
    stream: false,
    tools: [{ type: "web_search" }],
    include: ["web_search_call.action.sources"],
    input: [{ role: "user", content }],
    text: {
      format: {
        type: "json_schema",
        name: "product_studio_research",
        strict: true,
        schema: researchJsonSchema,
      },
    },
  } as unknown as ResponseCreateParamsNonStreaming;

  const response = await client.responses.create(request);
  const rawOutput = response.output_text.trim();
  if (!rawOutput) throw new Error("OpenAI returned an empty product research response.");
  const result = parseJson(rawOutput, productStudioResearchSchema);
  const verifiedSourceUrls = [...collectHttpUrls(response.output)];
  const verifiedHosts = new Set(verifiedSourceUrls.map(hostname));
  if (verifiedHosts.size === 0) {
    throw new Error("Research returned no verifiable web-search source URLs.");
  }
  const unsupported = [
    result.benchmarkListing,
    ...result.sources,
    ...result.market.observations,
  ].filter((source) => !verifiedHosts.has(hostname(source.url)));
  if (unsupported.length > 0) {
    throw new Error(
      `Research cited source domains that were not present in the web-search evidence: ${[
        ...new Set(unsupported.map((source) => hostname(source.url))),
      ].join(", ")}`,
    );
  }

  return {
    result,
    prompt,
    rawOutput,
    modelName: response.model,
    usage: {
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
    verifiedSourceUrls,
  };
}

export type GeneratedImage = {
  data: Buffer;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  modelName: string;
};

export async function generateProductImage(args: {
  prompt: string;
  references: ReferenceAsset[];
}): Promise<GeneratedImage> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
  const files = await Promise.all(
    args.references.map((asset) =>
      toFile(Buffer.from(asset.data), asset.fileName, { type: asset.contentType }),
    ),
  );

  const request = {
    model,
    stream: false,
    image: files,
    prompt: args.prompt,
    input_fidelity: "high",
    quality: "high",
    size: "2048x2048",
    output_format: "jpeg",
  } as unknown as ImageEditParamsNonStreaming;
  const response = await client.images.edit(request);
  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) throw new Error("OpenAI returned no image payload.");

  return { data: Buffer.from(encoded, "base64"), contentType: "image/jpeg", modelName: model };
}

export async function qaProductImage(args: {
  title: string;
  compositionName: string;
  references: ReferenceAsset[];
  generated: GeneratedImage;
}): Promise<{ result: ProductStudioQa; modelName: string; rawOutput: string; usage: Usage }> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const model = await resolveOpenAiModel();
  const prompt = buildImageQaPrompt({
    title: args.title,
    compositionName: args.compositionName,
  });
  const generatedUrl = `data:${args.generated.contentType};base64,${args.generated.data.toString("base64")}`;
  const content = [
    { type: "input_text", text: prompt },
    ...args.references.map((asset) => ({
      type: "input_image",
      image_url: asDataUrl(asset),
      detail: "high",
    })),
    { type: "input_image", image_url: generatedUrl, detail: "high" },
  ];
  const request = {
    model,
    stream: false,
    input: [{ role: "user", content }],
    text: {
      format: {
        type: "json_schema",
        name: "product_studio_image_qa",
        strict: true,
        schema: qaJsonSchema,
      },
    },
  } as unknown as ResponseCreateParamsNonStreaming;
  const response = await client.responses.create(request);
  const rawOutput = response.output_text.trim();
  if (!rawOutput) throw new Error("OpenAI returned an empty Product Studio QA response.");

  return {
    result: parseJson(rawOutput, productStudioQaSchema),
    modelName: response.model,
    rawOutput,
    usage: {
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
  };
}
