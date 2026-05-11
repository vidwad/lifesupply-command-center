"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { tripKillSwitch } from "@/server/services/feature-flags/kill-switch";
import { requirePermission } from "@/server/permissions";

export type KillSwitchState =
  | { ok: true; flippedCount: number; alreadyOffCount: number }
  | { ok: false; error: string }
  | undefined;

export async function tripKillSwitchAction(
  _prev: KillSwitchState,
  formData: FormData,
): Promise<KillSwitchState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { ok: false, error: "A reason is required (it goes to the audit log)." };
  try {
    const result = await tripKillSwitch({ actor: { id: actor.id }, reason });
    revalidatePath("/admin/feature-flags");
    return {
      ok: true,
      flippedCount: result.flippedKeys.length,
      alreadyOffCount: result.alreadyOff.length,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Kill-switch failed." };
  }
}
