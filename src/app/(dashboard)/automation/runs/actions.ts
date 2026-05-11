"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import {
  AutomationApprovalRequiredError,
  AutomationDisabledError,
  prepareSupplierOrder,
  runPriceCheck,
  runStockCheck,
  submitSupplierOrder,
} from "@/server/services/automation/runs";
import { FeatureDisabledError } from "@/server/services/feature-flags";
import { requirePermission } from "@/server/permissions";

export type AutomationActionState = { error?: string; ok?: string; runId?: string } | undefined;

function describeError(err: unknown): string {
  if (
    err instanceof FeatureDisabledError ||
    err instanceof AutomationDisabledError ||
    err instanceof AutomationApprovalRequiredError
  ) {
    return err.message;
  }
  return err instanceof Error ? err.message : "Automation failed.";
}

export async function runPriceCheckAction(
  _prev: AutomationActionState,
  formData: FormData,
): Promise<AutomationActionState> {
  const actor = await requirePermission(PERMISSIONS.SUPPLIERS_RUN_AUTOMATION);
  const supplierProductId = String(formData.get("supplierProductId") ?? "");
  if (!supplierProductId) return { error: "Choose a supplier product." };
  try {
    const runId = await runPriceCheck({ supplierProductId, triggeredById: actor.id });
    revalidatePath("/automation/runs");
    return { ok: "Price check captured.", runId };
  } catch (err) {
    return { error: describeError(err) };
  }
}

export async function runStockCheckAction(
  _prev: AutomationActionState,
  formData: FormData,
): Promise<AutomationActionState> {
  const actor = await requirePermission(PERMISSIONS.SUPPLIERS_RUN_AUTOMATION);
  const supplierProductId = String(formData.get("supplierProductId") ?? "");
  if (!supplierProductId) return { error: "Choose a supplier product." };
  try {
    const runId = await runStockCheck({ supplierProductId, triggeredById: actor.id });
    revalidatePath("/automation/runs");
    return { ok: "Stock check captured.", runId };
  } catch (err) {
    return { error: describeError(err) };
  }
}

export async function prepareOrderAction(
  _prev: AutomationActionState,
  formData: FormData,
): Promise<AutomationActionState> {
  const actor = await requirePermission(PERMISSIONS.SUPPLIERS_RUN_AUTOMATION);
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return { error: "Choose an order." };
  try {
    const runId = await prepareSupplierOrder({ orderId, triggeredById: actor.id });
    revalidatePath("/automation/runs");
    revalidatePath("/approvals");
    return { ok: "Order prepared. An approval has been raised.", runId };
  } catch (err) {
    return { error: describeError(err) };
  }
}

export async function submitOrderAction(
  _prev: AutomationActionState,
  formData: FormData,
): Promise<AutomationActionState> {
  const actor = await requirePermission(PERMISSIONS.SUPPLIERS_APPROVE_ORDER_AUTOMATION);
  const runId = String(formData.get("runId") ?? "");
  if (!runId) return { error: "Missing run id." };
  try {
    await submitSupplierOrder({ runId, triggeredById: actor.id });
    revalidatePath("/automation/runs");
    revalidatePath(`/automation/runs/${runId}`);
    return { ok: "Submission queued." };
  } catch (err) {
    return { error: describeError(err) };
  }
}
