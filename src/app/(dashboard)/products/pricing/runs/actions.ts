"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { PricingValidationError } from "@/server/services/pricing";
import { buildItems, type RankingBasis } from "@/server/services/pricing/list-builder";
import {
  cancelDraftPricingRun,
  candidatesFromUpload,
  createDraftPricingRun,
  recordUploadProcessed,
  resolveDailyBatchSize,
  resolveMinCostMultiplier,
  selectTopProducts,
} from "@/server/services/pricing/runs";
import { parseUpload, previewUpload } from "@/server/services/pricing/upload-parser";

export type RunActionState = { error?: string; ok?: string } | undefined;

function actionError(error: unknown, fallback: string): RunActionState {
  if (error instanceof PricingValidationError) return { error: error.message };
  return { error: error instanceof Error ? error.message : fallback };
}

/** Creating a run requires pricing.create_runs, not merely pricing.view. */
async function requireRunCreator() {
  return requirePermission(PERMISSIONS.PRICING_CREATE_RUNS);
}

function lookbackToDate(window: string): Date {
  const days = Number.parseInt(window, 10);
  const safe = Number.isFinite(days) && days > 0 ? days : 90;
  return new Date(Date.now() - safe * 24 * 60 * 60 * 1000);
}

export async function createTopProductsRunAction(
  _previous: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const user = await requireRunCreator();
  const storeId = String(formData.get("storeId") ?? "");
  const basis = String(formData.get("rankingBasis") ?? "revenue") as RankingBasis;
  const lookbackWindow = String(formData.get("lookbackWindow") ?? "90");
  const targetCount = Number(formData.get("targetCount") ?? 1500);

  let runId: string;
  try {
    if (!storeId) throw new PricingValidationError("Choose a store.");
    if (!Number.isFinite(targetCount) || targetCount <= 0) {
      throw new PricingValidationError("Target count must be a positive whole number.");
    }
    const [multiplier, batchSize] = await Promise.all([
      resolveMinCostMultiplier(storeId),
      resolveDailyBatchSize(storeId),
    ]);
    const candidates = await selectTopProducts({
      storeId,
      since: lookbackToDate(lookbackWindow),
      basis,
      targetCount,
    });
    runId = await createDraftPricingRun({
      actorUserId: user.id,
      storeId,
      sourceType: "top_products",
      rankingBasis: basis,
      lookbackWindow: `${lookbackWindow}d`,
      targetCount,
      dailyBatchSize: batchSize,
      items: buildItems(candidates, multiplier),
    });
  } catch (error) {
    return actionError(error, "Could not build the product list.");
  }
  revalidatePath("/products/pricing/runs");
  redirect(`/products/pricing/runs/${runId}`);
}

export async function createUploadRunAction(
  _previous: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const user = await requireRunCreator();
  const storeId = String(formData.get("storeId") ?? "");
  const file = formData.get("file");

  let runId: string;
  try {
    if (!storeId) throw new PricingValidationError("Choose a store.");
    if (!(file instanceof File) || file.size === 0) {
      throw new PricingValidationError("Choose a CSV file to upload.");
    }
    const parsed = parseUpload(await file.text());
    const preview = previewUpload(parsed.rows);
    if (preview.usable === 0) {
      // Audited as rejected so a failed attempt is not invisible.
      await recordUploadProcessed({
        actorUserId: user.id,
        fileName: file.name,
        rows: parsed.rows,
        accepted: false,
        reason: "No usable rows",
      });
      throw new PricingValidationError(
        "No usable rows. Every row needs a SKU and at least one valid price.",
      );
    }
    const [multiplier, batchSize] = await Promise.all([
      resolveMinCostMultiplier(storeId),
      resolveDailyBatchSize(storeId),
    ]);
    const candidates = await candidatesFromUpload({ rows: parsed.rows });
    runId = await createDraftPricingRun({
      actorUserId: user.id,
      storeId,
      sourceType: "upload",
      dailyBatchSize: batchSize,
      items: buildItems(candidates, multiplier),
    });
    await recordUploadProcessed({
      actorUserId: user.id,
      fileName: file.name,
      rows: parsed.rows,
      accepted: true,
    });
  } catch (error) {
    return actionError(error, "Could not process the upload.");
  }
  revalidatePath("/products/pricing/runs");
  redirect(`/products/pricing/runs/${runId}`);
}

export async function cancelRunAction(
  _previous: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const user = await requireRunCreator();
  const runId = String(formData.get("runId") ?? "");
  try {
    await cancelDraftPricingRun({ actorUserId: user.id, runId });
  } catch (error) {
    return actionError(error, "Could not cancel the run.");
  }
  revalidatePath(`/products/pricing/runs/${runId}`);
  return { ok: "Draft run cancelled." };
}
