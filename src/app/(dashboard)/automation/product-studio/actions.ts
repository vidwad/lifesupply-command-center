"use server";

/**
 * Server actions for unattended Product Studio runs (2026-10-27). Both
 * require the Super Admin-only publish permission at this boundary, and the
 * service re-asserts it from the permissions passed in.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { ProductStudioInputError } from "@/server/services/product-studio";
import {
  cancelProductStudioRun,
  createProductStudioRun,
} from "@/server/services/product-studio/autopilot";
import {
  AutopilotSettingsError,
  autopilotSettingsFromForm,
} from "@/server/services/product-studio/autopilot-settings";

export type AutopilotActionState = { error?: string; ok?: string } | undefined;

function actionError(error: unknown): AutopilotActionState {
  if (error instanceof ProductStudioInputError || error instanceof AutopilotSettingsError) {
    return { error: error.message };
  }
  throw error;
}

async function requireRunner() {
  return requirePermission(PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);
}

export async function createRunAction(
  _previous: AutopilotActionState,
  formData: FormData,
): Promise<AutopilotActionState> {
  const user = await requireRunner();
  const projectIds = formData
    .getAll("projectId")
    .filter((value): value is string => typeof value === "string");
  let runId: string;
  try {
    const settings = autopilotSettingsFromForm(formData);
    ({ runId } = await createProductStudioRun({
      actorUserId: user.id,
      actorPermissions: user.permissions,
      projectIds,
      settings,
    }));
  } catch (error) {
    return actionError(error);
  }
  // Outside the try: redirect() signals by throwing and must never be caught.
  revalidatePath("/automation/product-studio");
  redirect(`/automation/product-studio/${runId}`);
}

export async function cancelRunAction(
  _previous: AutopilotActionState,
  formData: FormData,
): Promise<AutopilotActionState> {
  const user = await requireRunner();
  const runId = String(formData.get("runId") ?? "");
  try {
    await cancelProductStudioRun({
      runId,
      actorUserId: user.id,
      actorPermissions: user.permissions,
      reason: String(formData.get("reason") ?? ""),
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/automation/product-studio/${runId}`);
  revalidatePath("/automation/product-studio");
  return { ok: "Stop requested. Products already in progress finish their current step first." };
}
