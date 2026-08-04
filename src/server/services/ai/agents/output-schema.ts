/**
 * Structured output envelope for Phase 10 agents (docs/09 §14).
 *
 * Every agent template instructs the model to emit EXACTLY this JSON shape;
 * `validateAiOutput` (output-schemas.ts) enforces it with this zod schema,
 * so workflow code never touches unvalidated model output. Recommendations
 * are proposals only — turning one into a Task is a separate human action.
 */
import { z } from "zod";

export const agentFindingSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().min(1).max(2000),
  severity: z.enum(["low", "medium", "high", "urgent"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const agentRecommendationSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().min(1).max(2000),
  /** Optional proposed internal task — created only by explicit human action. */
  suggestedTask: z
    .object({
      title: z.string().min(1).max(200),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    })
    .optional(),
  /** True when acting on this recommendation would need an approval workflow. */
  requiresApproval: z.boolean().optional(),
});

export const agentOutputSchema = z.object({
  summary: z.string().min(1).max(4000),
  findings: z.array(agentFindingSchema).max(20).default([]),
  recommendations: z.array(agentRecommendationSchema).max(10).default([]),
  assumptions: z.array(z.string().max(500)).max(10).default([]),
  limitations: z.array(z.string().max(500)).max(10).default([]),
  confidence: z.number().min(0).max(1).nullable().default(null),
});

export type AgentOutput = z.output<typeof agentOutputSchema>;
export type AgentRecommendation = z.output<typeof agentRecommendationSchema>;

/** The JSON contract embedded in every agent prompt template. */
export const AGENT_OUTPUT_FORMAT_INSTRUCTIONS = `Respond with ONLY a JSON object (no prose before or after, no markdown fences) matching exactly:
{
  "summary": "2-5 sentence plain-language summary of what the data shows",
  "findings": [{ "title": "...", "detail": "...", "severity": "low|medium|high|urgent", "confidence": 0.0-1.0 }],
  "recommendations": [{ "title": "...", "detail": "...", "suggestedTask": { "title": "...", "priority": "low|medium|high|urgent" }, "requiresApproval": true|false }],
  "assumptions": ["assumption you made because the data did not state it"],
  "limitations": ["what this analysis cannot conclude from the available data"],
  "confidence": 0.0-1.0
}
Rules: findings/recommendations arrays may be empty. Every recommendation must be actionable by a human — you cannot take actions yourself. Set requiresApproval true for anything customer-facing, financial, or external. State assumptions and limitations honestly; never invent data that is not in the provided context.`;
