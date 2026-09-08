-- Public website publication foundation.
-- Additive only: no existing operational, financial, investor CRM, customer,
-- order, supplier, or authentication tables are modified or exposed.

CREATE TYPE "PublicContentStatus" AS ENUM ('draft', 'under_review', 'approved', 'published', 'archived');
CREATE TYPE "PublicContentType" AS ENUM ('corporate_page', 'leadership_profile', 'news_item', 'investor_update', 'product_collection');

CREATE TABLE "public_content_items" (
  "id" TEXT NOT NULL,
  "siteKey" TEXT NOT NULL DEFAULT 'lifesupply-health',
  "contentType" "PublicContentType" NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "body" TEXT,
  "payload" JSONB,
  "status" "PublicContentStatus" NOT NULL DEFAULT 'draft',
  "sourceReference" TEXT,
  "effectiveAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "preparedById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "public_content_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public_documents" (
  "id" TEXT NOT NULL,
  "siteKey" TEXT NOT NULL DEFAULT 'lifesupply-health',
  "title" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "periodLabel" TEXT,
  "fileKey" TEXT NOT NULL,
  "publicUrl" TEXT,
  "disclosureText" TEXT,
  "sourceReference" TEXT,
  "status" "PublicContentStatus" NOT NULL DEFAULT 'draft',
  "preparedById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "public_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public_metric_snapshots" (
  "id" TEXT NOT NULL,
  "siteKey" TEXT NOT NULL DEFAULT 'lifesupply-health',
  "metricKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "unit" TEXT,
  "periodLabel" TEXT NOT NULL,
  "basis" TEXT,
  "disclosureText" TEXT,
  "sourceReference" TEXT,
  "status" "PublicContentStatus" NOT NULL DEFAULT 'draft',
  "preparedById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "public_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public_contact_channels" (
  "id" TEXT NOT NULL,
  "siteKey" TEXT NOT NULL DEFAULT 'lifesupply-health',
  "label" TEXT NOT NULL,
  "channelType" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "contactName" TEXT,
  "purpose" TEXT,
  "region" TEXT,
  "status" "PublicContentStatus" NOT NULL DEFAULT 'draft',
  "verifiedAt" TIMESTAMP(3),
  "preparedById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "public_contact_channels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "public_content_items_siteKey_contentType_slug_key" ON "public_content_items"("siteKey", "contentType", "slug");
CREATE INDEX "public_content_items_siteKey_contentType_status_idx" ON "public_content_items"("siteKey", "contentType", "status");
CREATE INDEX "public_content_items_status_publishedAt_idx" ON "public_content_items"("status", "publishedAt");
CREATE INDEX "public_documents_siteKey_status_publishedAt_idx" ON "public_documents"("siteKey", "status", "publishedAt");
CREATE UNIQUE INDEX "public_metric_snapshots_siteKey_metricKey_periodLabel_key" ON "public_metric_snapshots"("siteKey", "metricKey", "periodLabel");
CREATE INDEX "public_metric_snapshots_siteKey_status_publishedAt_idx" ON "public_metric_snapshots"("siteKey", "status", "publishedAt");
CREATE INDEX "public_contact_channels_siteKey_status_publishedAt_idx" ON "public_contact_channels"("siteKey", "status", "publishedAt");

ALTER TABLE "public_content_items" ADD CONSTRAINT "public_content_items_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_content_items" ADD CONSTRAINT "public_content_items_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_documents" ADD CONSTRAINT "public_documents_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_documents" ADD CONSTRAINT "public_documents_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_metric_snapshots" ADD CONSTRAINT "public_metric_snapshots_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_metric_snapshots" ADD CONSTRAINT "public_metric_snapshots_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_contact_channels" ADD CONSTRAINT "public_contact_channels_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_contact_channels" ADD CONSTRAINT "public_contact_channels_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
