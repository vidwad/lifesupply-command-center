-- Product Studio is additive and review-only. It does not alter source-of-truth
-- commerce records or enable any external write-back.

CREATE TYPE "ProductStudioProjectStatus" AS ENUM (
  'draft',
  'research_queued',
  'researching',
  'ready_to_generate',
  'generating',
  'needs_review',
  'approved',
  'failed',
  'archived'
);

CREATE TYPE "ProductStudioAssetKind" AS ENUM ('source', 'generated');

CREATE TYPE "ProductStudioAssetStatus" AS ENUM (
  'uploaded',
  'queued',
  'generating',
  'needs_review',
  'approved',
  'rejected',
  'failed'
);

CREATE TYPE "ProductStudioCompositionStatus" AS ENUM (
  'planned',
  'queued',
  'generating',
  'generated',
  'failed'
);

CREATE TABLE "product_studio_projects" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "createdById" TEXT,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "confirmedTitle" TEXT,
  "finalDescription" TEXT,
  "status" "ProductStudioProjectStatus" NOT NULL DEFAULT 'draft',
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "marketLow" DECIMAL(12,2),
  "marketHigh" DECIMAL(12,2),
  "marketMedian" DECIMAL(12,2),
  "researchSummary" JSONB,
  "warnings" TEXT[] NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_studio_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_studio_assets" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "kind" "ProductStudioAssetKind" NOT NULL,
  "compositionSlot" INTEGER,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "contentHash" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "prompt" TEXT,
  "modelName" TEXT,
  "status" "ProductStudioAssetStatus" NOT NULL DEFAULT 'uploaded',
  "qaResult" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_studio_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_studio_research_sources" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sellerName" TEXT NOT NULL,
  "pageTitle" TEXT,
  "url" TEXT NOT NULL,
  "heroImageUrl" TEXT,
  "sourceType" TEXT,
  "notes" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_studio_research_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_studio_price_observations" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sellerName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "condition" TEXT,
  "includedAccessories" TEXT,
  "notes" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_studio_price_observations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_studio_compositions" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "slot" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "sourceSeller" TEXT,
  "sourceUrl" TEXT,
  "referenceImageUrl" TEXT,
  "rationale" TEXT NOT NULL,
  "attributes" JSONB NOT NULL,
  "prompt" TEXT NOT NULL,
  "status" "ProductStudioCompositionStatus" NOT NULL DEFAULT 'planned',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_studio_compositions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_studio_projects_productId_idx" ON "product_studio_projects"("productId");
CREATE INDEX "product_studio_projects_createdById_idx" ON "product_studio_projects"("createdById");
CREATE INDEX "product_studio_projects_status_idx" ON "product_studio_projects"("status");
CREATE INDEX "product_studio_projects_createdAt_idx" ON "product_studio_projects"("createdAt");
CREATE UNIQUE INDEX "product_studio_assets_projectId_kind_compositionSlot_revision_key" ON "product_studio_assets"("projectId", "kind", "compositionSlot", "revision");
CREATE INDEX "product_studio_assets_projectId_idx" ON "product_studio_assets"("projectId");
CREATE INDEX "product_studio_assets_status_idx" ON "product_studio_assets"("status");
CREATE UNIQUE INDEX "product_studio_research_sources_projectId_url_key" ON "product_studio_research_sources"("projectId", "url");
CREATE INDEX "product_studio_research_sources_projectId_idx" ON "product_studio_research_sources"("projectId");
CREATE INDEX "product_studio_price_observations_projectId_idx" ON "product_studio_price_observations"("projectId");
CREATE INDEX "product_studio_price_observations_observedAt_idx" ON "product_studio_price_observations"("observedAt");
CREATE UNIQUE INDEX "product_studio_compositions_projectId_slot_key" ON "product_studio_compositions"("projectId", "slot");
CREATE INDEX "product_studio_compositions_projectId_idx" ON "product_studio_compositions"("projectId");
CREATE INDEX "product_studio_compositions_status_idx" ON "product_studio_compositions"("status");

ALTER TABLE "product_studio_projects"
  ADD CONSTRAINT "product_studio_projects_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_studio_projects"
  ADD CONSTRAINT "product_studio_projects_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_studio_assets"
  ADD CONSTRAINT "product_studio_assets_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_studio_research_sources"
  ADD CONSTRAINT "product_studio_research_sources_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_studio_price_observations"
  ADD CONSTRAINT "product_studio_price_observations_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_studio_compositions"
  ADD CONSTRAINT "product_studio_compositions_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
