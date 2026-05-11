-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AiOutputStatus" ADD VALUE 'superseded';
ALTER TYPE "AiOutputStatus" ADD VALUE 'archived';

-- AlterTable
ALTER TABLE "ai_outputs" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "assumptions" TEXT[],
ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "promptTemplateId" TEXT,
ADD COLUMN     "promptTemplateKey" TEXT,
ADD COLUMN     "promptTemplateVersion" INTEGER,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "warnings" TEXT[];

-- CreateIndex
CREATE INDEX "ai_outputs_status_idx" ON "ai_outputs"("status");

-- CreateIndex
CREATE INDEX "ai_outputs_promptTemplateKey_promptTemplateVersion_idx" ON "ai_outputs"("promptTemplateKey", "promptTemplateVersion");
