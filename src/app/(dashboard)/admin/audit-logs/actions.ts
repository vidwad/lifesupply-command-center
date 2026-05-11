"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { runAuditRetention, type RetentionReport } from "@/server/services/audit-logs/retention";
import { requirePermission } from "@/server/permissions";

export type RetentionActionState =
  | { ok: true; report: RetentionReport }
  | { ok: false; error: string }
  | undefined;

export async function runRetentionAction(
  _prev: RetentionActionState,
  _formData: FormData,
): Promise<RetentionActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_VIEW_AUDIT_LOGS);
  try {
    const report = await runAuditRetention({ actor: { id: actor.id } });
    revalidatePath("/admin/audit-logs");
    return { ok: true, report };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Retention failed." };
  }
}
