-- Phase 3B — BigCommerce order line items (docs/19).
-- Adds a stable source key + metadata to order_items so the order sync can
-- upsert line items idempotently while preserving CC-owned cost/margin fields.

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "sourceSystem" TEXT;
ALTER TABLE "order_items" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "order_items" ADD COLUMN "metadata" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "order_items_sourceSystem_sourceId_key" ON "order_items"("sourceSystem", "sourceId");
