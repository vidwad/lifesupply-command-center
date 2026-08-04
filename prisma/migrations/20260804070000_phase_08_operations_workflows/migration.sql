-- Phase 8 — Operations, fulfillment, and customer-service workflow depth.

-- 1. tasks.relatedEntityId becomes a true polymorphic reference. The old FK
--    forced every non-null value to be an orders(id), which made
--    customer-service and supplier follow-up tasks impossible to link.
--    Referential integrity is now enforced per-type in createTask().
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_related_order_fk";

-- 2. Per-user saved views for operations queues.
CREATE TABLE "saved_views" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_views_userId_page_name_key" ON "saved_views"("userId", "page", "name");
CREATE INDEX "saved_views_userId_page_idx" ON "saved_views"("userId", "page");

ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
