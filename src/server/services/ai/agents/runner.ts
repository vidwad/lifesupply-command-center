/**
 * Agent runner (Phase 10). Executes one agent invocation end-to-end:
 *
 *   permission check → collect permitted tool data (skips recorded) →
 *   guarded prompt (untrusted-data fencing) → model call → zod-validated
 *   structured output → persist AgentRun + AiOutput → audit.
 *
 * Agents take NO actions. This module writes only AgentRun and AiOutput
 * rows (asserted by guardrails.test.ts); turning a recommendation into a
 * Task is the separate, human-triggered flow in accept.ts.
 */
import type { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

import { aiCall } from "../call";
import { AiOutputValidationError } from "../errors";
import { agentOutputSchema, type AgentOutput } from "./output-schema";
import { buildAgentContext, type ToolResultBlock } from "./context";
import { getAgent, type AgentDefinition } from "./registry";
import { getAgentTool, type ToolContext } from "./tools";
import { agentModule } from "./keys";

export class AgentRunError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentRunError";
  }
}

export type RunAgentInput = {
  agentKey: string;
  params?: Record<string, string>;
  user: { id: string; permissions: string[] };
};

export type RunAgentResult = {
  runId: string;
  status: "succeeded" | "failed";
  output: AgentOutput | null;
  skippedTools: { toolKey: string; reason: string }[];
  error?: string;
};

function validateParams(agent: AgentDefinition, params: Record<string, string>): void {
  for (const spec of agent.params) {
    if (spec.required && !params[spec.name]?.trim()) {
      throw new AgentRunError(`Parameter "${spec.label}" is required for ${agent.name}.`);
    }
  }
}

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const agent = getAgent(input.agentKey);
  if (!agent) throw new AgentRunError(`Unknown agent: ${input.agentKey}`);
  if (!input.user.permissions.includes(agent.runPermission)) {
    throw new AgentRunError(
      `Running ${agent.name} requires the ${agent.runPermission} permission.`,
    );
  }
  const params = input.params ?? {};
  validateParams(agent, params);

  const run = await prisma.agentRun.create({
    data: {
      agentKey: agent.key,
      status: "running",
      triggeredById: input.user.id,
      params: params as Prisma.InputJsonValue,
      toolKeysUsed: [],
      createdTaskIds: [],
    },
  });
  await writeAudit({
    actorUserId: input.user.id,
    action: "agent.run_started",
    entityType: "agent_run",
    entityId: run.id,
    afterData: { agentKey: agent.key, params: Object.keys(params) },
  });

  try {
    // ---- Collect tool data (permission-checked per tool; skips recorded).
    const ctx: ToolContext = { userId: input.user.id, permissions: input.user.permissions };
    const blocks: ToolResultBlock[] = [];
    const skipped: { toolKey: string; reason: string }[] = [];
    const sources: Record<string, string> = {};

    for (const toolKey of agent.toolKeys) {
      const tool = getAgentTool(toolKey);
      if (!tool) {
        skipped.push({ toolKey, reason: "tool not registered" });
        continue;
      }
      if (!input.user.permissions.includes(tool.permission)) {
        skipped.push({ toolKey, reason: `missing permission ${tool.permission}` });
        continue;
      }
      const result = await tool.collect(ctx, params);
      blocks.push({ toolKey, source: result.source, data: result.data });
      sources[toolKey] = result.source;
    }
    if (blocks.length === 0) {
      throw new AgentRunError(
        `No tool data available: ${skipped.map((s) => `${s.toolKey} (${s.reason})`).join("; ") || "no tools resolved"}.`,
      );
    }

    // ---- Model call with guarded context + schema-validated output.
    const result = await aiCall(agent.templateKey, {
      context: buildAgentContext(blocks),
      params: JSON.stringify(params),
    });
    const output = agentOutputSchema.parse(result.structuredOutput);

    // Skipped tools are a real limitation of the analysis — surface them.
    const limitations = [
      ...output.limitations,
      ...skipped.map((s) => `Tool ${s.toolKey} was not available (${s.reason}).`),
    ];

    const aiOutput = await prisma.aiOutput.create({
      data: {
        userId: input.user.id,
        modelProvider: result.modelProvider,
        modelName: result.modelName,
        module: agentModule(agent.key),
        prompt: result.template.userPrompt,
        output: result.output,
        structuredOutput: output as unknown as Prisma.InputJsonValue,
        sourceReferences: { agentRunId: run.id, tools: sources } as Prisma.InputJsonValue,
        tokenUsage: result.tokenUsage as Prisma.InputJsonValue,
        status: "generated",
        assumptions: output.assumptions,
        warnings: limitations,
        confidence: output.confidence,
        promptTemplateId: result.template.templateId,
        promptTemplateKey: result.template.templateKey,
        promptTemplateVersion: result.template.templateVersion,
      },
    });

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "succeeded",
        completedAt: new Date(),
        toolKeysUsed: blocks.map((b) => b.toolKey),
        skippedTools: skipped as unknown as Prisma.InputJsonValue,
        sourceReferences: sources as Prisma.InputJsonValue,
        outputJson: { ...output, limitations } as unknown as Prisma.InputJsonValue,
        summary: output.summary.slice(0, 2000),
        aiOutputId: aiOutput.id,
      },
    });
    await writeAudit({
      actorUserId: input.user.id,
      action: "agent.run_succeeded",
      entityType: "agent_run",
      entityId: run.id,
      afterData: {
        agentKey: agent.key,
        toolsUsed: blocks.map((b) => b.toolKey),
        toolsSkipped: skipped.length,
        findings: output.findings.length,
        recommendations: output.recommendations.length,
        confidence: output.confidence,
      },
    });
    return {
      runId: run.id,
      status: "succeeded",
      output: { ...output, limitations },
      skippedTools: skipped,
    };
  } catch (err) {
    const message =
      err instanceof AiOutputValidationError
        ? `Model output failed schema validation: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Agent run failed.";
    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "failed", completedAt: new Date(), errorSummary: message },
    });
    await writeAudit({
      actorUserId: input.user.id,
      action: "agent.run_failed",
      entityType: "agent_run",
      entityId: run.id,
      afterData: { agentKey: agent.key, error: message.slice(0, 300) },
    });
    return { runId: run.id, status: "failed", output: null, skippedTools: [], error: message };
  }
}

// ---------------------------------------------------------------------------
// Queries for the UI
// ---------------------------------------------------------------------------

export async function listAgentRuns(limit = 25) {
  return prisma.agentRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { triggeredBy: { select: { name: true, email: true } } },
  });
}

export async function getAgentRun(id: string) {
  return prisma.agentRun.findUnique({
    where: { id },
    include: {
      triggeredBy: { select: { id: true, name: true, email: true } },
      aiOutput: {
        select: { id: true, modelProvider: true, modelName: true, tokenUsage: true, status: true },
      },
    },
  });
}
