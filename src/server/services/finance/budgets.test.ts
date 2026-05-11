import { describe, expect, it } from "vitest";

import { BUDGET_ACCOUNT_KEYS } from "./budgets";

describe("BUDGET_ACCOUNT_KEYS", () => {
  it("matches the FinancialSummary columns used by getBudgetVarianceForPeriod", () => {
    // These keys are intentionally the same as the actuals lookup in the
    // service — if you change one, change both.
    expect(BUDGET_ACCOUNT_KEYS).toEqual([
      "revenue",
      "cogs",
      "gross_profit",
      "operating_expenses",
      "operating_income",
      "ebitda",
    ]);
  });

  it("uses only lowercase snake_case keys", () => {
    for (const key of BUDGET_ACCOUNT_KEYS) {
      expect(key).toMatch(/^[a-z][a-z_]*$/);
    }
  });
});
