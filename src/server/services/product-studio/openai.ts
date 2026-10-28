import { toFile } from "openai";
import type { ImageEditParamsNonStreaming } from "openai/resources/images";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { imageModelCapabilities } from "./image-model";
import type { ProductMode } from "./depiction";
import { sizeForAspect, type FrameAspect } from "./prompt-controls";

import {
  getOpenAiClient,
  resolveOpenAiImageModel,
  resolveOpenAiModel,
} from "@/server/integrations/openai/client";
import { AiProviderNotConfiguredError } from "@/server/services/ai/errors";

import { z } from "zod";

import {
  buildImageQaPrompt,
  buildProductResearchPrompt,
  buildSellerImageSearchPrompt,
} from "./prompts";
import { buildDescriptionReformatPrompt } from "./reformat-prompt";
import {
  productStudioQaSchema,
  productStudioResearchSchema,
  sellerImageSearchSchema,
  type ProductStudioQa,
  type ProductStudioResearch,
  type SellerImageSearch,
} from "./types";

type ReferenceAsset = {
  fileName: string;
  contentType: string;
  data: Uint8Array;
};

type Usage = { inputTokens: number | null; outputTokens: number | null };

export type ResearchCallResult = {
  result: ProductStudioResearch;
  /** Seller domains the model cited without search evidence, removed before storage. */
  droppedSourceDomains: string[];
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
        "productMode",
        "depictableSpec",
        "confidence",
      ],
      properties: {
        brand: { type: "string" },
        model: { type: "string" },
        canonicalTitle: { type: "string" },
        modelIdentifiers: { type: "array", items: { type: "string" } },
        conditionNotes: { type: "array", items: { type: "string" } },
        productMode: { type: "string", enum: ["new_sealed", "used"] },
        depictableSpec: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
    },
    optimizedListing: {
      type: "object",
      additionalProperties: false,
      required: ["title", "shortDescription", "longDescription", "keyDetails"],
      properties: {
        title: { type: "string" },
        shortDescription: { type: "string" },
        longDescription: { type: "string" },
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

export type EvidenceReconciliation = {
  research: ProductStudioResearch;
  /** Cited domains that were not in the evidence and were removed. */
  droppedDomains: string[];
  /** Hosts the evidence did cover, for a failure message a reader can act on. */
  evidenceHosts: string[];
};

export class UnverifiableResearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnverifiableResearchError";
  }
}

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/**
 * Removes every citation the web-search evidence does not back, instead of
 * rejecting the whole research (2026-10-26): a model that searched five
 * sellers and then added two from memory produced evidence worth keeping.
 *
 * - Sources and price observations on an unverified domain are dropped; the
 *   market range is recomputed from the remaining observations when they
 *   share the stated currency, otherwise the model's figures stay with a
 *   warning.
 * - A composition's source and reference URLs on an unverified domain are
 *   cleared; the brief itself stays, since it describes a photograph rather
 *   than citing a claim.
 * - An unverified benchmark listing is reassigned to the first verified
 *   source, keeping the model's reasoning about what makes a listing strong.
 * - The dropped domains are written into the research warnings so they are
 *   visible on the project and in the AI output record.
 *
 * Throws only when nothing verifiable remains: no source, or no price
 * observation, in which case the message names what the evidence did cover.
 */
export function reconcileResearchWithEvidence(
  research: ProductStudioResearch,
  evidenceUrls: string[],
): EvidenceReconciliation {
  const verified = new Set(evidenceUrls.map(hostname));
  const supported = (url: string) => verified.has(hostname(url));
  const dropped = new Set<string>();
  const note = (url: string) => dropped.add(hostname(url));

  const sources = research.sources.filter(
    (source) => supported(source.url) || (note(source.url), false),
  );
  const observations = research.market.observations.filter(
    (item) => supported(item.url) || (note(item.url), false),
  );
  const evidenceHosts = [...verified].sort();
  if (sources.length === 0) {
    throw new UnverifiableResearchError(
      "Research cited no seller present in the web-search evidence (cited: " +
        [...dropped].join(", ") +
        "; evidence covered: " +
        (evidenceHosts.join(", ") || "nothing") +
        ").",
    );
  }
  if (observations.length === 0) {
    throw new UnverifiableResearchError(
      "Every price observation cited a seller absent from the web-search evidence (" +
        [...dropped].join(", ") +
        "), so no market range can be kept. Evidence covered: " +
        (evidenceHosts.join(", ") || "nothing") +
        ".",
    );
  }

  const warnings = [...research.warnings];
  let market = { ...research.market, observations };
  if (observations.length !== research.market.observations.length) {
    const prices = observations
      .filter((item) => item.currency.toUpperCase() === research.market.currency.toUpperCase())
      .map((item) => item.price);
    if (prices.length === observations.length) {
      market = {
        ...market,
        low: Math.min(...prices),
        high: Math.max(...prices),
        median: median(prices),
      };
    } else {
      warnings.push(
        "The market range was stated by the model over observations that included dropped " +
          "sellers and mixed currencies; it was not recomputed.",
      );
    }
  }

  let benchmarkListing = research.benchmarkListing;
  if (!supported(benchmarkListing.url)) {
    note(benchmarkListing.url);
    const replacement = sources[0]!;
    benchmarkListing = {
      ...benchmarkListing,
      sellerName: replacement.sellerName,
      url: replacement.url,
      heroImageUrl: replacement.heroImageUrl,
    };
    warnings.push(
      "The benchmark listing cited a seller absent from the search evidence and was reassigned " +
        "to " +
        replacement.sellerName +
        ".",
    );
  }

  const compositions = research.compositions.map((composition) => {
    const sourceOk = composition.sourceUrl == null || supported(composition.sourceUrl);
    const imageOk =
      composition.referenceImageUrl == null || supported(composition.referenceImageUrl);
    if (sourceOk && imageOk) return composition;
    if (composition.sourceUrl && !sourceOk) note(composition.sourceUrl);
    if (composition.referenceImageUrl && !imageOk) note(composition.referenceImageUrl);
    return {
      ...composition,
      sourceSeller: sourceOk ? composition.sourceSeller : null,
      sourceUrl: sourceOk ? composition.sourceUrl : null,
      referenceImageUrl: imageOk ? composition.referenceImageUrl : null,
    };
  });

  const droppedDomains = [...dropped].sort();
  if (droppedDomains.length > 0) {
    warnings.push(
      "Dropped citations from " +
        String(droppedDomains.length) +
        " seller domain" +
        (droppedDomains.length === 1 ? "" : "s") +
        " that did not appear in this session's web-search evidence: " +
        droppedDomains.join(", ") +
        ".",
    );
  }

  return {
    research: { ...research, sources, market, benchmarkListing, compositions, warnings },
    droppedDomains,
    evidenceHosts,
  };
}

export type ReformatCallResult = {
  longDescription: string;
  prompt: string;
  rawOutput: string;
  modelName: string;
  usage: Usage;
};

/**
 * Restructures an existing description into the plain-text listing format
 * (2026-10-26): a short opening paragraph, then titled sections of bullets.
 * A text-only call, no tools, no images, no web search. The service that
 * calls this refuses the result if any fact token from the original is
 * missing, so the rewrite can reorder and regroup but never lose data.
 */
export async function reformatListingDescription(args: {
  title: string;
  longDescription: string;
}): Promise<ReformatCallResult> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const model = await resolveOpenAiModel();
  const prompt = buildDescriptionReformatPrompt(args);
  const request = {
    model,
    stream: false,
    input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
    text: {
      format: {
        type: "json_schema",
        name: "product_studio_description_reformat",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["longDescription"],
          properties: { longDescription: { type: "string" } },
        },
      },
    },
  } as unknown as ResponseCreateParamsNonStreaming;
  const response = await client.responses.create(request);
  const rawOutput = response.output_text.trim();
  if (!rawOutput) throw new Error("OpenAI returned an empty reformat response.");
  const parsed = parseJson(rawOutput, reformatSchema);
  return {
    longDescription: parsed.longDescription,
    prompt,
    rawOutput,
    modelName: model,
    usage: {
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
  };
}

const reformatSchema = z.object({ longDescription: z.string().min(1) });

export async function researchProduct(args: {
  title: string;
  shortDescription: string;
  references: ReferenceAsset[];
  /** Provenance lines for photographs that are seller listing images. */
  referenceNotes?: readonly string[];
}): Promise<ResearchCallResult> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const model = await resolveOpenAiModel();
  const prompt = buildProductResearchPrompt({
    title: args.title,
    shortDescription: args.shortDescription,
    sourcePhotoCount: args.references.length,
    referenceNotes: args.referenceNotes,
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
  const parsed = parseJson(rawOutput, productStudioResearchSchema);
  const verifiedSourceUrls = collectWebSearchEvidenceUrls(response.output);
  if (verifiedSourceUrls.length === 0) {
    throw new UnverifiableResearchError(
      "Research returned no verifiable web-search source URLs, so nothing it cited can be kept.",
    );
  }
  // Unverified citations are removed, not fatal; see reconcileResearchWithEvidence.
  const { research: result, droppedDomains } = reconcileResearchWithEvidence(
    parsed,
    verifiedSourceUrls,
  );

  return {
    result,
    droppedSourceDomains: droppedDomains,
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

const sellerImageSearchJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["productIdentified", "candidates", "warnings"],
  properties: {
    productIdentified: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sellerName",
          "pageTitle",
          "pageUrl",
          "imageUrl",
          "sourceType",
          "imageKind",
          "whyMatch",
          "matchConfidence",
        ],
        properties: {
          sellerName: { type: "string" },
          pageTitle: { anyOf: [{ type: "string" }, { type: "null" }] },
          pageUrl: { type: "string" },
          imageUrl: { type: "string" },
          sourceType: {
            type: "string",
            enum: ["manufacturer", "distributor", "retailer", "marketplace"],
          },
          imageKind: { type: "string", enum: ["packshot", "packaging", "lifestyle", "other"] },
          whyMatch: { type: "string" },
          matchConfidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

export type SellerImageSearchCallResult = {
  /** As the model returned it; the caller verifies it against the evidence. */
  result: SellerImageSearch;
  prompt: string;
  rawOutput: string;
  modelName: string;
  usage: Usage;
  /** Web-search evidence URLs, the only basis on which a seller is kept. */
  evidenceUrls: string[];
};

/**
 * The seller-image search (competitor-images.ts): text in, web search on,
 * strict JSON out. No photograph is attached, because the project has none;
 * that is the point. Throws when the search produced no evidence at all,
 * since then nothing the model named can be kept.
 */
export async function searchSellerProductImages(args: {
  title: string;
  shortDescription: string;
  identifiers: readonly string[];
  ownStoreHosts?: readonly string[];
  maxCandidates?: number;
}): Promise<SellerImageSearchCallResult> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const model = await resolveOpenAiModel();
  const prompt = buildSellerImageSearchPrompt({
    title: args.title,
    shortDescription: args.shortDescription,
    identifiers: args.identifiers,
    ownStoreHosts: args.ownStoreHosts ?? [
      "lifesupply.ca",
      "wellmartmedical.com",
      "lifesupplyclinics.com",
      "balkowitsch.com",
    ],
    maxCandidates: args.maxCandidates ?? 8,
  });
  const request = {
    model,
    stream: false,
    tools: [{ type: "web_search" }],
    include: ["web_search_call.action.sources"],
    input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
    text: {
      format: {
        type: "json_schema",
        name: "product_studio_seller_images",
        strict: true,
        schema: sellerImageSearchJsonSchema,
      },
    },
  } as unknown as ResponseCreateParamsNonStreaming;

  const response = await client.responses.create(request);
  const rawOutput = response.output_text.trim();
  if (!rawOutput) throw new Error("OpenAI returned an empty seller-image search response.");
  const result = parseJson(rawOutput, sellerImageSearchSchema);
  const evidenceUrls = collectWebSearchEvidenceUrls(response.output);
  if (evidenceUrls.length === 0) {
    throw new UnverifiableResearchError(
      "The seller-image search returned no verifiable web-search source URLs, so no listing it named can be kept.",
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
    evidenceUrls,
  };
}

export type GeneratedImage = {
  data: Buffer;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  modelName: string;
  /** Dimensions actually requested, so stored metadata matches the payload. */
  width: number;
  height: number;
};

export async function generateProductImage(args: {
  prompt: string;
  references: ReferenceAsset[];
  aspect: FrameAspect;
}): Promise<GeneratedImage> {
  const client = await getOpenAiClient();
  if (!client) throw new AiProviderNotConfiguredError("openai");
  // Env, then the admin's AI setting, then the built-in default.
  const caps = imageModelCapabilities(await resolveOpenAiImageModel());
  const requestedSize = sizeForAspect(args.aspect, caps.supportsArbitrarySize);
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
    size: requestedSize,
    output_format: "jpeg",
    ...(caps.supportsInputFidelity ? { input_fidelity: "high" as const } : {}),
  };
  const response = await client.images.edit(request);
  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) throw new Error("OpenAI returned no image payload.");

  const [width, height] = requestedSize.split("x").map(Number);
  return {
    data: Buffer.from(encoded, "base64"),
    contentType: "image/jpeg",
    modelName: caps.model,
    width: width ?? 0,
    height: height ?? 0,
  };
}

export async function qaProductImage(args: {
  title: string;
  mode: ProductMode;
  depictableSpec: readonly string[];
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
    mode: args.mode,
    depictableSpec: args.depictableSpec,
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
