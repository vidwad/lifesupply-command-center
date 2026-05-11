"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import {
  AiNotConfiguredError,
  AiProviderNotConfiguredError,
} from "@/server/services/ai";
import {
  draftReactivationCampaign,
} from "@/server/services/marketing/campaigns";
import { requirePermission } from "@/server/permissions";

export type DraftActionState = { error?: string; ok?: string; campaignId?: string } | undefined;

const VALID_BUCKETS = ["hot", "warm", "cold", "deep_freeze"] as const;
type Bucket = (typeof VALID_BUCKETS)[number];

export async function draftCampaignAction(
  _prev: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  const actor = await requirePermission(PERMISSIONS.MARKETING_DRAFT_CAMPAIGN);
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const brief = String(formData.get("brief") ?? "").trim();
  const bucket = String(formData.get("bucket") ?? "");
  const maxRecipients = Number(formData.get("maxRecipients") ?? "200");

  if (!name) return { error: "Campaign name is required." };
  if (!brief) return { error: "Brief is required." };
  if (!VALID_BUCKETS.includes(bucket as Bucket)) return { error: "Choose a bucket." };
  if (!Number.isFinite(maxRecipients) || maxRecipients < 1) {
    return { error: "Max recipients must be a positive number." };
  }

  let campaignId: string;
  try {
    campaignId = await draftReactivationCampaign(
      {
        name,
        subject,
        brief,
        bucket: bucket as Bucket,
        maxRecipients,
      },
      { id: actor.id },
    );
  } catch (err) {
    if (err instanceof AiNotConfiguredError || err instanceof AiProviderNotConfiguredError) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "Failed to draft campaign." };
  }

  revalidatePath("/marketing");
  revalidatePath("/marketing/reactivation");
  redirect(`/marketing/campaigns/${campaignId}`);
}
