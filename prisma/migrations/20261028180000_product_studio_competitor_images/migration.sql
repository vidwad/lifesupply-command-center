-- Product Studio: a seller image as the reference when a project has no
-- photograph (product owner, 2026-10-28).
--
-- Additive only. A search row records one run of the seller-image search; a
-- candidate row records one seller image found, with a thumbnail for choosing
-- and the hash of the image as fetched. Selecting a candidate creates an
-- ordinary source asset and links the candidate to it. Existing rows are
-- untouched.

-- CreateEnum
CREATE TYPE "ProductStudioImageSearchStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "product_studio_image_searches" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" "ProductStudioImageSearchStatus" NOT NULL DEFAULT 'queued',
    "query" TEXT NOT NULL,
    "modelName" TEXT,
    "errorMessage" TEXT,
    "warnings" TEXT[],
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_studio_image_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_studio_image_candidates" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "pageTitle" TEXT,
    "pageUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourceType" TEXT,
    "imageKind" TEXT,
    "notes" TEXT,
    "matchConfidence" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "contentType" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "contentHash" TEXT,
    "thumbnail" BYTEA,
    "fetchError" TEXT,
    "selectedAt" TIMESTAMP(3),
    "assetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_studio_image_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_studio_image_searches_projectId_createdAt_idx" ON "product_studio_image_searches"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_studio_image_candidates_assetId_key" ON "product_studio_image_candidates"("assetId");

-- CreateIndex
CREATE INDEX "product_studio_image_candidates_projectId_idx" ON "product_studio_image_candidates"("projectId");

-- CreateIndex
CREATE INDEX "product_studio_image_candidates_searchId_sortOrder_idx" ON "product_studio_image_candidates"("searchId", "sortOrder");

-- AddForeignKey
ALTER TABLE "product_studio_image_searches" ADD CONSTRAINT "product_studio_image_searches_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_studio_image_searches" ADD CONSTRAINT "product_studio_image_searches_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_studio_image_candidates" ADD CONSTRAINT "product_studio_image_candidates_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "product_studio_image_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_studio_image_candidates" ADD CONSTRAINT "product_studio_image_candidates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_studio_image_candidates" ADD CONSTRAINT "product_studio_image_candidates_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "product_studio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
