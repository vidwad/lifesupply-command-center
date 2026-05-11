-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('order_delay', 'order_payment', 'order_address', 'supplier_stock', 'supplier_price_mismatch', 'supplier_sku_mismatch', 'product_missing_cost', 'product_missing_image', 'product_low_margin', 'financial_import', 'ai_output_review', 'integration_sync', 'other');

-- CreateEnum
CREATE TYPE "ExceptionSeverity" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ExceptionState" AS ENUM ('open', 'investigating', 'blocked', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "exceptions" (
    "id" TEXT NOT NULL,
    "exceptionType" "ExceptionType" NOT NULL,
    "severity" "ExceptionSeverity" NOT NULL DEFAULT 'medium',
    "status" "ExceptionState" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "recurringKey" TEXT,
    "source" TEXT,
    "assignedToId" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" "AiModelProvider" NOT NULL DEFAULT 'anthropic',
    "modelHint" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "userTemplate" TEXT NOT NULL,
    "outputSchema" JSONB,
    "contextTags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exceptions_status_severity_idx" ON "exceptions"("status", "severity");

-- CreateIndex
CREATE INDEX "exceptions_exceptionType_idx" ON "exceptions"("exceptionType");

-- CreateIndex
CREATE INDEX "exceptions_entityType_entityId_idx" ON "exceptions"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "exceptions_recurringKey_idx" ON "exceptions"("recurringKey");

-- CreateIndex
CREATE INDEX "exceptions_createdAt_idx" ON "exceptions"("createdAt");

-- CreateIndex
CREATE INDEX "prompt_templates_key_idx" ON "prompt_templates"("key");

-- CreateIndex
CREATE INDEX "prompt_templates_isActive_idx" ON "prompt_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_key_version_key" ON "prompt_templates"("key", "version");

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
