import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

import { parseCsv, pick, pickNumber } from "../imports/csv";

export const BUDGET_ACCOUNT_KEYS = [
  "revenue",
  "cogs",
  "gross_profit",
  "operating_expenses",
  "operating_income",
  "ebitda",
] as const;

export type BudgetAccountKey = (typeof BUDGET_ACCOUNT_KEYS)[number];

const VALID_KEYS = new Set<string>(BUDGET_ACCOUNT_KEYS);

export type BudgetSummary = {
  id: string;
  name: string;
  year: number;
  divisionName: string | null;
  divisionId: string | null;
  isActive: boolean;
  lineCount: number;
  createdAt: Date;
};

export async function listBudgets(filters: { year?: number } = {}): Promise<BudgetSummary[]> {
  const rows = await prisma.budget.findMany({
    where: filters.year ? { year: filters.year } : undefined,
    include: {
      division: { select: { name: true } },
      _count: { select: { lines: true } },
    },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    year: r.year,
    divisionId: r.divisionId,
    divisionName: r.division?.name ?? null,
    isActive: r.isActive,
    lineCount: r._count.lines,
    createdAt: r.createdAt,
  }));
}

export type ImportBudgetResult = {
  budgetId: string;
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsFailed: number;
  warnings: string[];
};

/**
 * Import a budget from CSV. Expected columns:
 *   period   — financial period name (e.g. "2026-04"); must already exist
 *   account  — one of: revenue, cogs, gross_profit, operating_expenses,
 *              operating_income, ebitda
 *   amount   — the budgeted value
 *
 * Idempotent on (budget, period, account). Pre-existing lines are
 * overwritten so the importer can be re-run after corrections.
 */
export async function importBudgetCsv(args: {
  name: string;
  year: number;
  divisionId?: string | null;
  csvText: string;
  actor: { id: string };
}): Promise<ImportBudgetResult> {
  if (!args.name.trim()) throw new Error("Budget name is required.");
  if (!Number.isInteger(args.year) || args.year < 2000 || args.year > 2100) {
    throw new Error("Year must be an integer between 2000 and 2100.");
  }

  // Compound uniques with nullable fields can't be used in upsert.where, so
  // do a findFirst + create-or-reuse.
  const existing = await prisma.budget.findFirst({
    where: {
      year: args.year,
      divisionId: args.divisionId ?? null,
      name: args.name,
    },
  });
  const budget =
    existing ??
    (await prisma.budget.create({
      data: {
        name: args.name,
        year: args.year,
        divisionId: args.divisionId ?? null,
        createdById: args.actor.id,
      },
    }));

  const { rows, warnings } = parseCsv(args.csvText);
  const failures: string[] = [];
  let created = 0;
  let updated = 0;

  for (const [index, row] of rows.entries()) {
    const periodName = pick(row, ["period", "Period"]);
    const account = pick(row, ["account", "Account", "key"]);
    const amount = pickNumber(row, ["amount", "Amount", "value"]);
    const rowNum = index + 2;

    if (!periodName) {
      failures.push(`Row ${rowNum}: period is required`);
      continue;
    }
    if (!account || !VALID_KEYS.has(account.toLowerCase())) {
      failures.push(
        `Row ${rowNum}: account must be one of ${BUDGET_ACCOUNT_KEYS.join(", ")}`,
      );
      continue;
    }
    if (amount == null) {
      failures.push(`Row ${rowNum}: amount must be numeric`);
      continue;
    }
    const period = await prisma.financialPeriod.findUnique({ where: { name: periodName } });
    if (!period) {
      failures.push(`Row ${rowNum}: financial period "${periodName}" not found`);
      continue;
    }

    const existing = await prisma.budgetLine.findUnique({
      where: {
        budgetId_periodId_accountKey: {
          budgetId: budget.id,
          periodId: period.id,
          accountKey: account.toLowerCase(),
        },
      },
    });
    if (existing) {
      await prisma.budgetLine.update({ where: { id: existing.id }, data: { amount } });
      updated++;
    } else {
      await prisma.budgetLine.create({
        data: {
          budgetId: budget.id,
          periodId: period.id,
          accountKey: account.toLowerCase(),
          amount,
        },
      });
      created++;
    }
  }

  const all = [...warnings, ...failures];
  await writeAudit({
    actorUserId: args.actor.id,
    action: "budget.imported",
    entityType: "budget",
    entityId: budget.id,
    afterData: {
      name: args.name,
      year: args.year,
      created,
      updated,
      failed: failures.length,
      rows: rows.length,
    },
  });

  return {
    budgetId: budget.id,
    rowsProcessed: rows.length,
    rowsCreated: created,
    rowsUpdated: updated,
    rowsFailed: failures.length,
    warnings: all,
  };
}

/**
 * Return budget vs actual for a single (period, division) — used by the
 * financials dashboard variance card.
 */
export async function getBudgetVarianceForPeriod(args: {
  budgetId?: string;
  periodId: string;
  divisionId?: string | null;
}): Promise<
  | {
      budgetName: string;
      lines: { accountKey: string; budget: number; actual: number; variance: number }[];
    }
  | null
> {
  const budgetLines = args.budgetId
    ? await prisma.budgetLine.findMany({
        where: { budgetId: args.budgetId, periodId: args.periodId },
        include: { budget: { select: { name: true, divisionId: true } } },
      })
    : await prisma.budgetLine.findMany({
        where: {
          periodId: args.periodId,
          budget: { divisionId: args.divisionId ?? null, isActive: true },
        },
        include: { budget: { select: { name: true, divisionId: true } } },
      });

  if (budgetLines.length === 0) return null;
  const budgetName = budgetLines[0]?.budget.name ?? "Budget";

  const summary = await prisma.financialSummary.findFirst({
    where: { financialPeriodId: args.periodId, divisionId: args.divisionId ?? null },
  });

  const actuals: Record<string, number> = {
    revenue: Number(summary?.revenue ?? 0),
    cogs: Number(summary?.cogs ?? 0),
    gross_profit: Number(summary?.grossProfit ?? 0),
    operating_expenses: Number(summary?.operatingExpenses ?? 0),
    operating_income: Number(summary?.operatingIncome ?? 0),
    ebitda: Number(summary?.ebitda ?? 0),
  };

  const lines = budgetLines.map((bl) => {
    const budgetAmt = Number(bl.amount);
    const actualAmt = actuals[bl.accountKey] ?? 0;
    return {
      accountKey: bl.accountKey,
      budget: budgetAmt,
      actual: actualAmt,
      variance: actualAmt - budgetAmt,
    };
  });

  return { budgetName, lines };
}
