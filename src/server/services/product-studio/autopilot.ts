/**
 * Unattended Product Studio runs (product owner, 2026-10-27).
 *
 * A Super Admin selects products and criteria; the worker then researches
 * each product, generates its images, reviews every draft from its QA scores,
 * regenerates what falls short, and leaves the product approved, or marked
 * for a person's attention, with no further input. This reverses the
 * one-click-per-step design the Studio had until now, so it stands behind
 * its own flag, `product_studio.autopilot`, in the kill set, on top of the
 * Studio and image-generation flags, and only the holder of the Super
 * Admin-only publish permission may create or cancel a run.
 *
 * Shape of a run. The settings are frozen as JSON at creation. Items are the
 * products, in the order selected. "Lanes" are how many items are worked at
 * once: the start function claims that many items and sends one worker event
 * each; every event performs ONE step (research, one image with its review,
 * one review, or the closing decision) and re-sends itself, so each worker
 * invocation is short and every step is a checkpoint at which a cancel, a
 * tripped flag or a stop rule is honoured. When an item finishes, its lane
 * claims the next pending item, and the last lane to find none finalises the
 * run.
 *
 * Every decision is re-derived from stored rows (autopilot-policy.ts), so a
 * retried or duplicated step finds the state already advanced and does the
 * next right thing rather than spending twice.
 *
 * Nothing in this file sends anything to a store. When a run's settings ask
 * for publishing, the completion step hands the product to
 * autopilot-publish.ts, the one module outside the publish server actions
 * that may call the publish service, and that only under the run's Approval
 * row, the creator's permissions as they stand at that moment, and the
 * publish flags. With publish mode "none" a run ends with approved drafts
 * and the publishing card does the rest.
 */
import type { Prisma } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { isFeatureOn } from "@/server/services/feature-flags";
import { logger } from "@/server/logger";

import { REQUIRED_AUTOPILOT_FLAGS } from "./autopilot-flags";
import {
  decideNextAction,
  evaluateGeneratedImage,
  finalizeRunStatus,
  LIVE_RUN_STATUSES,
  qaScoresFrom,
  TERMINAL_ITEM_STAGES,
  type ItemOutcome,
  type NextAction,
} from "./autopilot-policy";
import { publishForRun } from "./autopilot-publish";
import {
  describeAutopilotSettings,
  parseAutopilotSettings,
  publishesToStore,
  type AutopilotSettings,
} from "./autopilot-settings";
import { ProductStudioInputError, reviewProductStudioAsset } from "./index";
import { runProductStudioGeneration, runProductStudioResearch } from "./jobs";
import { flagsBlockingPublish } from "./publish-read";
import { isWorkflowBusy } from "./workflow-progress";

export const AUTOPILOT_RUN_EVENT = "product-studio/autopilot.run.requested";
export const AUTOPILOT_ITEM_EVENT = "product-studio/autopilot.item.requested";

/** Creating or cancelling a run takes the Super Admin-only publish permission. */
export const AUTOPILOT_PERMISSION = PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE;

export { REQUIRED_AUTOPILOT_FLAGS };

export async function flagsBlockingAutopilot(): Promise<string[]> {
  const off: string[] = [];
  for (const flag of REQUIRED_AUTOPILOT_FLAGS) {
    if (!(await isFeatureOn(flag))) off.push(flag);
  }
  return off;
}

function requireAutopilotPermission(actorPermissions: readonly string[]): void {
  if (!actorPermissions.includes(AUTOPILOT_PERMISSION)) {
    throw new ProductStudioInputError(
      "Only a Super Admin can start or stop an unattended Product Studio run.",
    );
  }
}

const json = (value: unknown) => JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;

// ---------------------------------------------------------------------------
// Creation and cancellation (web side).
// ---------------------------------------------------------------------------

/**
 * Creates a run over the given projects and queues it. The creation is the
 * approval: an Approval row records who authorised the run and with which
 * settings, and the audit log carries the same.
 */
export async function createProductStudioRun(args: {
  actorUserId: string;
  actorPermissions: readonly string[];
  projectIds: readonly string[];
  settings: AutopilotSettings;
}): Promise<{ runId: string; itemCount: number }> {
  requireAutopilotPermission(args.actorPermissions);
  const settings = parseAutopilotSettings(args.settings);
  const off = await flagsBlockingAutopilot();
  if (off.length > 0) {
    throw new ProductStudioInputError(
      "Unattended runs are disabled. These flags must all be on: " + off.join(", ") + ".",
    );
  }
  // A run that publishes needs the publish flags on when it is created too,
  // so the owner learns now rather than from a refused note hours later. The
  // publish module checks them again for every product.
  if (publishesToStore(settings)) {
    const publishOff = await flagsBlockingPublish();
    if (publishOff.length > 0) {
      throw new ProductStudioInputError(
        "A run that publishes needs these flags on as well: " +
          publishOff.join(", ") +
          '. Choose "No" under Publish to BigCommerce to run without publishing.',
      );
    }
  }
  const ids = [...new Set(args.projectIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) throw new ProductStudioInputError("Select at least one project.");
  if (ids.length > settings.maxProducts) {
    throw new ProductStudioInputError(
      `This run allows at most ${settings.maxProducts} products; ${ids.length} were selected.`,
    );
  }
  const projects = await prisma.productStudioProject.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      confirmedTitle: true,
      status: true,
      productId: true,
      autopilotRunId: true,
      product: { select: { name: true } },
      compositions: { select: { slot: true, status: true } },
      autopilotRun: { select: { status: true } },
    },
  });
  const byId = new Map(projects.map((project) => [project.id, project]));
  for (const id of ids) {
    const project = byId.get(id);
    if (!project) throw new ProductStudioInputError("A selected project no longer exists.");
    const name = project.confirmedTitle ?? project.title;
    if (project.status === "archived") {
      throw new ProductStudioInputError(`"${name}" is archived and cannot be run.`);
    }
    if (project.autopilotRun && LIVE_RUN_STATUSES.has(project.autopilotRun.status)) {
      throw new ProductStudioInputError(`"${name}" is already in a live unattended run.`);
    }
    if (
      isWorkflowBusy({ status: project.status, compositions: project.compositions, assets: [] })
    ) {
      throw new ProductStudioInputError(
        `"${name}" has work in progress. Wait for it to finish before adding it to a run.`,
      );
    }
  }

  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.productStudioRun.create({
      data: {
        createdById: args.actorUserId,
        status: "queued",
        settings: json(settings),
        items: {
          create: ids.map((id, index) => {
            const project = byId.get(id)!;
            return {
              projectId: project.id,
              productId: project.productId,
              productName: project.product?.name ?? project.confirmedTitle ?? project.title,
              sortOrder: index,
            };
          }),
        },
      },
      select: { id: true },
    });
    await tx.productStudioProject.updateMany({
      where: { id: { in: ids } },
      data: { autopilotRunId: created.id },
    });
    const approval = await tx.approval.create({
      data: {
        approvalType: "product_studio_autopilot",
        status: "approved",
        requestedById: args.actorUserId,
        approverId: args.actorUserId,
        relatedEntityType: "ProductStudioRun",
        relatedEntityId: created.id,
        requestSummary:
          `Unattended Product Studio run over ${ids.length} product${ids.length === 1 ? "" : "s"}. ` +
          describeAutopilotSettings(settings).join(" "),
        decisionNotes: "Created and approved in one step by the Super Admin who started the run.",
        decidedAt: new Date(),
      },
      select: { id: true },
    });
    await tx.productStudioRun.update({
      where: { id: created.id },
      data: { approvalId: approval.id },
    });
    return created;
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.autopilot_run_created",
    entityType: "ProductStudioRun",
    entityId: run.id,
    afterData: { projectIds: ids, settings, note: describeAutopilotSettings(settings) },
  });
  await inngest.send({
    id: `product-studio-autopilot-run-${run.id}`,
    name: AUTOPILOT_RUN_EVENT,
    data: { runId: run.id, actorUserId: args.actorUserId },
  });
  return { runId: run.id, itemCount: ids.length };
}

/**
 * Asks a live run to stop. Pending items are cancelled at once; items in
 * progress stop at their next step. If nothing is in progress the run is
 * finalised here.
 */
export async function cancelProductStudioRun(args: {
  runId: string;
  actorUserId: string;
  actorPermissions: readonly string[];
  reason?: string | null;
}): Promise<void> {
  requireAutopilotPermission(args.actorPermissions);
  const run = await prisma.productStudioRun.findUnique({
    where: { id: args.runId },
    select: { id: true, status: true, cancelRequestedAt: true },
  });
  if (!run) throw new ProductStudioInputError("Run not found.");
  if (!LIVE_RUN_STATUSES.has(run.status)) {
    throw new ProductStudioInputError("This run has already finished.");
  }
  if (run.cancelRequestedAt) {
    throw new ProductStudioInputError("A stop has already been requested for this run.");
  }
  const reason = args.reason?.trim() || "Stopped by the operator.";
  await requestRunStop({ runId: run.id, reason, cancelledById: args.actorUserId });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.autopilot_run_cancel_requested",
    entityType: "ProductStudioRun",
    entityId: run.id,
    afterData: { reason },
  });
  await finalizeRunIfComplete(run.id);
}

/** Marks the run as stopping and cancels every item not yet started. */
async function requestRunStop(args: {
  runId: string;
  reason: string;
  cancelledById?: string | null;
}): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.productStudioRun.updateMany({
      where: { id: args.runId, cancelRequestedAt: null },
      data: {
        cancelRequestedAt: now,
        stopReason: args.reason,
        cancelledById: args.cancelledById ?? undefined,
      },
    }),
    prisma.productStudioRunItem.updateMany({
      where: { runId: args.runId, stage: { in: ["pending", "claimed"] } },
      data: { stage: "cancelled", note: args.reason, completedAt: now },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Worker side.
// ---------------------------------------------------------------------------

/**
 * Marks the run running and claims one item per lane. Idempotent: a repeat
 * claims only items still pending, so a retried start never doubles lanes.
 */
export async function startProductStudioRun(runId: string): Promise<{ itemIds: string[] }> {
  const run = await prisma.productStudioRun.findUnique({
    where: { id: runId },
    select: { id: true, status: true, settings: true, cancelRequestedAt: true },
  });
  if (!run || !LIVE_RUN_STATUSES.has(run.status) || run.cancelRequestedAt) {
    return { itemIds: [] };
  }
  const settings = parseAutopilotSettings(run.settings);
  const off = await flagsBlockingAutopilot();
  if (off.length > 0) {
    await requestRunStop({ runId, reason: "Stopped before starting: " + off.join(", ") + " off." });
    await finalizeRunIfComplete(runId);
    return { itemIds: [] };
  }
  await prisma.productStudioRun.updateMany({
    where: { id: runId, status: "queued" },
    data: { status: "running", startedAt: new Date() },
  });
  const itemIds: string[] = [];
  for (let lane = 0; lane < settings.parallelProducts; lane += 1) {
    const claimed = await claimNextRunItem(runId);
    if (!claimed) break;
    itemIds.push(claimed);
  }
  return { itemIds };
}

/** Atomically claims the next pending item, in order; null when none is left. */
export async function claimNextRunItem(runId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = await prisma.productStudioRunItem.findFirst({
      where: { runId, stage: "pending" },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (!candidate) return null;
    const result = await prisma.productStudioRunItem.updateMany({
      where: { id: candidate.id, stage: "pending" },
      data: { stage: "claimed", startedAt: new Date() },
    });
    if (result.count === 1) return candidate.id;
  }
  return null;
}

export type ItemStepOutcome =
  | { kind: "continue"; step: number }
  | { kind: "item_finished"; stage: ItemOutcome };

type Snapshot = NonNullable<Awaited<ReturnType<typeof loadSnapshot>>>;

async function loadSnapshot(projectId: string) {
  return prisma.productStudioProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      researchSummary: true,
      compositions: { select: { slot: true, status: true } },
      assets: {
        select: {
          id: true,
          kind: true,
          compositionSlot: true,
          revision: true,
          status: true,
          qaResult: true,
        },
      },
    },
  });
}

function identityConfidenceOf(summary: unknown): number | null {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;
  const identified = (summary as Record<string, unknown>).identifiedProduct;
  if (!identified || typeof identified !== "object" || Array.isArray(identified)) return null;
  const value = (identified as Record<string, unknown>).confidence;
  return typeof value === "number" ? value : null;
}

function toPolicySnapshot(project: Snapshot) {
  const generated = project.assets.filter((asset) => asset.kind === "generated");
  return {
    status: project.status,
    sourceCount: project.assets.filter((asset) => asset.kind === "source").length,
    compositions: project.compositions,
    assets: generated.map((asset) => ({
      compositionSlot: asset.compositionSlot,
      revision: asset.revision,
      status: asset.status,
    })),
    identityConfidence: identityConfidenceOf(project.researchSummary),
  };
}

/** The latest generated draft for a slot, with its QA record. */
function latestDraft(project: Snapshot, slot: number) {
  return project.assets
    .filter((asset) => asset.kind === "generated" && asset.compositionSlot === slot)
    .sort((a, b) => b.revision - a.revision)[0];
}

async function finishItem(args: {
  itemId: string;
  stage: ItemOutcome;
  note: string | null;
  approvedSlots?: number;
}): Promise<void> {
  await prisma.productStudioRunItem.update({
    where: { id: args.itemId },
    data: {
      stage: args.stage,
      note: args.note,
      approvedSlots: args.approvedSlots,
      completedAt: new Date(),
    },
  });
}

/**
 * Reviews one draft from its stored QA scores, as the run's creator, and
 * records that the decision was automatic.
 */
async function autoReview(args: {
  runId: string;
  actorUserId: string;
  assetId: string;
  qaResult: unknown;
  settings: AutopilotSettings;
}): Promise<"approved" | "rejected"> {
  const verdict = evaluateGeneratedImage(qaScoresFrom(args.qaResult), args.settings);
  const decision = verdict.decision === "approve" ? "approved" : "rejected";
  await reviewProductStudioAsset({
    assetId: args.assetId,
    actorUserId: args.actorUserId,
    decision,
    automatic: {
      runId: args.runId,
      score: verdict.score,
      reason: verdict.decision === "approve" ? null : verdict.reason,
    },
  });
  return decision;
}

/**
 * Performs one step for one item and says whether the lane should continue
 * with this item or move on. Never throws for a failure of the work itself:
 * that becomes the item's outcome and the run's failure count.
 */
export async function processRunItemStep(args: {
  runId: string;
  itemId: string;
}): Promise<ItemStepOutcome> {
  const [run, item] = await Promise.all([
    prisma.productStudioRun.findUnique({
      where: { id: args.runId },
      select: {
        id: true,
        status: true,
        settings: true,
        createdById: true,
        cancelRequestedAt: true,
        stopReason: true,
        imagesGenerated: true,
        consecutiveFailures: true,
        approvalId: true,
      },
    }),
    prisma.productStudioRunItem.findUnique({ where: { id: args.itemId } }),
  ]);
  if (!run || !item || item.runId !== run.id) {
    return { kind: "item_finished", stage: "failed" };
  }
  if (TERMINAL_ITEM_STAGES.has(item.stage)) {
    return { kind: "item_finished", stage: item.stage as ItemOutcome };
  }
  const settings = parseAutopilotSettings(run.settings);
  const actorUserId = run.createdById;

  // Checkpoint: a stop requested, a flag turned off, or a creator who can no
  // longer act ends the item here, before any further spend.
  if (!LIVE_RUN_STATUSES.has(run.status) || run.cancelRequestedAt) {
    await finishItem({ itemId: item.id, stage: "cancelled", note: run.stopReason });
    return { kind: "item_finished", stage: "cancelled" };
  }
  const off = await flagsBlockingAutopilot();
  if (off.length > 0) {
    const reason = "Stopped: " + off.join(", ") + " turned off.";
    await requestRunStop({ runId: run.id, reason });
    await finishItem({ itemId: item.id, stage: "cancelled", note: reason });
    return { kind: "item_finished", stage: "cancelled" };
  }
  if (!actorUserId) {
    const reason = "Stopped: the run's creator no longer exists.";
    await requestRunStop({ runId: run.id, reason });
    await finishItem({ itemId: item.id, stage: "cancelled", note: reason });
    return { kind: "item_finished", stage: "cancelled" };
  }
  const creator = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { status: true },
  });
  if (!creator || creator.status !== "active") {
    const reason = "Stopped: the run's creator is no longer an active user.";
    await requestRunStop({ runId: run.id, reason });
    await finishItem({ itemId: item.id, stage: "cancelled", note: reason });
    return { kind: "item_finished", stage: "cancelled" };
  }

  if (!item.projectId) {
    await finishItem({ itemId: item.id, stage: "failed", note: "The project was deleted." });
    await recordItemFailure(run.id, settings);
    return { kind: "item_finished", stage: "failed" };
  }
  const project = await loadSnapshot(item.projectId);
  if (!project) {
    await finishItem({ itemId: item.id, stage: "failed", note: "The project was deleted." });
    await recordItemFailure(run.id, settings);
    return { kind: "item_finished", stage: "failed" };
  }

  const { steps } = await prisma.productStudioRunItem.update({
    where: { id: item.id },
    data: { steps: { increment: 1 } },
    select: { steps: true },
  });
  const next: NextAction = decideNextAction(toPolicySnapshot(project), settings, {
    imagesGenerated: run.imagesGenerated,
  });

  try {
    switch (next.action) {
      case "research": {
        await prisma.productStudioRunItem.update({
          where: { id: item.id },
          data: { stage: "researching" },
        });
        await runProductStudioResearch({ projectId: project.id, actorUserId });
        return { kind: "continue", step: steps };
      }
      case "generate": {
        // Counted before the call so the ceiling counts attempts, not
        // successes, and a crash mid-generation can never undercount spend.
        await prisma.$transaction([
          prisma.productStudioRunItem.update({
            where: { id: item.id },
            data: {
              stage: "generating",
              imagesGenerated: { increment: 1 },
              regenerations: { increment: next.regeneration ? 1 : 0 },
            },
          }),
          prisma.productStudioRun.update({
            where: { id: run.id },
            data: { imagesGenerated: { increment: 1 } },
          }),
        ]);
        const result = await runProductStudioGeneration({
          projectId: project.id,
          slot: next.slot,
          actorUserId,
        });
        if (!result.reused) {
          await prisma.productStudioRunItem.update({
            where: { id: item.id },
            data: { stage: "reviewing" },
          });
          await autoReview({
            runId: run.id,
            actorUserId,
            assetId: result.assetId,
            qaResult: result.qa,
            settings,
          });
        }
        return { kind: "continue", step: steps };
      }
      case "review": {
        const draft = latestDraft(project, next.slot);
        if (draft) {
          await prisma.productStudioRunItem.update({
            where: { id: item.id },
            data: { stage: "reviewing" },
          });
          await autoReview({
            runId: run.id,
            actorUserId,
            assetId: draft.id,
            qaResult: draft.qaResult,
            settings,
          });
        }
        return { kind: "continue", step: steps };
      }
      case "complete": {
        const approved = `${next.approvedSlots} image${next.approvedSlots === 1 ? "" : "s"} approved automatically.`;
        // Publishing, when the run's settings ask for it (2026-10-27): the
        // one place a run reaches the store, through the publish module and
        // its gates. A refusal or failure leaves the product for a person.
        let publishedItems = 0;
        let stage: "done" | "attention" = "done";
        let note = approved + " Nothing was sent to the store.";
        if (publishesToStore(settings)) {
          await prisma.productStudioRunItem.update({
            where: { id: item.id },
            data: { stage: "publishing" },
          });
          const outcome = await publishForRun({
            runId: run.id,
            approvalId: run.approvalId,
            projectId: project.id,
            actorUserId,
            settings,
          });
          if (outcome.status === "published") {
            publishedItems = outcome.publishedItems;
            note = approved + " " + outcome.message;
          } else if (outcome.status === "nothing") {
            note = approved + " " + outcome.message;
          } else {
            publishedItems = outcome.publishedItems;
            stage = "attention";
            note =
              approved + " " + outcome.message + " Publish from the project page once resolved.";
          }
        }
        await prisma.productStudioRunItem.update({
          where: { id: item.id },
          data: {
            stage,
            note,
            approvedSlots: next.approvedSlots,
            publishedItems,
            completedAt: new Date(),
          },
        });
        await prisma.productStudioRun.update({
          where: { id: run.id },
          data: { consecutiveFailures: 0 },
        });
        await writeAudit({
          actorUserId,
          action:
            stage === "done"
              ? "product_studio.autopilot_item_completed"
              : "product_studio.autopilot_item_needs_attention",
          entityType: "ProductStudioProject",
          entityId: project.id,
          afterData: {
            runId: run.id,
            approvedSlots: next.approvedSlots,
            publishMode: settings.publishMode,
            publishedItems,
            note,
          },
        });
        return { kind: "item_finished", stage };
      }
      case "attention": {
        await finishItem({
          itemId: item.id,
          stage: "attention",
          approvedSlots: next.approvedSlots,
          note: next.reason,
        });
        await prisma.productStudioRun.update({
          where: { id: run.id },
          data: { consecutiveFailures: 0 },
        });
        await writeAudit({
          actorUserId,
          action: "product_studio.autopilot_item_needs_attention",
          entityType: "ProductStudioProject",
          entityId: project.id,
          afterData: { runId: run.id, reason: next.reason, approvedSlots: next.approvedSlots },
        });
        return { kind: "item_finished", stage: "attention" };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 2000) : "Unknown error";
    logger.error(
      { runId: run.id, itemId: item.id, projectId: project.id, action: next.action, message },
      "product studio autopilot step failed",
    );
    await finishItem({
      itemId: item.id,
      stage: "failed",
      note: `${next.action === "research" ? "Research" : "Image generation"} failed: ${message}`,
    });
    await writeAudit({
      actorUserId,
      action: "product_studio.autopilot_item_failed",
      entityType: "ProductStudioProject",
      entityId: project.id,
      afterData: { runId: run.id, action: next.action, error: message },
    });
    await recordItemFailure(run.id, settings);
    return { kind: "item_finished", stage: "failed" };
  }
}

/** Counts a failed item and trips the run's stop rule when it is reached. */
async function recordItemFailure(runId: string, settings: AutopilotSettings): Promise<void> {
  const updated = await prisma.productStudioRun.update({
    where: { id: runId },
    data: { consecutiveFailures: { increment: 1 } },
    select: { consecutiveFailures: true, cancelRequestedAt: true },
  });
  if (
    !updated.cancelRequestedAt &&
    updated.consecutiveFailures >= settings.stopAfterConsecutiveFailures
  ) {
    await requestRunStop({
      runId,
      reason: `Stopped after ${updated.consecutiveFailures} consecutive product failures.`,
    });
  }
}

/**
 * Closes the run once no item is pending or in progress. Exactly one caller
 * wins the status change; that caller writes the summary and the Task.
 */
export async function finalizeRunIfComplete(runId: string): Promise<boolean> {
  const open = await prisma.productStudioRunItem.count({
    where: { runId, stage: { notIn: ["done", "attention", "failed", "skipped", "cancelled"] } },
  });
  if (open > 0) return false;
  const run = await prisma.productStudioRun.findUnique({
    where: { id: runId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!run || !LIVE_RUN_STATUSES.has(run.status)) return false;
  const outcomes = run.items.map((item) => item.stage as ItemOutcome);
  const status = finalizeRunStatus({ outcomes, cancelRequested: run.cancelRequestedAt != null });
  const counts = {
    done: outcomes.filter((o) => o === "done").length,
    attention: outcomes.filter((o) => o === "attention").length,
    failed: outcomes.filter((o) => o === "failed").length,
    cancelled: outcomes.filter((o) => o === "cancelled" || o === "skipped").length,
  };
  const summary =
    `${counts.done} completed, ${counts.attention} need attention, ${counts.failed} failed, ` +
    `${counts.cancelled} not processed; ${run.imagesGenerated} image${run.imagesGenerated === 1 ? "" : "s"} generated.` +
    (run.stopReason ? " " + run.stopReason : "");
  const won = await prisma.productStudioRun.updateMany({
    where: { id: runId, status: { in: ["queued", "running"] } },
    data: { status, summary, completedAt: new Date() },
  });
  if (won.count !== 1) return false;

  const settings = parseAutopilotSettings(run.settings);
  const needing = run.items.filter((item) => item.stage === "attention" || item.stage === "failed");
  if (settings.createTask && needing.length > 0 && run.createdById) {
    // Written directly rather than through the tasks service, whose path
    // revalidation needs a request context the worker does not have.
    const task = await prisma.task.create({
      data: {
        title: `Unattended Product Studio run: ${needing.length} product${needing.length === 1 ? "" : "s"} need attention`,
        description:
          needing.map((item) => `• ${item.productName}: ${item.note ?? item.stage}`).join("\n") +
          `\n\nRun: /automation/product-studio/${run.id}`,
        priority: "medium",
        status: "open",
        sourceType: "workflow",
        sourceId: run.id,
        relatedEntityType: "ProductStudioRun",
        relatedEntityId: run.id,
        assignedToId: run.createdById,
        createdById: run.createdById,
        metadata: { runId: run.id, products: needing.map((item) => item.productName) },
      },
      select: { id: true },
    });
    await writeAudit({
      actorUserId: run.createdById,
      action: "task.create",
      entityType: "Task",
      entityId: task.id,
      afterData: { source: "product_studio_autopilot", runId: run.id },
    });
  }
  await writeAudit({
    actorUserId: run.createdById,
    action: "product_studio.autopilot_run_completed",
    entityType: "ProductStudioRun",
    entityId: run.id,
    afterData: { status, summary, counts, imagesGenerated: run.imagesGenerated },
  });
  return true;
}

/** Sends the worker event that performs one step for one item. */
export async function sendRunItemStep(args: {
  runId: string;
  itemId: string;
  step: number;
}): Promise<void> {
  await inngest.send({
    id: `product-studio-autopilot-item-${args.itemId}-step-${args.step}`,
    name: AUTOPILOT_ITEM_EVENT,
    data: { runId: args.runId, itemId: args.itemId },
  });
}
