/**
 * Pure extractors for QuickBooks Online report JSON (Phase 6 — docs/19).
 *
 * QBO reports arrive as a tree of Rows with ColData/Summary cells. These
 * helpers walk the tree and pull the totals the Command Center's
 * FinancialSummary model needs. READ-ONLY interpretation — no mutation of
 * accounting data, ever.
 *
 * Row labels differ slightly across locales/company files, so each total is
 * matched against a list of known labels (first match wins) and missing rows
 * resolve to null rather than guessing.
 */

export type QboReport = {
  Header?: { ReportName?: string; StartPeriod?: string; EndPeriod?: string; Currency?: string };
  Rows?: { Row?: QboRow[] };
};

export type QboRow = {
  group?: string;
  type?: string;
  Header?: { ColData?: QboCol[] };
  Summary?: { ColData?: QboCol[] };
  ColData?: QboCol[];
  Rows?: { Row?: QboRow[] };
};

export type QboCol = { value?: string };

function parseAmount(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Depth-first walk of every row in the report. */
function* walkRows(report: QboReport): Generator<QboRow> {
  const stack = [...(report.Rows?.Row ?? [])];
  while (stack.length > 0) {
    const row = stack.shift()!;
    yield row;
    if (row.Rows?.Row) stack.unshift(...row.Rows.Row);
  }
}

/** Label of a row: first cell of Summary, else of ColData/Header. */
function rowLabel(row: QboRow): string {
  return (
    row.Summary?.ColData?.[0]?.value ??
    row.ColData?.[0]?.value ??
    row.Header?.ColData?.[0]?.value ??
    ""
  ).trim();
}

/** Last numeric cell of a row (QBO totals sit in the final column). */
function rowAmount(row: QboRow): number | null {
  const cells = row.Summary?.ColData ?? row.ColData ?? [];
  for (let i = cells.length - 1; i >= 0; i--) {
    const n = parseAmount(cells[i]?.value);
    if (n != null) return n;
  }
  return null;
}

/** Find the first row whose label matches any of the given names. */
export function findTotal(report: QboReport, labels: string[]): number | null {
  const wanted = labels.map((l) => l.toLowerCase());
  for (const row of walkRows(report)) {
    const label = rowLabel(row).toLowerCase();
    if (wanted.includes(label)) {
      const amount = rowAmount(row);
      if (amount != null) return amount;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Report-specific extractors
// ---------------------------------------------------------------------------

export type PnlTotals = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
};

export function extractPnl(report: QboReport): PnlTotals {
  const revenue = findTotal(report, ["Total Income", "Total Revenue"]) ?? 0;
  const cogs = findTotal(report, ["Total Cost of Goods Sold", "Total COGS"]) ?? 0;
  const grossProfit = findTotal(report, ["Gross Profit"]) ?? revenue - cogs;
  const operatingExpenses = findTotal(report, ["Total Expenses", "Total Operating Expenses"]) ?? 0;
  const operatingIncome =
    findTotal(report, ["Net Operating Income", "Net Income"]) ?? grossProfit - operatingExpenses;
  return { revenue, cogs, grossProfit, operatingExpenses, operatingIncome };
}

export type BalanceSheetTotals = {
  cash: number | null;
  accountsReceivable: number | null;
  accountsPayable: number | null;
};

export function extractBalanceSheet(report: QboReport): BalanceSheetTotals {
  return {
    cash: findTotal(report, ["Total Bank Accounts", "Total Cash and Cash Equivalents"]),
    accountsReceivable: findTotal(report, [
      "Total Accounts Receivable",
      "Total Accounts Receivable (A/R)",
    ]),
    accountsPayable: findTotal(report, ["Total Accounts Payable", "Total Accounts Payable (A/P)"]),
  };
}

/** Aged receivables/payables reports: the grand TOTAL row. */
export function extractAgingTotal(report: QboReport): number | null {
  return findTotal(report, ["TOTAL", "Total"]);
}
