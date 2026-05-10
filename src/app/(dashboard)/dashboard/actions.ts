"use server";

import { PERMISSIONS } from "@/lib/permissions";
import { AiNotConfiguredError, generateDashboardBriefing } from "@/server/services/ai";
import { requirePermission } from "@/server/permissions";

export type RegenerateBriefingState =
  | { status: "ok" }
  | { status: "error"; message: string }
  | undefined;

export async function regenerateBriefingAction(
  _prev: RegenerateBriefingState,
  _formData: FormData,
): Promise<RegenerateBriefingState> {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  try {
    await generateDashboardBriefing(user.id);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return { status: "error", message: err.message };
    }
    console.error("[dashboard] regenerateBriefingAction failed", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to generate briefing.",
    };
  }
}
