-- Phase 5 — full Campaign Builder (docs/19).
-- Campaigns gain a structured builder plan and a program → track self-relation
-- so consumer/B2B email tracks link to their parent reactivation program.

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "plan" JSONB;
ALTER TABLE "campaigns" ADD COLUMN "parentCampaignId" TEXT;

-- CreateIndex
CREATE INDEX "campaigns_parentCampaignId_idx" ON "campaigns"("parentCampaignId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_parentCampaignId_fkey" FOREIGN KEY ("parentCampaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
