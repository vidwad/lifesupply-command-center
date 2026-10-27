/**
 * Product Studio worker functions: research, and one image at a time.
 *
 * The work itself lives in `services/product-studio/jobs.ts` since
 * 2026-10-27, shared with the unattended run processor. These functions add
 * what only the event path needs: the per-project concurrency key, a single
 * retry, and the "Generate all" chaining that queues the next slot after a
 * successful image.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { requireFeature } from "@/server/services/feature-flags";
import { queueProductStudioGeneration } from "@/server/services/product-studio";
import {
  decideNextChainedSlot,
  PENDING_COMPOSITION_STATUSES,
} from "@/server/services/product-studio/generation-chain";
import {
  runProductStudioGeneration,
  runProductStudioResearch,
} from "@/server/services/product-studio/jobs";

type ResearchEvent = { projectId: string; actorUserId: string };
type GenerateEvent = ResearchEvent & {
  slot: number;
  operatorInstructions?: string | null;
  autoContinue?: boolean;
  /** The operator asked to revise an approved image (2026-10-26). */
  revise?: boolean;
};

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
    const result = await runProductStudioResearch(data);
    return { projectId: result.projectId, status: result.status };
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
    const result = await runProductStudioGeneration({
      projectId: data.projectId,
      slot: data.slot,
      actorUserId: data.actorUserId,
      operatorInstructions: data.operatorInstructions,
      revise: data.revise === true,
    });
    if (result.reused) {
      return { assetId: result.assetId, status: result.status, reused: true };
    }
    // "Generate all" chains one slot at a time rather than fanning out: the
    // Inngest concurrency limit is 1 per project, spend stays sequential, and
    // a QA rejection stops the run so a drifting identity cannot quietly
    // consume three more generations. Operator instructions are deliberately
    // not carried forward — they were written about a specific image.
    const pending = await prisma.productStudioComposition.findMany({
      where: { projectId: data.projectId, status: { in: [...PENDING_COMPOSITION_STATUSES] } },
      select: { slot: true },
    });
    const chain = decideNextChainedSlot({
      autoContinue: data.autoContinue,
      verdict: result.qa.verdict,
      pendingSlots: pending.map((item) => item.slot),
    });
    if (chain.continue) {
      await queueProductStudioGeneration({
        projectId: data.projectId,
        slot: chain.slot,
        actorUserId: data.actorUserId,
        autoContinue: true,
      });
    }
    return { assetId: result.assetId, status: result.status, reused: false };
  },
);
