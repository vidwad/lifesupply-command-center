import { toFile } from "openai";
import type { ImageEditParamsNonStreaming } from "openai/resources/images";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { imageModelCapabilities } from "./image-model";

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
      required: ["sellerName", "url", "heroImageUrl", "whyStrongDescription", "whyStrongHero"],
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
            required: [
              "sellerName",
              "url",
              "price",
              "currency",
              "condition",
              "includedAccessories",
              "notes",
            ],
            properties: {
              sellerName: { type: "string" },
              url: { type: "string" },
              price: { type: "number", minimum: 0 },
              currency: { type: "string" },
              condition: { anyOf: [{ type: "string" }, { type: "null" }] },
              includedAccessories: { anyOf: [{ type: "string" }, { type: "null" }] },
              notes: { anyOf: [{ type: "string" }, { type: "null" }] },
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
        required: ["sellerName", "pageTitle", "url", "heroImageUrl", "sourceType", "notes"],
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
          "purpose",
          "sourceSeller",
          "sourceUrl",
          "referenceImageUrl",
          "whyEffective",
          "layout",
          "background",
          "lighting",
          "cameraAngle",
          "productOrientation",
          "productPlacement",
          "shadowTreatment",
          "cropAndNegativeSpace",
          "depthOfField",
          "props",
          "accessoriesExclude",
          "conditionMustShow",
          "negativeConstraints",
        ],
        properties: {
          slot: { type: "integer", minimum: 1, maximum: 4 },
          name: { type: "string" },
          purpose: { type: "string" },
          sourceSeller: { anyOf: [{ type: "string" }, { type: "null" }] },
          sourceUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
          referenceImageUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
          whyEffective: { type: "string" },
          layout: { type: "string" },
          background: { type: "string" },
          lighting: { type: "string" },
          cameraAngle: { type: "string" },
          productOrientation: { type: "string" },
          productPlacement: { type: "string" },
          shadowTreatment: { type: "string" },
          cropAndNegativeSpace: { type: "string" },
          depthOfField: { type: "string" },
          props: { type: "array", items: { type: "string" } },
          accessoriesExclude: { type: "array", items: { type: "string" } },
          conditionMustShow: { type: "array", items: { type: "string" } },
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
    "requiredCorrections",
    "warnings",
    "confidence",
  ],
  properties: {
    identityScore: { type: "number", minimum: 0, maximum: 1 },
    conditionFidelityScore: { type: "number", minimum: 0, maximum: 1 },
    compositionScore: { type: "number", minimum: 0, maximum: 1 },
    textIntegrity: { type: "string", enum: ["pass", "not_applicable", "fail"] },
    verdict: { type: "string", enum: ["pass", "needs_review", "reject"] },
    differences: { type: "array", items: { type: "string" } },
    requiredCorrections: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

function asDataUrl(asset: ReferenceAsset): string {
  return `data:${asset.contentType};base64,${Buffer.from(asset.data).toString("base64")}`;
}

function parseJson<T>(raw: string, parser: { parse: (value: unknown) => T }): T {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return parser.parse(JSON.parse(trimmed));
}

function collectHttpUrls(value: unknown, found: Set<string>): Set<string> {
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

/**
 * Collect the URLs that constitute actual web-search evidence: the
 * `web_search_call` tool items (queries, actions, and included sources) and
 * the API-attached `url_citation` annotations on message content. The
 * model-authored message TEXT is deliberately excluded — a URL the model
 * merely wrote in its answer is a claim, not evidence, and must never be
 * allowed to vouch for itself.
 */
export function collectWebSearchEvidenceUrls(output: unknown): string[] {
  const found = new Set<string>();
  if (!Array.isArray(output)) return [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "web_search_call") {
      collectHttpUrls(record, found);
      continue;
    }
    if (record.type === "message" && Array.isArray(record.content)) {
      for (const part of record.content) {
        if (!part || typeof part !== "object") continue;
        const annotations = (part as Record<string, unknown>).annotations;
        if (!Array.isArray(annotations)) continue;
        for (const annotation of annotations) {
          if (!annotation || typeof annotation !== "object") continue;
          const a = annotation as Record<string, unknown>;
          if (a.type === "url_citation" && typeof a.url === "string") {
            collectHttpUrls(a.url, found);
          }
        }
      }
    }
  }
  return [...found];
}

function hostname(value: string): string {
  return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
}

/**
 * Return the cited seller domains that are NOT backed by web-search
 * evidence. Verification is by registrable host (www-insensitive): the model
 * may cite a canonical product URL while the evidence recorded a variant of
 * the same page, but it may never introduce a seller domain the search
 * results do not contain.
 */
export function findUnsupportedCitedDomains(
  research: ProductStudioResearch,
  evidenceUrls: string[],
): string[] {
  const verifiedHosts = new Set(evidenceUrls.map(hostname));
  const cited = [research.benchmarkListing, ...research.sources, ...research.market.observations];
  return [
    ...new Set(
      cited.map((source) => hostname(source.url)).filter((host) => !verifiedHosts.has(host)),
    ),
  ];
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
  const verifiedSourceUrls = collectWebSearchEvidenceUrls(response.output);
  if (verifiedSourceUrls.length === 0) {
    throw new Error("Research returned no verifiable web-search source URLs.");
  }
  const unsupported = findUnsupportedCitedDomains(result, verifiedSourceUrls);
  if (unsupported.length > 0) {
    throw new Error(
      `Research cited source domains that were not present in the web-search evidence: ${unsupported.join(", ")}`,
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
  const caps = imageModelCapabilities(process.env.OPENAI_IMAGE_MODEL);
  const files = await Promise.all(
    args.references.map((asset) =>
      toFile(Buffer.from(asset.data), asset.fileName, { type: asset.contentType }),
    ),
  );

  // Built per model: an unsupported parameter is a hard 400, not an ignored
  // field. gpt-image-2 rejects input_fidelity; earlier models reject arbitrary
  // sizes. See image-model.ts for the capability matrix.
  const request: ImageEditParamsNonStreaming = {
    model: caps.model,
    stream: false,
    image: files,
    prompt: args.prompt,
    quality: "high",
    size: caps.size,
    output_format: "jpeg",
    ...(caps.supportsInputFidelity ? { input_fidelity: "high" as const } : {}),
  };
  const response = await client.images.edit(request);
  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) throw new Error("OpenAI returned no image payload.");

  return { data: Buffer.from(encoded, "base64"), contentType: "image/jpeg", modelName: caps.model };
}

export async function qaProductImage(args: {
  title: string;
  compositionName: string;
  compositionBrief: string[];
  identity: {
    brand: string;
    model: string;
    modelIdentifiers: string[];
    conditionNotes: string[];
  } | null;
  references: ReferenceAsset[];
  generated: GeneratedImage;
}): Promise<{ result: ProductStudioQa; modelName: string; rawOutput: string; usage: Usage }> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const model = await resolveOpenAiModel();
  const prompt = buildImageQaPrompt({
    title: args.title,
    compositionName: args.compositionName,
    compositionBrief: args.compositionBrief,
    identity: args.identity,
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
