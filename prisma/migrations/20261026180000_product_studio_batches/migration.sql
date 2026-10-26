-- Product Studio batches (product owner, 2026-10-26).
--
-- Projects created together from the products list share a batch id so the
-- project page can step through them. Additive and nullable: existing
-- projects have no batch and nothing changes for them.
ALTER TABLE "product_studio_projects" ADD COLUMN "batchId" TEXT;

CREATE INDEX "product_studio_projects_batchId_idx" ON "product_studio_projects"("batchId");
