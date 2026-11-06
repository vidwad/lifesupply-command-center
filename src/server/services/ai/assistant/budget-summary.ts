/**
 * The drawer's budget strip (2026-11-06): today's spend and voice minutes
 * against the caps in Admin → AI Settings, and whether each mode is open.
 * The pure half turns the budget status into the strip's figures; the other
 * half reads the status and the live-voice flag.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureOn } from "@/server/services/feature-flags";

import { getAiBudgetStatus, type AiBudgetStatus } from "../budget";
import type { AssistantBudgetSummary } from "./types";

const capOrNull = (cap: number): number | null => (cap > 0 ? cap : null);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function summariseAssistantBudget(
  status: AiBudgetStatus,
  liveVoiceEnabled: boolean,
): AssistantBudgetSummary {
  return {
    spentUsd: round2(status.spent.usd),
    capUsd: capOrNull(status.limits.dailyUsd),
    userSpentUsd: status.spent.userUsd == null ? null : round2(status.spent.userUsd),
    userCapUsd: capOrNull(status.limits.dailyUsdPerUser),
    voiceMinutes: round2(status.spent.voiceMinutes),
    voiceCapMinutes: capOrNull(status.limits.dailyVoiceMinutes),
    userVoiceMinutes:
      status.spent.userVoiceMinutes == null ? null : round2(status.spent.userVoiceMinutes),
    userVoiceCapMinutes: capOrNull(status.limits.dailyVoiceMinutesPerUser),
    sessionMaxMinutes: status.limits.voiceSessionMaxMinutes,
    spendBlocked: status.spendBlocked,
    voiceBlocked: liveVoiceEnabled
      ? status.voiceBlocked
      : "Live voice is switched off. An administrator turns on the ai.live_voice feature flag.",
    liveVoiceEnabled,
    timezone: status.timezone,
  };
}

export async function getAssistantBudgetSummary(userId: string): Promise<AssistantBudgetSummary> {
  const [status, liveVoiceEnabled] = await Promise.all([
    getAiBudgetStatus(userId),
    isFeatureOn(FEATURE_FLAGS.AI_LIVE_VOICE),
  ]);
  return summariseAssistantBudget(status, liveVoiceEnabled);
}
