import { type Prisma, SyncStatus, type IntegrationType } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

import { parseCsv, pick, pickNumber } from "./csv";
import type { ImportStatus, ImportSummary } from "./bigcommerce";

function mapStatus(s: ImportStatus): SyncStatus {
  switch (s) {
    case "completed":
      return SyncStatus.success;
    case "completed_with_warnings":
      return SyncStatus.partial;
    case "failed":
      return SyncStatus.failed;
  }
}

const SOURCE_SYSTEM = "quickbooks";

async function ensureConnection(integrationType: IntegrationType) {
  return prisma.integrationConnection.upsert({
    where: { integrationType_name: { integrationType, name: "default" } },
    create: { integrationType, name: "default", status: "configured" },
    update: {},
  });
}

/**
 * Import a P&L summary CSV. Expected columns (any of):
 *   period            — name of the financial period (must already exist)
 *   division          — optional division code
 *   revenue, cogs, gross_profit, operating_expenses, operating_income,
 *   ebitda, adjusted_ebitda, cash, accounts_receivable, accounts_payable,
 *   working_capital, currency
 *
 * One row per (period, division). Idempotent on (financialPeriodId, divisionId).
 */
export async function importQuickBooksPnl(args: {
  csvText: string;
  actor: { id: string };
}): Promise<ImportSummary> {
  const { rows, warnings } = parseCsv(args.csvText);

  const connection = await ensureConnection("quickbooks");
  const run = await prisma.integrationSyncLog.create({
    data: {
      integrationConnectionId: connection.id,
      syncType: "financial_pnl",
      status: "running",
      startedAt: new Date(),
      triggeredById: args.actor.id,
      metadata: { mode: "csv_upload" } as Prisma.InputJsonValue,
    },
  });

  let created = 0;
  let updated = 0;
  let failed = 0;
  const errorWarnings: string[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const periodName = pick(row, ["period", "Period", "month", "Month"]);
      if (!periodName) {
        failed++;
        errorWarnings.push(`Row ${index + 2}: missing period name`);
        continue;
      }
      const period = await prisma.financialPeriod.findUnique({ where: { name: periodName } });
      if (!period) {
        failed++;
        errorWarnings.push(`Row ${index + 2}: financial period "${periodName}" not found`);
        continue;
      }

      const divisionCode = pick(row, ["division", "Division", "division_code"]);
      let divisionId: string | null = null;
      if (divisionCode) {
        const div = await prisma.division.findUnique({ where: { code: divisionCode.toUpperCase() } });
        if (!div) {
          failed++;
          errorWarnings.push(
            `Row ${index + 2}: division code "${divisionCode}" not found`,
          );
          continue;
        }
        divisionId = div.id;
      }

      const revenue = pickNumber(row, ["revenue", "Revenue", "Total Income"]) ?? 0;
      const cogs = pickNumber(row, ["cogs", "COGS", "Cost of Goods Sold"]) ?? 0;
      const grossProfit = pickNumber(row, ["gross_profit", "Gross Profit"]) ?? revenue - cogs;
      const operatingExpenses = pickNumber(row, ["operating_expenses", "Total Expenses"]) ?? 0;
      const operatingIncome =
        pickNumber(row, ["operating_income", "Net Income"]) ?? grossProfit - operatingExpenses;
      const ebitda = pickNumber(row, ["ebitda", "EBITDA"]);
      const adjustedEbitda = pickNumber(row, ["adjusted_ebitda", "Adjusted EBITDA"]);
      const cash = pickNumber(row, ["cash", "Cash"]);
      const accountsReceivable = pickNumber(row, ["accounts_receivable", "AR", "Accounts Receivable"]);
      const accountsPayable = pickNumber(row, ["accounts_payable", "AP", "Accounts Payable"]);
      const workingCapital = pickNumber(row, ["working_capital", "Working Capital"]);
      const currency = pick(row, ["currency", "Currency"]) ?? "CAD";

      const grossMargin = revenue > 0 ? grossProfit / revenue : null;

      const data = {
        financialPeriodId: period.id,
        divisionId,
        revenue,
        cogs,
        grossProfit,
        grossMargin,
        operatingExpenses,
        operatingIncome,
        ebitda,
        adjustedEbitda,
        cash,
        accountsReceivable,
        accountsPayable,
        workingCapital,
        currency,
        sourceSystem: SOURCE_SYSTEM,
        sourceImportId: run.id,
      };

      const existing = await prisma.financialSummary.findFirst({
        where: { financialPeriodId: period.id, divisionId },
      });
      if (existing) {
        await prisma.financialSummary.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.financialSummary.create({ data });
        created++;
      }
    } catch (err) {
      failed++;
      errorWarnings.push(
        `Row ${index + 2}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  const allWarnings = [...warnings, ...errorWarnings];
  const status =
    failed > 0
      ? rows.length === failed
        ? "failed"
        : "completed_with_warnings"
      : allWarnings.length > 0
        ? "completed_with_warnings"
        : "completed";

  await prisma.integrationSyncLog.update({
    where: { id: run.id },
    data: {
      status: mapStatus(status),
      completedAt: new Date(),
      recordsProcessed: rows.length,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsFailed: failed,
      errorSummary: allWarnings.slice(0, 10).join("\n") || null,
    },
  });

  // Surface failures into the operations exception queue for triage.
  if (status !== "completed" && failed > 0) {
    const { createException } = await import("@/server/services/exceptions");
    await createException(
      {
        exceptionType: "financial_import",
        severity: status === "failed" ? "high" : "medium",
        title: `QuickBooks P&L import had ${failed} failed row${failed === 1 ? "" : "s"}`,
        description: allWarnings.slice(0, 10).join("\n") || null,
        entityType: "integration_sync_log",
        entityId: run.id,
        recurringKey: "quickbooks:pnl:row_failures",
        source: "quickbooks",
      },
      { id: args.actor.id },
    );
  }

  await writeAudit({
    actorUserId: args.actor.id,
    action: "import.quickbooks.pnl",
    entityType: "integration_sync_log",
    entityId: run.id,
    afterData: { created, updated, failed, processed: rows.length },
  });

  return {
    syncLogId: run.id,
    status,
    recordsProcessed: rows.length,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    warnings: allWarnings,
  };
}
