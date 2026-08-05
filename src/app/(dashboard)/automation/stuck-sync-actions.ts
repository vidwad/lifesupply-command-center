"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { reapStuckSyncRuns } from "@/server/services/sync/stuck-syncs";

export type ReapActionState = { error?: string; ok?: string } | undefined;

/**
 * Mark all stuck `running` sync logs as failed (GATE-02 disposition).
 * Local Command Center rows only — never contacts a source system.
 */
export async function reapStuckSyncsAction(
  _prev: ReapActionState,
  _formData: FormData,
): Promise<ReapActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  try {
    const result = await reapStuckSyncRuns({ actorUserId: actor.id });
    revalidatePath("/automation");
    return {
      ok:
        result.reaped === 0
          ? "No stuck syncs to reap — they may have completed since the page loaded."
          : `Marked ${result.reaped} stuck sync${result.reaped === 1 ? "" : "s"} as failed.`,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `Could not reap stuck syncs: ${err.message}`
          : "Could not reap stuck syncs.",
    };
  }
}
