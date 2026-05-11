"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import {
  CampaignTransitionError,
  exportCampaignToMailchimp,
  MailchimpExportError,
  requestCampaignApproval,
} from "@/server/services/marketing/campaigns";
import { FeatureDisabledError } from "@/server/services/feature-flags";
import { requirePermission } from "@/server/permissions";

export type CampaignActionState = { error?: string; ok?: string } | undefined;

export async function requestApprovalAction(
  _prev: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const actor = await requirePermission(PERMISSIONS.MARKETING_DRAFT_CAMPAIGN);
  const campaignId = String(formData.get("campaignId") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  if (!campaignId) return { error: "Missing campaign id." };
  try {
    await requestCampaignApproval({ campaignId, notes, actor: { id: actor.id } });
  } catch (err) {
    if (err instanceof CampaignTransitionError) return { error: err.message };
    return { error: err instanceof Error ? err.message : "Failed to request approval." };
  }
  revalidatePath(`/marketing/campaigns/${campaignId}`);
  revalidatePath("/approvals");
  return { ok: "Approval requested." };
}

export async function exportToMailchimpAction(
  _prev: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const actor = await requirePermission(PERMISSIONS.MARKETING_SYNC_MAILCHIMP);
  const campaignId = String(formData.get("campaignId") ?? "");
  if (!campaignId) return { error: "Missing campaign id." };
  try {
    await exportCampaignToMailchimp({ campaignId, actor: { id: actor.id } });
  } catch (err) {
    if (
      err instanceof FeatureDisabledError ||
      err instanceof MailchimpExportError
    ) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "Failed to export." };
  }
  revalidatePath(`/marketing/campaigns/${campaignId}`);
  revalidatePath("/marketing/campaigns");
  return { ok: "Queued for Mailchimp export (stub — see audit log)." };
}
