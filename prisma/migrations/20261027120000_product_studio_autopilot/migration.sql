-- Product Studio unattended runs (product owner, 2026-10-27).
--
-- Additive only. A run holds the frozen criteria and running totals; an item
-- is one product in the run. Projects gain a nullable link to the run that
-- owns them, and drafts gain a nullable timestamp marking an automatic review.
-- Existing rows are untouched and nothing changes for them.

CREATE TYPE "ProductStudioRunStatus" AS ENUM ('queued', 'running', 'succeeded', 'needs_attention', 'failed', 'cancelled');

CREATE TYPE "ProductStudioRunItemStage" AS ENUM ('pending', 'claimed', 'researching', 'generating', 'reviewing', 'publishing', 'done', 'attention', 'failed', 'skipped', 'cancelled');

CREATE TABLE "product_studio_runs" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "status" "ProductStudioRunStatus" NOT NULL DEFAULT 'queued',
    "settings" JSONB NOT NULL,
    "approvalId" TEXT,
    "imagesGenerated" INTEGER NOT NULL DEFAULT 0,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "cancelRequestedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "stopReason" TEXT,
    "summary" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_studio_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_studio_run_items" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "projectId" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "stage" "ProductStudioRunItemStage" NOT NULL DEFAULT 'pending',
    "steps" INTEGER NOT NULL DEFAULT 0,
    "imagesGenerated" INTEGER NOT NULL DEFAULT 0,
    "regenerations" INTEGER NOT NULL DEFAULT 0,
    "approvedSlots" INTEGER NOT NULL DEFAULT 0,
    "publishedItems" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_studio_run_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "product_studio_projects" ADD COLUMN "autopilotRunId" TEXT;

ALTER TABLE "product_studio_assets" ADD COLUMN "autoReviewedAt" TIMESTAMP(3);

CREATE INDEX "product_studio_runs_status_idx" ON "product_studio_runs"("status");
CREATE INDEX "product_studio_runs_createdAt_idx" ON "product_studio_runs"("createdAt");
CREATE INDEX "product_studio_run_items_runId_sortOrder_idx" ON "product_studio_run_items"("runId", "sortOrder");
CREATE INDEX "product_studio_run_items_projectId_idx" ON "product_studio_run_items"("projectId");
CREATE INDEX "product_studio_run_items_stage_idx" ON "product_studio_run_items"("stage");
CREATE INDEX "product_studio_projects_autopilotRunId_idx" ON "product_studio_projects"("autopilotRunId");

ALTER TABLE "product_studio_runs" ADD CONSTRAINT "product_studio_runs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_studio_runs" ADD CONSTRAINT "product_studio_runs_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_studio_run_items" ADD CONSTRAINT "product_studio_run_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES "product_studio_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_studio_run_items" ADD CONSTRAINT "product_studio_run_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_studio_projects" ADD CONSTRAINT "product_studio_projects_autopilotRunId_fkey" FOREIGN KEY ("autopilotRunId") REFERENCES "product_studio_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
