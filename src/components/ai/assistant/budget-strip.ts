import type { AssistantBudgetSummary } from "@/server/services/ai/assistant/types";

const usd = (n: number) => `$${n.toFixed(2)}`;
const minutes = (n: number) => `${Math.round(n)} min`;

/**
 * Pure: the budget strip's line. Today's spend against the everyone cap,
 * the person's own when they have one, and the voice minutes; "no cap"
 * where none is set. The blocked reasons are shown separately.
 */
export function budgetStripText(budget: AssistantBudgetSummary | null): string {
  if (!budget) return "Reading today's allowances…";
  const parts: string[] = [];
  parts.push(
    budget.capUsd == null
      ? `Today ${usd(budget.spentUsd)}, no cap`
      : `Today ${usd(budget.spentUsd)} of ${usd(budget.capUsd)}`,
  );
  if (budget.userCapUsd != null && budget.userSpentUsd != null) {
    parts.push(`you ${usd(budget.userSpentUsd)} of ${usd(budget.userCapUsd)}`);
  }
  if (budget.liveVoiceEnabled) {
    parts.push(
      budget.voiceCapMinutes == null
        ? `voice ${minutes(budget.voiceMinutes)}, no cap`
        : `voice ${minutes(budget.voiceMinutes)} of ${minutes(budget.voiceCapMinutes)}`,
    );
  } else {
    parts.push("voice off");
  }
  return parts.join(" · ");
}
