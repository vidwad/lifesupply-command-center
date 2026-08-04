import { describe, expect, it } from "vitest";

import {
  extractAgingTotal,
  extractBalanceSheet,
  extractPnl,
  findTotal,
  type QboReport,
} from "./report-extractor";

/** Minimal but structurally faithful QBO P&L report. */
const PNL: QboReport = {
  Header: { ReportName: "ProfitAndLoss", Currency: "CAD" },
  Rows: {
    Row: [
      {
        group: "Income",
        Header: { ColData: [{ value: "Income" }] },
        Rows: { Row: [{ ColData: [{ value: "Sales" }, { value: "120,500.25" }] }] },
        Summary: { ColData: [{ value: "Total Income" }, { value: "120,500.25" }] },
      },
      {
        group: "COGS",
        Summary: { ColData: [{ value: "Total Cost of Goods Sold" }, { value: "70,000.00" }] },
      },
      { group: "GrossProfit", ColData: [{ value: "Gross Profit" }, { value: "50,500.25" }] },
      {
        group: "Expenses",
        Summary: { ColData: [{ value: "Total Expenses" }, { value: "30,250.00" }] },
      },
      {
        group: "NetOperatingIncome",
        ColData: [{ value: "Net Operating Income" }, { value: "20,250.25" }],
      },
    ],
  },
};

const BALANCE_SHEET: QboReport = {
  Header: { ReportName: "BalanceSheet" },
  Rows: {
    Row: [
      {
        Header: { ColData: [{ value: "ASSETS" }] },
        Rows: {
          Row: [
            { Summary: { ColData: [{ value: "Total Bank Accounts" }, { value: "45,000.00" }] } },
            {
              Summary: {
                ColData: [{ value: "Total Accounts Receivable (A/R)" }, { value: "18,300.50" }],
              },
            },
          ],
        },
      },
      {
        Header: { ColData: [{ value: "LIABILITIES" }] },
        Rows: {
          Row: [
            {
              Summary: {
                ColData: [{ value: "Total Accounts Payable (A/P)" }, { value: "9,100.00" }],
              },
            },
          ],
        },
      },
    ],
  },
};

describe("findTotal", () => {
  it("matches labels case-insensitively anywhere in the tree", () => {
    expect(findTotal(PNL, ["total income"])).toBe(120500.25);
  });
  it("returns null when no label matches", () => {
    expect(findTotal(PNL, ["Total Nonsense"])).toBeNull();
  });
});

describe("extractPnl", () => {
  it("pulls all five P&L totals", () => {
    expect(extractPnl(PNL)).toEqual({
      revenue: 120500.25,
      cogs: 70000,
      grossProfit: 50500.25,
      operatingExpenses: 30250,
      operatingIncome: 20250.25,
    });
  });

  it("derives gross profit + operating income when rows are absent", () => {
    const partial: QboReport = {
      Rows: {
        Row: [
          { Summary: { ColData: [{ value: "Total Income" }, { value: "100" }] } },
          { Summary: { ColData: [{ value: "Total Cost of Goods Sold" }, { value: "40" }] } },
          { Summary: { ColData: [{ value: "Total Expenses" }, { value: "25" }] } },
        ],
      },
    };
    const pnl = extractPnl(partial);
    expect(pnl.grossProfit).toBe(60);
    expect(pnl.operatingIncome).toBe(35);
  });

  it("returns zeros for an empty report instead of guessing", () => {
    expect(extractPnl({})).toEqual({
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      operatingExpenses: 0,
      operatingIncome: 0,
    });
  });
});

describe("extractBalanceSheet", () => {
  it("pulls cash, A/R, and A/P from nested sections", () => {
    expect(extractBalanceSheet(BALANCE_SHEET)).toEqual({
      cash: 45000,
      accountsReceivable: 18300.5,
      accountsPayable: 9100,
    });
  });

  it("returns nulls (not zeros) for missing sections", () => {
    expect(extractBalanceSheet({})).toEqual({
      cash: null,
      accountsReceivable: null,
      accountsPayable: null,
    });
  });
});

describe("extractAgingTotal", () => {
  it("reads the grand TOTAL row of an aging report", () => {
    const aging: QboReport = {
      Rows: {
        Row: [
          { ColData: [{ value: "Acme Clinic" }, { value: "1,000.00" }] },
          { Summary: { ColData: [{ value: "TOTAL" }, { value: "12,345.67" }] }, type: "Section" },
        ],
      },
    };
    expect(extractAgingTotal(aging)).toBe(12345.67);
  });
});
