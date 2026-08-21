-- Product Studio: full buyer-facing description produced by research.
--
-- Additive and nullable. Projects researched before this column existed keep a
-- NULL value and simply render no long description, so no backfill is needed
-- and reverting the feature code leaves the column harmlessly unused.
ALTER TABLE "product_studio_projects" ADD COLUMN "longDescription" TEXT;
