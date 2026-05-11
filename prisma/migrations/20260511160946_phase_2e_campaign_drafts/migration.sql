-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "aiOutputId" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "audienceSnapshot" JSONB,
ADD COLUMN     "bodyDraft" TEXT,
ADD COLUMN     "mailchimpExportError" TEXT,
ADD COLUMN     "mailchimpExportStatus" TEXT DEFAULT 'not_queued',
ADD COLUMN     "mailchimpExportedAt" TIMESTAMP(3),
ADD COLUMN     "mailchimpExternalId" TEXT;

-- CreateIndex
CREATE INDEX "campaigns_mailchimpExportStatus_idx" ON "campaigns"("mailchimpExportStatus");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_aiOutputId_fkey" FOREIGN KEY ("aiOutputId") REFERENCES "ai_outputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
