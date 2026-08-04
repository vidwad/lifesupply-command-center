"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import { acceptAgentRecommendation } from "@/server/services/ai/agents/accept";
import { getAgent } from "@/server/services/ai/agents/registry";
import { AgentRunError, runAgent } from "@/server/services/ai/agents/runner";
import { requirePermission } from "@/server/permissions";

export type AgentActionState = { error?: string; ok?: string } | undefined;

export async function runAgentAction(
  _prev: AgentActionState,
  formData: FormData,
): Promise<AgentActionState> {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  const agentKey = String(formData.get("agentKey") ?? "");
  const agent = getAgent(agentKey);
  if (!agent) return { error: "Unknown agent." };

  const params: Record<string, string> = {};
  for (const spec of agent.params) {
    const value = String(formData.get(`param_${spec.name}`) ?? "").trim();
    if (value) params[spec.name] = value;
  }

  let result;
  try {
    result = await runAgent({
      agentKey,
      params,
      user: { id: user.id, permissions: user.permissions },
    });
  } catch (err) {
    if (err instanceof AgentRunError) return { error: err.message };
    return { error: err instanceof Error ? err.message : "Agent run failed." };
  }
  revalidatePath("/ai-analyst/agents");
  if (result.status === "failed") {
    return { error: result.error ?? "Agent run failed — see the run record." };
  }
  redirect(`/ai-analyst/agents/${result.runId}`);
}

export async function acceptRecommendationAction(
  _prev: AgentActionState,
  formData: FormData,
): Promise<AgentActionState> {
  const actor = await requirePermission(PERMISSIONS.TASKS_CREATE);
  const runId = String(formData.get("runId") ?? "");
  const index = Number(formData.get("recommendationIndex") ?? -1);
  if (!runId || !Number.isInteger(index) || index < 0) {
    return { error: "Missing run or recommendation reference." };
  }
  try {
    const { taskId } = await acceptAgentRecommendation({
      runId,
      recommendationIndex: index,
      actorUserId: actor.id,
    });
    revalidatePath(`/ai-analyst/agents/${runId}`);
    revalidatePath("/tasks");
    return { ok: `Task created (${taskId.slice(0, 8)}…) — see /tasks.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create the task." };
  }
}
