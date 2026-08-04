"use server";

import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import {
  ALL_STREAM_KEYS,
  DEFAULT_B2B_SEQUENCE,
  DEFAULT_CONSUMER_SEQUENCE,
  type CampaignStreamKey,
  type SequenceStep,
} from "@/server/services/marketing/campaign-streams";
import {
  buildReactivationProgram,
  ProgramBuilderError,
} from "@/server/services/marketing/program-builder";
import { requirePermission } from "@/server/permissions";

export type BuilderActionState = { error?: string } | undefined;

function parseSequence(
  formData: FormData,
  prefix: "consumer" | "b2b",
  defaults: SequenceStep[],
): SequenceStep[] {
  const steps: SequenceStep[] = [];
  for (let i = 0; i < defaults.length; i++) {
    const subject = String(formData.get(`${prefix}Subject${i}`) ?? "").trim();
    const purpose = String(formData.get(`${prefix}Purpose${i}`) ?? "").trim();
    const day = Number(formData.get(`${prefix}Day${i}`) ?? defaults[i]!.day);
    if (!subject) continue; // an emptied subject removes the step
    steps.push({
      day: Number.isFinite(day) && day >= 0 ? Math.trunc(day) : defaults[i]!.day,
      subject,
      purpose: purpose || defaults[i]!.purpose,
    });
  }
  return steps.length > 0 ? steps : defaults;
}

export async function buildProgramAction(
  _prev: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  const actor = await requirePermission(PERMISSIONS.MARKETING_DRAFT_CAMPAIGN);

  const streams = ALL_STREAM_KEYS.filter(
    (k) => formData.get(`stream_${k}`) === "on",
  ) as CampaignStreamKey[];

  let programId: string;
  try {
    programId = await buildReactivationProgram(
      {
        name: String(formData.get("name") ?? ""),
        objective: String(formData.get("objective") ?? ""),
        streams,
        productFocus: String(formData.get("productFocus") ?? ""),
        categories: String(formData.get("categories") ?? ""),
        offerStrategy: String(formData.get("offerStrategy") ?? ""),
        offerCode: String(formData.get("offerCode") ?? "") || null,
        consumerSequence: parseSequence(formData, "consumer", DEFAULT_CONSUMER_SEQUENCE),
        b2bSequence: parseSequence(formData, "b2b", DEFAULT_B2B_SEQUENCE),
        startDate: String(formData.get("startDate") ?? "") || null,
        maxPerStream: Number(formData.get("maxPerStream") ?? 500),
        createHighValueTasks: formData.get("createHighValueTasks") === "on",
      },
      { id: actor.id },
    );
  } catch (err) {
    if (err instanceof ProgramBuilderError) return { error: err.message };
    return { error: err instanceof Error ? err.message : "Failed to build the program." };
  }

  redirect(`/marketing/campaigns/${programId}`);
}
