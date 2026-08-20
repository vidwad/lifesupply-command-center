import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { requireFeature } from "@/server/services/feature-flags";
import { compositionAttributes } from "@/server/services/product-studio";
import {
  generateProductImage,
  qaProductImage,
  researchProduct,
} from "@/server/services/product-studio/openai";
import { compileProductImagePrompt } from "@/server/services/product-studio/prompts";
import { planGenerationRevision } from "@/server/services/product-studio/revisions";

type ResearchEvent = { projectId: string; actorUserId: string };
type GenerateEvent = ResearchEvent & { slot: number };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 4000) : "Unknown Product Studio error";
}

type QaIdentity = {
  brand: string;
  model: string;
  modelIdentifiers: string[];
  conditionNotes: string[];
};

/** Defensive read of the stored identifiedProduct summary for the QA call. */
function identityFromSummary(summary: unknown): QaIdentity | null {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;
  const identified = (summary as Record<string, unknown>).identifiedProduct;
  if (!identified || typeof identified !== "object" || Array.isArray(identified)) return null;
  const record = identified as Record<string, unknown>;
  if (typeof record.brand !== "string" || typeof record.model !== "string") return null;
  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return {
    brand: record.brand,
    model: record.model,
    modelIdentifiers: strings(record.modelIdentifiers),
    conditionNotes: strings(record.conditionNotes),
  };
}

/** Render the stored composition attributes JSON as QA brief lines. */
function briefLinesFromAttributes(attributes: unknown): string[] {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return [];
  const lines: string[] = [];
  for (const [key, value] of Object.entries(attributes as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value) && value.length > 0) {
      lines.push(`${key}: ${value.filter((item) => typeof item === "string").join("; ")}`);
    }
  }
  return lines;
}

export const researchProductStudioProject = inngest.createFunction(
  {
    id: "product-studio-research",
    name: "Product Studio — Research listing, market, and compositions",
    triggers: [{ event: "product-studio/research.requested" }],
    concurrency: { limit: 1, key: "event.data.projectId" },
    retries: 1,
  },
  async ({ event }) => {
    const data = event.data as ResearchEvent;
    await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
    const project = await prisma.productStudioProject.update({
      where: { id: data.projectId },
      data: { status: "researching", errorMessage: null },
      include: {
        assets: {
          where: { kind: "source" },
          select: { fileName: true, contentType: true, data: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    try {
      const call = await researchProduct({
        title: project.title,
        shortDescription: project.shortDescription,
        references: project.assets,
      });
      const research = call.result;
      const warnings = [...research.warnings];
      if (research.identifiedProduct.confidence < 0.8) {
        warnings.push(
          "Exact product identity confidence is below 80%; confirm the model before generating.",
        );
      }

      await prisma.$transaction(async (tx) => {
        await Promise.all([
          tx.productStudioResearchSource.deleteMany({ where: { projectId: project.id } }),
          tx.productStudioPriceObservation.deleteMany({ where: { projectId: project.id } }),
          tx.productStudioComposition.deleteMany({ where: { projectId: project.id } }),
        ]);
        await tx.productStudioResearchSource.createMany({
          data: research.sources.map((source) => ({
            projectId: project.id,
            sellerName: source.sellerName,
            pageTitle: source.pageTitle,
            url: source.url,
            heroImageUrl: source.heroImageUrl,
            sourceType: source.sourceType,
            notes: source.notes,
          })),
          skipDuplicates: true,
        });
        await tx.productStudioPriceObservation.createMany({
          data: research.market.observations.map((observation) => ({
            projectId: project.id,
            sellerName: observation.sellerName,
            url: observation.url,
            price: observation.price,
            currency: observation.currency.toUpperCase(),
            condition: observation.condition,
            includedAccessories: observation.includedAccessories,
            notes: observation.notes,
          })),
        });
        await tx.productStudioComposition.createMany({
          data: research.compositions.map((composition) => ({
            projectId: project.id,
            slot: composition.slot,
            name: composition.name,
            sourceSeller: composition.sourceSeller,
            sourceUrl: composition.sourceUrl,
            referenceImageUrl: composition.referenceImageUrl,
            rationale: composition.whyEffective,
            attributes: compositionAttributes(composition),
            prompt: compileProductImagePrompt({
              title: research.optimizedListing.title,
              shortDescription: research.optimizedListing.shortDescription,
              identity: research.identifiedProduct,
              composition,
            }),
          })),
        });
        await tx.productStudioProject.update({
          where: { id: project.id },
          data: {
            confirmedTitle: research.optimizedListing.title,
            finalDescription: research.optimizedListing.shortDescription,
            currency: research.market.currency.toUpperCase(),
            marketLow: research.market.low,
            marketHigh: research.market.high,
            marketMedian: research.market.median,
            researchSummary: {
              identifiedProduct: research.identifiedProduct,
              benchmarkListing: research.benchmarkListing,
              keyDetails: research.optimizedListing.keyDetails,
              methodology: research.methodology,
              marketBasis: research.market.basis,
              priceObservationCount: research.market.observations.length,
            } as Prisma.InputJsonValue,
            warnings,
            status: "ready_to_generate",
            errorMessage: null,
          },
        });
        await tx.aiOutput.create({
          data: {
            userId: data.actorUserId,
            modelProvider: "openai",
            modelName: call.modelName,
            module: "product_studio_research",
            prompt: call.prompt,
            output: call.rawOutput,
            structuredOutput: research as Prisma.InputJsonValue,
            sourceReferences: {
              projectId: project.id,
              sourceImageCount: project.assets.length,
              retailerUrls: research.sources.map((source) => source.url),
              verifiedWebSearchUrls: call.verifiedSourceUrls,
              observedAt: new Date().toISOString(),
            },
            tokenUsage: call.usage,
            status: "generated",
            assumptions: [],
            warnings,
            confidence: research.identifiedProduct.confidence,
          },
        });
      });

      await writeAudit({
        actorUserId: data.actorUserId,
        action: "product_studio.research_completed",
        entityType: "ProductStudioProject",
        entityId: project.id,
        afterData: {
          model: call.modelName,
          identifiedProduct: research.identifiedProduct.canonicalTitle,
          priceObservationCount: research.market.observations.length,
          compositionCount: research.compositions.length,
          sourceUrls: research.sources.map((source) => source.url),
        },
      });
      return { projectId: project.id, status: "ready_to_generate" };
    } catch (error) {
      const message = errorMessage(error);
      await prisma.productStudioProject.update({
        where: { id: project.id },
        data: { status: "failed", errorMessage: message },
      });
      await writeAudit({
        actorUserId: data.actorUserId,
        action: "product_studio.research_failed",
        entityType: "ProductStudioProject",
        entityId: project.id,
        afterData: { error: message },
      });
      throw error;
    }
  },
);

export const generateProductStudioImage = inngest.createFunction(
  {
    id: "product-studio-generate-image",
    name: "Product Studio — Generate and QA one image",
    triggers: [{ event: "product-studio/image.requested" }],
    concurrency: { limit: 1, key: "event.data.projectId" },
    retries: 1,
  },
  async ({ event }) => {
    const data = event.data as GenerateEvent;
    await Promise.all([
      requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO),
      requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION),
    ]);
    const project = await prisma.productStudioProject.findUniqueOrThrow({
      where: { id: data.projectId },
      include: {
        assets: {
          where: { kind: "source" },
          select: { fileName: true, contentType: true, data: true },
          orderBy: { createdAt: "asc" },
        },
        compositions: { where: { slot: data.slot } },
      },
    });
    const composition = project.compositions[0];
    if (!composition) throw new Error(`Composition ${data.slot} was not found.`);
    const existing = await prisma.productStudioAsset.findFirst({
      where: { projectId: project.id, kind: "generated", compositionSlot: data.slot },
      orderBy: { revision: "desc" },
    });
    const plan = planGenerationRevision(existing);
    if (plan.action === "reuse") {
      return { assetId: existing?.id, status: existing?.status, reused: true };
    }
    const revision = plan.revision;

    await prisma.productStudioComposition.update({
      where: { id: composition.id },
      data: { status: "generating", errorMessage: null },
    });

    try {
      const generated = await generateProductImage({
        prompt: composition.prompt,
        references: project.assets,
      });
      const qa = await qaProductImage({
        title: project.confirmedTitle ?? project.title,
        compositionName: composition.name,
        compositionBrief: briefLinesFromAttributes(composition.attributes),
        identity: identityFromSummary(project.researchSummary),
        references: project.assets,
        generated,
      });
      const contentHash = createHash("sha256").update(generated.data).digest("hex");
      const generatedSlots = await prisma.productStudioAsset.findMany({
        where: { projectId: project.id, kind: "generated" },
        distinct: ["compositionSlot"],
        select: { compositionSlot: true },
      });
      const completedSlots = new Set(generatedSlots.map((item) => item.compositionSlot));
      completedSlots.add(data.slot);
      const assetStatus = qa.result.verdict === "reject" ? "rejected" : "needs_review";

      const asset = await prisma.$transaction(async (tx) => {
        const created = await tx.productStudioAsset.create({
          data: {
            projectId: project.id,
            kind: "generated",
            compositionSlot: data.slot,
            revision,
            fileName: `composition-${data.slot}-r${revision}.jpg`,
            contentType: generated.contentType,
            bytes: generated.data.byteLength,
            data: new Uint8Array(generated.data),
            contentHash,
            width: 2048,
            height: 2048,
            prompt: composition.prompt,
            modelName: generated.modelName,
            status: assetStatus,
            qaResult: qa.result as Prisma.InputJsonValue,
          },
        });
        await tx.productStudioComposition.update({
          where: { id: composition.id },
          data: { status: "generated", errorMessage: null },
        });
        await tx.productStudioProject.update({
          where: { id: project.id },
          data: {
            status: completedSlots.size === 4 ? "needs_review" : "ready_to_generate",
            errorMessage: null,
          },
        });
        await tx.aiOutput.create({
          data: {
            userId: data.actorUserId,
            modelProvider: "openai",
            modelName: generated.modelName,
            module: "product_studio_image",
            prompt: composition.prompt,
            output: qa.rawOutput,
            structuredOutput: qa.result as Prisma.InputJsonValue,
            sourceReferences: {
              projectId: project.id,
              compositionId: composition.id,
              compositionSlot: data.slot,
              sourceImageCount: project.assets.length,
              competitorSourceUrl: composition.sourceUrl,
              generatedAssetHash: contentHash,
            },
            tokenUsage: qa.usage,
            status: "generated",
            assumptions: [],
            warnings: qa.result.warnings,
            confidence: qa.result.identityScore,
          },
        });
        return created;
      });

      await writeAudit({
        actorUserId: data.actorUserId,
        action: "product_studio.image_generated",
        entityType: "ProductStudioAsset",
        entityId: asset.id,
        afterData: {
          projectId: project.id,
          slot: data.slot,
          model: generated.modelName,
          contentHash,
          qa: qa.result,
        },
      });
      return { assetId: asset.id, status: asset.status, reused: false };
    } catch (error) {
      const message = errorMessage(error);
      await prisma.$transaction([
        prisma.productStudioComposition.update({
          where: { id: composition.id },
          data: { status: "failed", errorMessage: message },
        }),
        prisma.productStudioProject.update({
          where: { id: project.id },
          data: { status: "failed", errorMessage: message },
        }),
      ]);
      await writeAudit({
        actorUserId: data.actorUserId,
        action: "product_studio.image_failed",
        entityType: "ProductStudioProject",
        entityId: project.id,
        afterData: { slot: data.slot, error: message },
      });
      throw error;
    }
  },
);
