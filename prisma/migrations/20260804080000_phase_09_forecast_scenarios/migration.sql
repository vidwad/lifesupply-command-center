-- Phase 9 — Management reporting, forecasting, and scenario planning.
-- Versioned forecast scenarios with explicit assumptions, inputs, source
-- references, and limitations. Forecasts never mutate actuals.

CREATE TYPE "ForecastScenarioStatus" AS ENUM ('draft', 'under_review', 'approved', 'archived');

CREATE TABLE "forecast_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ForecastScenarioStatus" NOT NULL DEFAULT 'draft',
    "method" TEXT NOT NULL,
    "horizonMonths" INTEGER NOT NULL,
    "assumptions" JSONB NOT NULL,
    "inputs" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "sourceReferences" JSONB,
    "limitations" JSONB,
    "notes" TEXT,
    "createdById" TEXT,
    "approvalId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "forecast_scenarios_name_version_key" ON "forecast_scenarios"("name", "version");
CREATE INDEX "forecast_scenarios_status_idx" ON "forecast_scenarios"("status");
CREATE INDEX "forecast_scenarios_createdAt_idx" ON "forecast_scenarios"("createdAt");

ALTER TABLE "forecast_scenarios" ADD CONSTRAINT "forecast_scenarios_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "forecast_scenarios" ADD CONSTRAINT "forecast_scenarios_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
