-- CreateTable
CREATE TABLE "investors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "investorType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_interactions" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "interactionDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "nextAction" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "opportunityType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'identified',
    "strategicRationale" TEXT,
    "estimatedRevenueImpact" DECIMAL(14,2),
    "estimatedMarginImpact" DECIMAL(5,4),
    "estimatedCost" DECIMAL(14,2),
    "riskRating" TEXT,
    "priority" TEXT,
    "ownerId" TEXT,
    "nextAction" TEXT,
    "dueDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acquisition_targets" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "geography" TEXT,
    "revenueEstimate" DECIMAL(14,2),
    "ebitdaEstimate" DECIMAL(14,2),
    "strategicFit" TEXT,
    "integrationComplexity" TEXT,
    "valuationNotes" TEXT,
    "diligenceStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acquisition_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investors_status_idx" ON "investors"("status");

-- CreateIndex
CREATE INDEX "investor_interactions_investorId_idx" ON "investor_interactions"("investorId");

-- CreateIndex
CREATE INDEX "investor_interactions_interactionDate_idx" ON "investor_interactions"("interactionDate");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunities_opportunityType_idx" ON "opportunities"("opportunityType");

-- CreateIndex
CREATE INDEX "opportunities_priority_idx" ON "opportunities"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "acquisition_targets_opportunityId_key" ON "acquisition_targets"("opportunityId");

-- AddForeignKey
ALTER TABLE "investor_interactions" ADD CONSTRAINT "investor_interactions_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_interactions" ADD CONSTRAINT "investor_interactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisition_targets" ADD CONSTRAINT "acquisition_targets_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
