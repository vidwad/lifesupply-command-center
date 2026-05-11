-- CreateEnum
CREATE TYPE "CapitalRaiseStatus" AS ENUM ('planning', 'open', 'closing', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('soft', 'signed', 'funded', 'withdrawn', 'declined');

-- CreateEnum
CREATE TYPE "DiligenceCategory" AS ENUM ('financial', 'legal', 'operational', 'commercial', 'technology', 'hr', 'regulatory', 'other');

-- CreateEnum
CREATE TYPE "DiligenceStatus" AS ENUM ('pending', 'in_progress', 'blocked', 'done', 'not_applicable');

-- CreateEnum
CREATE TYPE "InvestorUpdateStatus" AS ENUM ('draft', 'under_review', 'approved', 'released', 'archived');

-- CreateTable
CREATE TABLE "capital_raises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roundType" TEXT NOT NULL,
    "status" "CapitalRaiseStatus" NOT NULL DEFAULT 'planning',
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "preMoneyValuation" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_raises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_raise_commitments" (
    "id" TEXT NOT NULL,
    "capitalRaiseId" TEXT NOT NULL,
    "investorId" TEXT,
    "investorLabel" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'soft',
    "effectiveAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_raise_commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diligence_items" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "category" "DiligenceCategory" NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "status" "DiligenceStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "evidenceRef" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diligence_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_updates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodLabel" TEXT,
    "financialPeriodId" TEXT,
    "status" "InvestorUpdateStatus" NOT NULL DEFAULT 'draft',
    "bodyDraft" TEXT,
    "highlights" TEXT[],
    "distributionSnapshot" JSONB,
    "aiOutputId" TEXT,
    "preparedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "capital_raises_status_idx" ON "capital_raises"("status");

-- CreateIndex
CREATE INDEX "capital_raise_commitments_capitalRaiseId_status_idx" ON "capital_raise_commitments"("capitalRaiseId", "status");

-- CreateIndex
CREATE INDEX "capital_raise_commitments_investorId_idx" ON "capital_raise_commitments"("investorId");

-- CreateIndex
CREATE INDEX "diligence_items_opportunityId_status_idx" ON "diligence_items"("opportunityId", "status");

-- CreateIndex
CREATE INDEX "diligence_items_ownerId_status_idx" ON "diligence_items"("ownerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "diligence_items_opportunityId_itemKey_key" ON "diligence_items"("opportunityId", "itemKey");

-- CreateIndex
CREATE INDEX "investor_updates_status_idx" ON "investor_updates"("status");

-- CreateIndex
CREATE INDEX "investor_updates_financialPeriodId_idx" ON "investor_updates"("financialPeriodId");

-- AddForeignKey
ALTER TABLE "capital_raises" ADD CONSTRAINT "capital_raises_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_raise_commitments" ADD CONSTRAINT "capital_raise_commitments_capitalRaiseId_fkey" FOREIGN KEY ("capitalRaiseId") REFERENCES "capital_raises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_raise_commitments" ADD CONSTRAINT "capital_raise_commitments_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_raise_commitments" ADD CONSTRAINT "capital_raise_commitments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diligence_items" ADD CONSTRAINT "diligence_items_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diligence_items" ADD CONSTRAINT "diligence_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diligence_items" ADD CONSTRAINT "diligence_items_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_updates" ADD CONSTRAINT "investor_updates_financialPeriodId_fkey" FOREIGN KEY ("financialPeriodId") REFERENCES "financial_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_updates" ADD CONSTRAINT "investor_updates_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_updates" ADD CONSTRAINT "investor_updates_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_updates" ADD CONSTRAINT "investor_updates_aiOutputId_fkey" FOREIGN KEY ("aiOutputId") REFERENCES "ai_outputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
