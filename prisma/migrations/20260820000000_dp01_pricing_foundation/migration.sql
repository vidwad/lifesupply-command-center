-- Pricing Intelligence DP-1 foundation (docs/22 PRD). Additive only: new
-- tables and enums, no changes to existing data. This phase ships setup data
-- structures only — no competitor crawling and no BigCommerce writebacks.

-- CreateEnum
CREATE TYPE "PricingTermsReviewStatus" AS ENUM ('pending', 'reviewed_allowed', 'reviewed_restricted', 'disabled');

-- CreateEnum
CREATE TYPE "PricingRunSourceType" AS ENUM ('upload', 'top_products');

-- CreateEnum
CREATE TYPE "PricingRunStatus" AS ENUM ('draft', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "PricingRunItemStatus" AS ENUM ('pending', 'checked', 'recommendation_ready', 'approved', 'rejected', 'blocked', 'written_back', 'failed');

-- CreateEnum
CREATE TYPE "PricingExtractionMethod" AS ENUM ('direct_url', 'search_template', 'manual', 'ai_assisted');

-- CreateEnum
CREATE TYPE "PricingObservationStatus" AS ENUM ('valid', 'invalid', 'unavailable', 'low_confidence', 'failed');

-- CreateEnum
CREATE TYPE "PriceRecommendationStatus" AS ENUM ('draft', 'ready_for_review', 'approved', 'rejected', 'expired', 'written_back', 'failed');

-- CreateEnum
CREATE TYPE "PriceWritebackStatus" AS ENUM ('queued', 'succeeded', 'failed', 'rolled_back');

-- CreateEnum
CREATE TYPE "ProductCompetitorUrlStatus" AS ENUM ('active', 'needs_review', 'disabled');

-- CreateTable
CREATE TABLE "pricing_competitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "searchUrlTemplate" TEXT,
    "productUrlPattern" TEXT,
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 60,
    "termsReviewStatus" "PricingTermsReviewStatus" NOT NULL DEFAULT 'pending',
    "requiresManualUrlMapping" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lastSuccessfulCheckAt" TIMESTAMP(3),
    "lastFailedCheckAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" TEXT,
    "categoryId" TEXT,
    "productId" TEXT,
    "productVariantId" TEXT,
    "minCostMultiplier" DECIMAL(6,3) NOT NULL DEFAULT 1.40,
    "defaultUndercutAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.01,
    "defaultUndercutPct" DECIMAL(5,2),
    "maxIncreasePct" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "maxDecreasePct" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "dailyBatchSize" INTEGER NOT NULL DEFAULT 300,
    "minConfidence" DECIMAL(4,3) NOT NULL DEFAULT 0.850,
    "evidenceFreshnessHours" INTEGER NOT NULL DEFAULT 48,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveEligible" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_runs" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sourceType" "PricingRunSourceType" NOT NULL,
    "rankingBasis" TEXT,
    "lookbackWindow" TEXT,
    "targetCount" INTEGER,
    "dailyBatchSize" INTEGER NOT NULL DEFAULT 300,
    "status" "PricingRunStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastBatchAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_run_items" (
    "id" TEXT NOT NULL,
    "pricingRunId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "productVariantId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT,
    "currentRegularPrice" DECIMAL(12,2),
    "currentSalePrice" DECIMAL(12,2),
    "currentEffectivePrice" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2),
    "costSource" TEXT,
    "floorPrice" DECIMAL(12,2),
    "lowestCompetitorPrice" DECIMAL(12,2),
    "recommendedSalePrice" DECIMAL(12,2),
    "recommendationType" TEXT,
    "confidence" DECIMAL(4,3),
    "status" "PricingRunItemStatus" NOT NULL DEFAULT 'pending',
    "blockedReason" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_run_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_price_observations" (
    "id" TEXT NOT NULL,
    "pricingRunItemId" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "competitorUrl" TEXT NOT NULL,
    "observedRegularPrice" DECIMAL(12,2),
    "observedSalePrice" DECIMAL(12,2),
    "observedEffectivePrice" DECIMAL(12,2),
    "currency" TEXT,
    "availability" TEXT,
    "shippingNote" TEXT,
    "taxNote" TEXT,
    "matchConfidence" DECIMAL(4,3),
    "extractionMethod" "PricingExtractionMethod" NOT NULL,
    "rawEvidenceText" TEXT,
    "evidenceRef" TEXT,
    "checkedAt" TIMESTAMP(3),
    "status" "PricingObservationStatus" NOT NULL DEFAULT 'valid',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_price_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_recommendations" (
    "id" TEXT NOT NULL,
    "pricingRunItemId" TEXT NOT NULL,
    "oldRegularPrice" DECIMAL(12,2),
    "oldSalePrice" DECIMAL(12,2),
    "recommendedSalePrice" DECIMAL(12,2) NOT NULL,
    "floorPrice" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2),
    "marginBefore" DECIMAL(5,4),
    "marginAfter" DECIMAL(5,4),
    "lowestCompetitorPrice" DECIMAL(12,2),
    "undercutAmount" DECIMAL(10,2),
    "recommendationType" TEXT NOT NULL,
    "reason" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "status" "PriceRecommendationStatus" NOT NULL DEFAULT 'draft',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_writeback_logs" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "productVariantId" TEXT,
    "sourceSystem" TEXT,
    "sourceProductId" TEXT,
    "sourceVariantId" TEXT,
    "oldRegularPrice" DECIMAL(12,2),
    "oldSalePrice" DECIMAL(12,2),
    "newSalePrice" DECIMAL(12,2) NOT NULL,
    "status" "PriceWritebackStatus" NOT NULL DEFAULT 'queued',
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "writtenById" TEXT,
    "writtenAt" TIMESTAMP(3),
    "rollbackPayload" JSONB,
    "rollbackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_writeback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_competitor_urls" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "productVariantId" TEXT,
    "competitorId" TEXT NOT NULL,
    "competitorUrl" TEXT NOT NULL,
    "matchConfidence" DECIMAL(4,3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "status" "ProductCompetitorUrlStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_competitor_urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_competitors_name_key" ON "pricing_competitors"("name");

-- CreateIndex
CREATE INDEX "pricing_competitors_enabled_idx" ON "pricing_competitors"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_name_key" ON "pricing_rules"("name");

-- CreateIndex
CREATE INDEX "pricing_rules_enabled_idx" ON "pricing_rules"("enabled");

-- CreateIndex
CREATE INDEX "pricing_rules_storeId_idx" ON "pricing_rules"("storeId");

-- CreateIndex
CREATE INDEX "pricing_runs_storeId_idx" ON "pricing_runs"("storeId");

-- CreateIndex
CREATE INDEX "pricing_runs_status_idx" ON "pricing_runs"("status");

-- CreateIndex
CREATE INDEX "pricing_run_items_pricingRunId_idx" ON "pricing_run_items"("pricingRunId");

-- CreateIndex
CREATE INDEX "pricing_run_items_status_idx" ON "pricing_run_items"("status");

-- CreateIndex
CREATE INDEX "pricing_run_items_sku_idx" ON "pricing_run_items"("sku");

-- CreateIndex
CREATE INDEX "competitor_price_observations_pricingRunItemId_idx" ON "competitor_price_observations"("pricingRunItemId");

-- CreateIndex
CREATE INDEX "competitor_price_observations_competitorId_idx" ON "competitor_price_observations"("competitorId");

-- CreateIndex
CREATE INDEX "price_recommendations_pricingRunItemId_idx" ON "price_recommendations"("pricingRunItemId");

-- CreateIndex
CREATE INDEX "price_recommendations_status_idx" ON "price_recommendations"("status");

-- CreateIndex
CREATE INDEX "price_writeback_logs_recommendationId_idx" ON "price_writeback_logs"("recommendationId");

-- CreateIndex
CREATE INDEX "price_writeback_logs_status_idx" ON "price_writeback_logs"("status");

-- CreateIndex
CREATE INDEX "product_competitor_urls_productId_idx" ON "product_competitor_urls"("productId");

-- CreateIndex
CREATE INDEX "product_competitor_urls_productVariantId_idx" ON "product_competitor_urls"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_competitor_urls_competitorId_competitorUrl_key" ON "product_competitor_urls"("competitorId", "competitorUrl");

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_runs" ADD CONSTRAINT "pricing_runs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_runs" ADD CONSTRAINT "pricing_runs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_run_items" ADD CONSTRAINT "pricing_run_items_pricingRunId_fkey" FOREIGN KEY ("pricingRunId") REFERENCES "pricing_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_run_items" ADD CONSTRAINT "pricing_run_items_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_run_items" ADD CONSTRAINT "pricing_run_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_run_items" ADD CONSTRAINT "pricing_run_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_price_observations" ADD CONSTRAINT "competitor_price_observations_pricingRunItemId_fkey" FOREIGN KEY ("pricingRunItemId") REFERENCES "pricing_run_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_price_observations" ADD CONSTRAINT "competitor_price_observations_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "pricing_competitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_recommendations" ADD CONSTRAINT "price_recommendations_pricingRunItemId_fkey" FOREIGN KEY ("pricingRunItemId") REFERENCES "pricing_run_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_recommendations" ADD CONSTRAINT "price_recommendations_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_recommendations" ADD CONSTRAINT "price_recommendations_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_writeback_logs" ADD CONSTRAINT "price_writeback_logs_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "price_recommendations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_writeback_logs" ADD CONSTRAINT "price_writeback_logs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_writeback_logs" ADD CONSTRAINT "price_writeback_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_writeback_logs" ADD CONSTRAINT "price_writeback_logs_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_writeback_logs" ADD CONSTRAINT "price_writeback_logs_writtenById_fkey" FOREIGN KEY ("writtenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_competitor_urls" ADD CONSTRAINT "product_competitor_urls_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_competitor_urls" ADD CONSTRAINT "product_competitor_urls_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_competitor_urls" ADD CONSTRAINT "product_competitor_urls_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "pricing_competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_competitor_urls" ADD CONSTRAINT "product_competitor_urls_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

