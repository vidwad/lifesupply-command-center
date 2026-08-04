-- Phase 3D — fulfillments, refunds, and payment info (docs/19).
-- Order gains header-level payment/refund reporting fields; shipments become
-- first-class rows carrying tracking references.

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "orders" ADD COLUMN "refundedTotal" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "order_shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sourceSystem" TEXT,
    "sourceId" TEXT,
    "shippedAt" TIMESTAMP(3),
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_shipments_sourceSystem_sourceId_key" ON "order_shipments"("sourceSystem", "sourceId");
CREATE INDEX "order_shipments_orderId_idx" ON "order_shipments"("orderId");

-- AddForeignKey
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
