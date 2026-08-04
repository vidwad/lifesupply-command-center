-- Phase 3E — reconciliation reports (docs/19).
-- Point-in-time comparisons of Command Center totals vs BigCommerce source
-- totals per store; material discrepancies also raise Exception rows.

-- CreateTable
CREATE TABLE "reconciliation_reports" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "triggeredById" TEXT,
    "rangeStart" TIMESTAMP(3) NOT NULL,
    "rangeEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "metrics" JSONB,
    "discrepancyCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reconciliation_reports_storeId_createdAt_idx" ON "reconciliation_reports"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "reconciliation_reports" ADD CONSTRAINT "reconciliation_reports_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reconciliation_reports" ADD CONSTRAINT "reconciliation_reports_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
