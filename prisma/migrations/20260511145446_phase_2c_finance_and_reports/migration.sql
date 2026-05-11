-- CreateEnum
CREATE TYPE "MonthlyCloseStatus" AS ENUM ('pending', 'in_progress', 'blocked', 'done', 'skipped');

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "aiOutputId" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "reportTemplateId" TEXT,
ADD COLUMN     "reportTemplateKey" TEXT,
ADD COLUMN     "reportTemplateVersion" INTEGER,
ADD COLUMN     "sourceReferences" JSONB,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "financial_adjustments" (
    "id" TEXT NOT NULL,
    "financialPeriodId" TEXT NOT NULL,
    "divisionId" TEXT,
    "category" TEXT NOT NULL,
    "accountKey" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "description" TEXT NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "divisionId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "accountKey" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_close_tasks" (
    "id" TEXT NOT NULL,
    "financialPeriodId" TEXT NOT NULL,
    "divisionId" TEXT,
    "taskKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "status" "MonthlyCloseStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_close_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "aiPromptKey" TEXT,
    "contextTags" TEXT[],
    "layout" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_adjustments_financialPeriodId_idx" ON "financial_adjustments"("financialPeriodId");

-- CreateIndex
CREATE INDEX "financial_adjustments_divisionId_idx" ON "financial_adjustments"("divisionId");

-- CreateIndex
CREATE INDEX "financial_adjustments_category_idx" ON "financial_adjustments"("category");

-- CreateIndex
CREATE INDEX "budgets_year_idx" ON "budgets"("year");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_year_divisionId_name_key" ON "budgets"("year", "divisionId", "name");

-- CreateIndex
CREATE INDEX "budget_lines_budgetId_idx" ON "budget_lines"("budgetId");

-- CreateIndex
CREATE INDEX "budget_lines_periodId_idx" ON "budget_lines"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_lines_budgetId_periodId_accountKey_key" ON "budget_lines"("budgetId", "periodId", "accountKey");

-- CreateIndex
CREATE INDEX "monthly_close_tasks_financialPeriodId_status_idx" ON "monthly_close_tasks"("financialPeriodId", "status");

-- CreateIndex
CREATE INDEX "monthly_close_tasks_ownerId_status_idx" ON "monthly_close_tasks"("ownerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_close_tasks_financialPeriodId_divisionId_taskKey_key" ON "monthly_close_tasks"("financialPeriodId", "divisionId", "taskKey");

-- CreateIndex
CREATE INDEX "report_templates_key_idx" ON "report_templates"("key");

-- CreateIndex
CREATE INDEX "report_templates_isActive_idx" ON "report_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_key_version_key" ON "report_templates"("key", "version");

-- CreateIndex
CREATE INDEX "reports_reportTemplateKey_reportTemplateVersion_idx" ON "reports"("reportTemplateKey", "reportTemplateVersion");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_aiOutputId_fkey" FOREIGN KEY ("aiOutputId") REFERENCES "ai_outputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_financialPeriodId_fkey" FOREIGN KEY ("financialPeriodId") REFERENCES "financial_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "financial_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_close_tasks" ADD CONSTRAINT "monthly_close_tasks_financialPeriodId_fkey" FOREIGN KEY ("financialPeriodId") REFERENCES "financial_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_close_tasks" ADD CONSTRAINT "monthly_close_tasks_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_close_tasks" ADD CONSTRAINT "monthly_close_tasks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_close_tasks" ADD CONSTRAINT "monthly_close_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
