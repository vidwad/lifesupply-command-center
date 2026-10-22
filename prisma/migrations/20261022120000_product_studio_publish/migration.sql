-- Product Studio publishing to BigCommerce (product owner, 2026-10-22).
--
-- Additive and nullable throughout. Existing projects and drafts gain no
-- marks and no history, so nothing changes for them until a Super Admin acts.
-- Reverting the feature code leaves these columns and this table harmlessly
-- unused. No source-of-truth commerce record is altered by this migration;
-- the write itself is gated by three feature flags, all seeded off.

ALTER TABLE "product_studio_projects"
  ADD COLUMN "descriptionUploadApprovedAt" TIMESTAMP(3),
  ADD COLUMN "descriptionUploadApprovedById" TEXT,
  ADD COLUMN "descriptionPublishedAt" TIMESTAMP(3);

ALTER TABLE "product_studio_assets"
  ADD COLUMN "uploadApprovedAt" TIMESTAMP(3),
  ADD COLUMN "uploadApprovedById" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "bigCommerceImageId" INTEGER;

CREATE TYPE "ProductStudioPublishKind" AS ENUM ('image', 'description');

CREATE TYPE "ProductStudioPublishStatus" AS ENUM ('queued', 'succeeded', 'failed');

CREATE TABLE "product_studio_publish_logs" (
  "id" TEXT NOT NULL,
  "projectId" TEXT,
  "projectTitle" TEXT NOT NULL,
  "assetId" TEXT,
  "storeId" TEXT NOT NULL,
  "productId" TEXT,
  "sourceProductId" TEXT NOT NULL,
  "kind" "ProductStudioPublishKind" NOT NULL,
  "status" "ProductStudioPublishStatus" NOT NULL DEFAULT 'queued',
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "beforeSnapshot" JSONB,
  "bigCommerceImageId" INTEGER,
  "errorMessage" TEXT,
  "writtenById" TEXT,
  "writtenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_studio_publish_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_studio_publish_logs_projectId_idx" ON "product_studio_publish_logs"("projectId");
CREATE INDEX "product_studio_publish_logs_assetId_idx" ON "product_studio_publish_logs"("assetId");
CREATE INDEX "product_studio_publish_logs_status_idx" ON "product_studio_publish_logs"("status");

ALTER TABLE "product_studio_projects"
  ADD CONSTRAINT "product_studio_projects_descriptionUploadApprovedById_fkey"
  FOREIGN KEY ("descriptionUploadApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_studio_assets"
  ADD CONSTRAINT "product_studio_assets_uploadApprovedById_fkey"
  FOREIGN KEY ("uploadApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_studio_publish_logs"
  ADD CONSTRAINT "product_studio_publish_logs_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "product_studio_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_studio_publish_logs"
  ADD CONSTRAINT "product_studio_publish_logs_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "product_studio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_studio_publish_logs"
  ADD CONSTRAINT "product_studio_publish_logs_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_studio_publish_logs"
  ADD CONSTRAINT "product_studio_publish_logs_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_studio_publish_logs"
  ADD CONSTRAINT "product_studio_publish_logs_writtenById_fkey"
  FOREIGN KEY ("writtenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
