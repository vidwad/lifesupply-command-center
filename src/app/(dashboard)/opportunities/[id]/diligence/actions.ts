"use server";

import { revalidatePath } from "next/cache";
import type { DiligenceStatus } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import {
  seedDiligenceChecklist,
  setDiligenceItemStatus,
} from "@/server/services/strategic/diligence";
import { requirePermission } from "@/server/permissions";

export type DiligenceActionState = { error?: string; ok?: string } | undefined;

const VALID_STATUS: DiligenceStatus[] = ["pending", "in_progress", "blocked", "done", "not_applicable"];

export async function seedChecklistAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.OPPORTUNITIES_UPDATE);
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!opportunityId) return;
  await seedDiligenceChecklist({ opportunityId, actor: { id: actor.id } });
  revalidatePath(`/opportunities/${opportunityId}/diligence`);
}

export async function setStatusAction(
  _prev: DiligenceActionState,
  formData: FormData,
): Promise<DiligenceActionState> {
  const actor = await requirePermission(PERMISSIONS.OPPORTUNITIES_UPDATE);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!id) return { error: "Missing item id." };
  if (!VALID_STATUS.includes(status as DiligenceStatus)) return { error: "Invalid status." };
  try {
    await setDiligenceItemStatus(id, status as DiligenceStatus, { id: actor.id }, notes);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update item." };
  }
  if (opportunityId) revalidatePath(`/opportunities/${opportunityId}/diligence`);
  return { ok: "Updated." };
}
