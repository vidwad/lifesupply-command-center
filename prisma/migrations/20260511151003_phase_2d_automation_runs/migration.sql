-- CreateEnum
CREATE TYPE "AutomationWorkflow" AS ENUM ('price_check', 'stock_check', 'prepare_order', 'submit_order');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('prepared', 'awaiting_approval', 'approved', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "workflow" "AutomationWorkflow" NOT NULL,
    "supplierId" TEXT,
    "orderId" TEXT,
    "triggeredById" TEXT,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'prepared',
    "summary" TEXT,
    "validationFlags" JSONB,
    "result" JSONB,
    "errorSummary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "approvalId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_steps" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "output" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_evidence" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepId" TEXT,
    "kind" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "contentHash" TEXT,
    "bytes" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_runs_status_idx" ON "automation_runs"("status");

-- CreateIndex
CREATE INDEX "automation_runs_supplierId_workflow_idx" ON "automation_runs"("supplierId", "workflow");

-- CreateIndex
CREATE INDEX "automation_runs_orderId_idx" ON "automation_runs"("orderId");

-- CreateIndex
CREATE INDEX "automation_runs_startedAt_idx" ON "automation_runs"("startedAt");

-- CreateIndex
CREATE INDEX "automation_steps_runId_sortOrder_idx" ON "automation_steps"("runId", "sortOrder");

-- CreateIndex
CREATE INDEX "automation_evidence_runId_idx" ON "automation_evidence"("runId");

-- CreateIndex
CREATE INDEX "automation_evidence_capturedAt_idx" ON "automation_evidence"("capturedAt");

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_steps" ADD CONSTRAINT "automation_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_evidence" ADD CONSTRAINT "automation_evidence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
