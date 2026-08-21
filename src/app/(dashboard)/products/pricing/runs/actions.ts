"use server";

/**
 * DP-2 run builder actions.
 *
 * Two-phase by design: the first submit validates, selects, and returns a
 * preview; nothing is written until a second submit carries confirm=1. The
 * preview is what the operator approves, so a mis-set lookback or target count
 * costs a page render rather than a stored run someone must find and cancel.
 *
 * Creates draft PricingRun / PricingRunItem rows only. No competitor site is
 * contacted, no recommendation is produced, no price is written back, and
 * pricing.writebacks is never referenced.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { PricingValidationError } from "@/server/services/pricing";
import {
  buildItems,
  ListBuilderInputError,
  parseLookbackWindow,
  parseRankingBasis,
  parseTargetCount,
  summarise,
  type BuildSummary,
  type BuiltItem,
} from "@/server/services/pricing/list-builder";
import {
  cancelDraftPricingRun,
  candidatesFromUpload,
  createDraftPricingRun,
  recordUploadProcessed,
  resolveDailyBatchSize,
  resolveMinCostMultiplier,
  selectTopProducts,
} from "@/server/services/pricing/runs";
import { requestCompetitorCheck } from "@/server/services/pricing/observations";
import { parseUpload, previewUpload } from "@/server/services/pricing/upload-parser";

/** A handful of rows so the operator can eyeball the mapping before writing. */
export type PreviewRow = {
  sku: string;
  productName: string | null;
  effectivePrice: number | null;
  costPrice: number | null;
  costSource: string;
  floorPrice: number | null;
  status: string;
  blockedReason: string | null;
};

export type RunPreview = {
  summary: BuildSummary;
  duplicateSkus: string[];
  sample: PreviewRow[];
  inputs: Record<string, string>;
  csvText?: string;
};

export type RunActionState = { error?: string; ok?: string; preview?: RunPreview } | undefined;

const MAX_CSV_BYTES = 1_000_000;
const SAMPLE_SIZE = 25;

function actionError(error: unknown, fallback: string): RunActionState {
  if (error instanceof PricingValidationError || error instanceof ListBuilderInputError) {
    return { error: error.message };
  }
  throw error instanceof Error ? error : new Error(fallback);
}

async function requireRunCreator() {
  return requirePermission(PERMISSIONS.PRICING_CREATE_RUNS);
}

function lookbackToDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toPreview(
  items: readonly BuiltItem[],
  inputs: Record<string, string>,
  csvText?: string,
): RunPreview {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.sku.trim().toLowerCase();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    summary: summarise(items),
    duplicateSkus: [...counts.entries()].filter(([, n]) => n > 1).map(([sku]) => sku),
    sample: [...items]
      .sort((a, b) => (a.status === b.status ? 0 : a.status === "blocked" ? -1 : 1))
      .slice(0, SAMPLE_SIZE)
      .map((item) => ({
        sku: item.sku,
        productName: item.productName,
        effectivePrice: item.currentEffectivePrice,
        costPrice: item.costPrice,
        costSource: item.costSource,
        floorPrice: item.floorPrice,
        status: item.status,
        blockedReason: item.blockedReason,
      })),
    inputs,
    csvText,
  };
}

export async function buildTopProductsRunAction(
  _previous: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const user = await requireRunCreator();
  const confirm = formData.get("confirm") === "1";
  const storeId = String(formData.get("storeId") ?? "");

  let runId: string;
  try {
    if (!storeId) throw new PricingValidationError("Choose a store.");
    const basis = parseRankingBasis(formData.get("rankingBasis") ?? "revenue");
    const lookbackDays = parseLookbackWindow(formData.get("lookbackWindow") ?? 90);
    const targetCount = parseTargetCount(formData.get("targetCount") ?? 1500);

    const [multiplier, batchSize] = await Promise.all([
      resolveMinCostMultiplier(storeId),
      resolveDailyBatchSize(storeId),
    ]);
    const candidates = await selectTopProducts({
      storeId,
      since: lookbackToDate(lookbackDays),
      basis,
      targetCount,
    });
    const items = buildItems(candidates, multiplier);

    if (!confirm) {
      return {
        preview: toPreview(items, {
          storeId,
          rankingBasis: basis,
          lookbackWindow: String(lookbackDays),
          targetCount: String(targetCount),
        }),
      };
    }

    runId = await createDraftPricingRun({
      actorUserId: user.id,
      storeId,
      sourceType: "top_products",
      rankingBasis: basis,
      lookbackWindow: String(lookbackDays) + "d",
      targetCount,
      dailyBatchSize: batchSize,
      items,
    });
  } catch (error) {
    return actionError(error, "Could not build the product list.");
  }
  revalidatePath("/products/pricing/runs");
  redirect("/products/pricing/runs/" + runId);
}

export async function buildUploadRunAction(
  _previous: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const user = await requireRunCreator();
  const confirm = formData.get("confirm") === "1";
  const storeId = String(formData.get("storeId") ?? "");

  let runId: string;
  try {
    if (!storeId) throw new PricingValidationError("Choose a store.");

    let csvText: string;
    let fileName: string;
    if (confirm) {
      csvText = String(formData.get("csvText") ?? "");
      fileName = String(formData.get("fileName") ?? "upload.csv");
      if (!csvText) throw new PricingValidationError("The preview expired. Upload the file again.");
    } else {
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) {
        throw new PricingValidationError("Choose a CSV file to upload.");
      }
      if (file.size > MAX_CSV_BYTES) {
        throw new PricingValidationError(
          "File is larger than 1 MB. Split it into smaller lists — a 1500-row list is well under this.",
        );
      }
      csvText = await file.text();
      fileName = file.name;
    }

    const parsed = parseUpload(csvText);
    const uploadPreview = previewUpload(parsed.rows);
    if (uploadPreview.usable === 0) {
      await recordUploadProcessed({
        actorUserId: user.id,
        fileName,
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
    const items = buildItems(candidates, multiplier);

    if (!confirm) {
      return { preview: toPreview(items, { storeId, fileName }, csvText) };
    }

    runId = await createDraftPricingRun({
      actorUserId: user.id,
      storeId,
      sourceType: "upload",
      dailyBatchSize: batchSize,
      items,
    });
    await recordUploadProcessed({
      actorUserId: user.id,
      fileName,
      rows: parsed.rows,
      accepted: true,
    });
  } catch (error) {
    return actionError(error, "Could not process the upload.");
  }
  revalidatePath("/products/pricing/runs");
  redirect("/products/pricing/runs/" + runId);
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
  revalidatePath("/products/pricing/runs/" + runId);
  return { ok: "Draft run cancelled." };
}

/**
 * Dispatches a read-only competitor check. Requires pricing.run_checks — a
 * stricter permission than reading a run, because this is the only DP-3 action
 * that causes outbound requests.
 */
export async function requestCompetitorCheckAction(
  _previous: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_RUN_CHECKS);
  const runId = String(formData.get("runId") ?? "");
  const rawBatch = String(formData.get("batchSize") ?? "").trim();
  try {
    const result = await requestCompetitorCheck({
      actorUserId: user.id,
      pricingRunId: runId,
      batchSize: rawBatch ? Number(rawBatch) : null,
    });
    revalidatePath("/products/pricing/runs/" + runId);
    return {
      ok:
        "Queued a read-only check of " +
        String(result.targets) +
        " item(s). No prices are changed. Refresh in a minute for observations.",
    };
  } catch (error) {
    return actionError(error, "Could not start the competitor check.");
  }
}
