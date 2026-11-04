-- AI usage ledger (product owner, 2026-11-03).
--
-- One row per metered OpenAI call: text, image, transcription and live
-- Realtime sessions. The daily budgets set in Admin -> AI Settings are
-- enforced against the day's sum of estimated cost and audio seconds. The
-- cost is an estimate from list prices, never a billed amount.
--
-- CreateEnum
CREATE TYPE "AiUsageKind" AS ENUM ('text', 'image', 'transcription', 'realtime');

-- CreateTable
CREATE TABLE "ai_usage_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "kind" "AiUsageKind" NOT NULL,
    "modelName" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "cachedInputTokens" INTEGER,
    "outputTokens" INTEGER,
    "audioInputTokens" INTEGER,
    "audioOutputTokens" INTEGER,
    "imageInputTokens" INTEGER,
    "imageOutputTokens" INTEGER,
    "audioSeconds" INTEGER,
    "estimatedCostUsd" DECIMAL(10,4) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_events_createdAt_idx" ON "ai_usage_events"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_events_userId_createdAt_idx" ON "ai_usage_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_events_feature_createdAt_idx" ON "ai_usage_events"("feature", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
