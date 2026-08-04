/**
 * Human acceptance of agent recommendations (Phase 10).
 *
 * Creating a task from a recommendation is a HUMAN action: the caller must
 * hold tasks.create (enforced at the server action), the task goes through
 * the normal tasks service (validation + audit), and the origin is recorded
 * (sourceType "ai_recommendation", sourceId = the agent run). This module
 * never uses raw prisma writes for anything except linking the created task
 * id back onto the run — asserted by guardrails.test.ts is that it uses the
 * tasks service, not prisma.task.
 */
import { prisma } from "@/server/db/client";
import { writeAudit } from "@/server/audit";
import { createTask } from "@/server/services/tasks";

import { agentOutputSchema, type AgentRecommendation } from "./output-schema";
import { getAgent } from "./registry";

/** Pure mapping from a recommendation to a task draft — exported for tests. */
export function buildTaskDraftFromRecommendation(args: {
  agentName: string;
  runId: string;
  recommendation: AgentRecommendation;
}): {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
} {
  const r = args.recommendation;
  const title = (r.suggestedTask?.title ?? r.title).slice(0, 200);
  const description = [
    r.detail,
    r.requiresApproval
      ? "NOTE: acting on this requires the relevant approval workflow — this task only tracks the work."
      : null,
    `Proposed by ${args.agentName} (agent run ${args.runId}). Review before acting — AI recommendations are suggestions, not decisions.`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 2000);
  return {
    title,
    description,
    priority: r.suggestedTask?.priority ?? "medium",
  };
}

/** Tasks already created from a run's recommendations, with their indices. */
export async function findAcceptedTasks(
  runId: string,
): Promise<{ taskId: string; recommendationIndex: number }[]> {
  const tasks = await prisma.task.findMany({
    where: { sourceType: "ai_recommendation", sourceId: runId },
    select: { id: true, metadata: true },
  });
  return tasks.map((t) => {
    const meta = (t.metadata ?? {}) as { recommendationIndex?: number };
    return {
      taskId: t.id,
      recommendationIndex:
        typeof meta.recommendationIndex === "number" ? meta.recommendationIndex : -1,
    };
  });
}

export async function acceptAgentRecommendation(args: {
  runId: string;
  recommendationIndex: number;
  actorUserId: string;
}): Promise<{ taskId: string }> {
  const run = await prisma.agentRun.findUniqueOrThrow({ where: { id: args.runId } });
  if (run.status !== "succeeded" || !run.outputJson) {
    throw new Error("Only successful agent runs have recommendations to accept.");
  }
  const agent = getAgent(run.agentKey);
  const output = agentOutputSchema.parse(run.outputJson);
  const recommendation = output.recommendations[args.recommendationIndex];
  if (!recommendation) {
    throw new Error(`Recommendation #${args.recommendationIndex} does not exist on this run.`);
  }

  // Dedupe: one task per (run, recommendation index).
  const existing = await findAcceptedTasks(run.id);
  const already = existing.find((t) => t.recommendationIndex === args.recommendationIndex);
  if (already) return { taskId: already.taskId };

  const draft = buildTaskDraftFromRecommendation({
    agentName: agent?.name ?? run.agentKey,
    runId: run.id,
    recommendation,
  });
  const task = await createTask({
    ...draft,
    createdById: args.actorUserId,
    sourceType: "ai_recommendation",
    sourceId: run.id,
    metadata: {
      agentKey: run.agentKey,
      agentRunId: run.id,
      aiOutputId: run.aiOutputId,
      recommendationIndex: args.recommendationIndex,
      requiresApproval: recommendation.requiresApproval ?? false,
    },
  });

  await prisma.agentRun.update({
    where: { id: run.id },
    data: { createdTaskIds: { push: task.id } },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "agent.recommendation_accepted",
    entityType: "agent_run",
    entityId: run.id,
    afterData: { taskId: task.id, recommendationIndex: args.recommendationIndex },
  });
  return { taskId: task.id };
}
