-- Phase 10 — AI agent operating layer. One row per agent invocation, with
-- structured output, source references, tool skips, and human-created task
-- links. Agents read/analyze/draft/recommend only.

CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agentKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggeredById" TEXT,
    "params" JSONB,
    "toolKeysUsed" TEXT[],
    "skippedTools" JSONB,
    "sourceReferences" JSONB,
    "outputJson" JSONB,
    "summary" TEXT,
    "errorSummary" TEXT,
    "aiOutputId" TEXT,
    "createdTaskIds" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_runs_agentKey_startedAt_idx" ON "agent_runs"("agentKey", "startedAt");
CREATE INDEX "agent_runs_status_idx" ON "agent_runs"("status");
CREATE INDEX "agent_runs_triggeredById_idx" ON "agent_runs"("triggeredById");

ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_triggeredById_fkey"
    FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_aiOutputId_fkey"
    FOREIGN KEY ("aiOutputId") REFERENCES "ai_outputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
