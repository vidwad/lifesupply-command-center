/**
 * QuickBooks Online → FinancialSummary read sync (Phase 6 — docs/19).
 *
 * For each of the last N monthly periods (auto-created as "YYYY-MM" when
 * absent, matching the CSV import's period naming):
 *   - ProfitAndLoss for the month → revenue / cogs / gross profit / opex /
 *     operating income
 *   - BalanceSheet as of month end → cash, A/R, A/P (+ working capital)
 *   - AgedReceivables / AgedPayables as of month end → fallback A/R / A/P
 *     totals when the balance sheet omits them
 *
 * Writes the same consolidated (divisionId null) FinancialSummary rows the
 * CSV import writes — sourceSystem "quickbooks", sourceImportId = sync log —
 * so imported data stays traceable to its source period and run. Existing
 * summaries keep their approvalStatus (financials still go through review).
 * Per-division class mapping remains on the CSV path (follow-up).
 */
import { prisma } from "@/server/db/client";

import { fetchQboReport, type QboSession } from "./client";
import {
  extractAgingTotal,
  extractBalanceSheet,
  extractPnl,
  type QboReport,
} from "./report-extractor";

export type SyncQboInput = {
  session: QboSession;
  /** How many monthly periods to sync, ending with the current month. */
  months?: number;
  /** Sync log id recorded onto each summary as sourceImportId. */
  syncLogId: string;
};

export type SyncQboCounts = {
  periodsSynced: number;
  summariesCreated: number;
  summariesUpdated: number;
  periodsFailed: number;
  errorMessages: string[];
};

const SOURCE_SYSTEM = "quickbooks";

function monthWindow(offset: number): { name: string; start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  const name = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
  return { name, start, end };
}

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

export async function syncQuickBooksReports(input: SyncQboInput): Promise<SyncQboCounts> {
  const counts: SyncQboCounts = {
    periodsSynced: 0,
    summariesCreated: 0,
    summariesUpdated: 0,
    periodsFailed: 0,
    errorMessages: [],
  };

  const months = Math.min(Math.max(input.months ?? 2, 1), 12);

  for (let offset = months - 1; offset >= 0; offset--) {
    const window = monthWindow(offset);
    try {
      const period = await prisma.financialPeriod.upsert({
        where: { name: window.name },
        create: {
          name: window.name,
          periodType: "month",
          startDate: window.start,
          endDate: window.end,
        },
        update: {},
      });

      const dateParams = {
        start_date: isoDate(window.start),
        end_date: isoDate(window.end),
      };
      const [pnlRaw, bsRaw, arRaw, apRaw] = await Promise.all([
        fetchQboReport(input.session, "ProfitAndLoss", dateParams),
        fetchQboReport(input.session, "BalanceSheet", dateParams),
        fetchQboReport(input.session, "AgedReceivables", { end_date: dateParams.end_date }),
        fetchQboReport(input.session, "AgedPayables", { end_date: dateParams.end_date }),
      ]);

      const pnl = extractPnl(pnlRaw as QboReport);
      const bs = extractBalanceSheet(bsRaw as QboReport);
      const accountsReceivable = bs.accountsReceivable ?? extractAgingTotal(arRaw as QboReport);
      const accountsPayable = bs.accountsPayable ?? extractAgingTotal(apRaw as QboReport);
      const workingCapital =
        accountsReceivable != null && accountsPayable != null && bs.cash != null
          ? bs.cash + accountsReceivable - accountsPayable
          : null;
      const currency =
        (pnlRaw as QboReport).Header?.Currency?.toString().slice(0, 3).toUpperCase() || "CAD";

      const data = {
        financialPeriodId: period.id,
        divisionId: null,
        revenue: pnl.revenue,
        cogs: pnl.cogs,
        grossProfit: pnl.grossProfit,
        grossMargin: pnl.revenue > 0 ? pnl.grossProfit / pnl.revenue : null,
        operatingExpenses: pnl.operatingExpenses,
        operatingIncome: pnl.operatingIncome,
        cash: bs.cash,
        accountsReceivable,
        accountsPayable,
        workingCapital,
        currency,
        sourceSystem: SOURCE_SYSTEM,
        sourceImportId: input.syncLogId,
      };

      const existing = await prisma.financialSummary.findFirst({
        where: { financialPeriodId: period.id, divisionId: null },
      });
      if (existing) {
        // approvalStatus intentionally untouched — API refresh doesn't
        // re-approve a reviewed period.
        await prisma.financialSummary.update({ where: { id: existing.id }, data });
        counts.summariesUpdated++;
      } else {
        await prisma.financialSummary.create({ data });
        counts.summariesCreated++;
      }
      counts.periodsSynced++;
    } catch (err) {
      counts.periodsFailed++;
      const msg = err instanceof Error ? err.message : "unknown error";
      counts.errorMessages.push(`${window.name}: ${msg}`);
    }
  }

  return counts;
}
