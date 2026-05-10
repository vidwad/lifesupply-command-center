import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));
const numOrNull = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

function deltaPct(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

export type FinancialKpi = {
  current: number;
  previous: number | null;
  deltaPct: number | null;
};

export type FinancialKpiOptional = {
  current: number | null;
  previous: number | null;
  deltaPct: number | null;
};

export type FinancialDashboardSelectors = {
  periods: { id: string; name: string; status: string }[];
  divisions: { id: string; code: string; name: string }[];
};

export type FinancialDashboardData = {
  period: { id: string; name: string; status: string; startDate: string; endDate: string };
  previousPeriod: { id: string; name: string } | null;
  division: { id: string; code: string; name: string };

  revenue: FinancialKpi;
  cogs: FinancialKpi;
  grossProfit: FinancialKpi;
  grossMargin: FinancialKpiOptional; // 0..1
  operatingExpenses: FinancialKpi;
  operatingIncome: FinancialKpi;
  ebitda: FinancialKpiOptional;
  adjustedEbitda: FinancialKpiOptional;
  cash: FinancialKpiOptional;
  accountsReceivable: FinancialKpiOptional;
  accountsPayable: FinancialKpiOptional;
  workingCapital: FinancialKpiOptional;

  approvalStatus: string;
  notes: string | null;
  currency: string;

  trend: {
    period: string;
    revenue: number;
    grossProfit: number;
    operatingIncome: number;
    isCurrent: boolean;
  }[];

  divisionComparison: {
    code: string;
    name: string;
    revenue: number;
    grossProfit: number;
    grossMargin: number | null;
    isSelected: boolean;
  }[];

  monthlyTable: {
    periodName: string;
    periodStatus: string;
    rows: {
      divisionCode: string;
      divisionName: string;
      revenue: number;
      grossProfit: number;
      grossMargin: number | null;
      operatingIncome: number;
    }[];
  }[];

  aiCommentary: {
    id: string;
    output: string;
    createdAt: string;
    modelName: string;
    status: string;
  } | null;
};

// -----------------------------------------------------------------------------

export async function listFinancialSelectors(): Promise<FinancialDashboardSelectors> {
  const [periods, divisions] = await Promise.all([
    prisma.financialPeriod.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.division.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);
  return { periods, divisions };
}

export async function getFinancialDashboardData(args: {
  periodId?: string;
  divisionCode?: string;
}): Promise<FinancialDashboardData | null> {
  // ---- resolve period (default: latest by startDate)
  const period = args.periodId
    ? await prisma.financialPeriod.findUnique({ where: { id: args.periodId } })
    : await prisma.financialPeriod.findFirst({ orderBy: { startDate: "desc" } });
  if (!period) return null;

  // ---- resolve division (default: CONS)
  const divisionCode = args.divisionCode ?? "CONS";
  const division = await prisma.division.findUnique({ where: { code: divisionCode } });
  if (!division) return null;

  // ---- previous period
  const previousPeriod = await prisma.financialPeriod.findFirst({
    where: { startDate: { lt: period.startDate } },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  });

  // ---- current + previous summaries for selected division
  const currentSummary = await prisma.financialSummary.findUnique({
    where: {
      financialPeriodId_divisionId: { financialPeriodId: period.id, divisionId: division.id },
    },
  });
  const previousSummary = previousPeriod
    ? await prisma.financialSummary.findUnique({
        where: {
          financialPeriodId_divisionId: {
            financialPeriodId: previousPeriod.id,
            divisionId: division.id,
          },
        },
      })
    : null;

  if (!currentSummary) {
    // Period exists but no summary for this division — return a sparse shell.
    return {
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
      },
      previousPeriod,
      division: { id: division.id, code: division.code, name: division.name },
      revenue: { current: 0, previous: null, deltaPct: null },
      cogs: { current: 0, previous: null, deltaPct: null },
      grossProfit: { current: 0, previous: null, deltaPct: null },
      grossMargin: { current: null, previous: null, deltaPct: null },
      operatingExpenses: { current: 0, previous: null, deltaPct: null },
      operatingIncome: { current: 0, previous: null, deltaPct: null },
      ebitda: { current: null, previous: null, deltaPct: null },
      adjustedEbitda: { current: null, previous: null, deltaPct: null },
      cash: { current: null, previous: null, deltaPct: null },
      accountsReceivable: { current: null, previous: null, deltaPct: null },
      accountsPayable: { current: null, previous: null, deltaPct: null },
      workingCapital: { current: null, previous: null, deltaPct: null },
      approvalStatus: "not_required",
      notes: null,
      currency: "CAD",
      trend: [],
      divisionComparison: [],
      monthlyTable: [],
      aiCommentary: null,
    };
  }

  // ---- helpers to build KPIs from current/previous
  const kpi = (
    cur: Prisma.Decimal | null,
    prev: Prisma.Decimal | null | undefined,
  ): FinancialKpi => {
    const c = num(cur);
    const p = numOrNull(prev);
    return { current: c, previous: p, deltaPct: deltaPct(c, p) };
  };
  const kpiOpt = (
    cur: Prisma.Decimal | null,
    prev: Prisma.Decimal | null | undefined,
  ): FinancialKpiOptional => {
    const c = numOrNull(cur);
    const p = numOrNull(prev);
    return {
      current: c,
      previous: p,
      deltaPct: c != null && p != null && p !== 0 ? (c - p) / p : null,
    };
  };

  // ---- trend: last 6 periods for selected division (oldest -> newest for chart)
  const trendPeriods = await prisma.financialPeriod.findMany({
    orderBy: { startDate: "desc" },
    take: 6,
    include: {
      summaries: { where: { divisionId: division.id } },
    },
  });
  const trend = trendPeriods.reverse().map((p) => {
    const s = p.summaries[0];
    return {
      period: p.name,
      revenue: num(s?.revenue),
      grossProfit: num(s?.grossProfit),
      operatingIncome: num(s?.operatingIncome),
      isCurrent: p.id === period.id,
    };
  });

  // ---- division comparison for the SELECTED period across operating divisions
  const operatingDivisions = await prisma.division.findMany({
    where: { isActive: true, code: { not: "CONS" } },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  const periodSummaries = await prisma.financialSummary.findMany({
    where: {
      financialPeriodId: period.id,
      divisionId: { in: operatingDivisions.map((d) => d.id) },
    },
  });
  const summaryByDivisionId = new Map(periodSummaries.map((s) => [s.divisionId ?? "", s]));
  const divisionComparison = operatingDivisions.map((d) => {
    const s = summaryByDivisionId.get(d.id);
    return {
      code: d.code,
      name: d.name,
      revenue: num(s?.revenue),
      grossProfit: num(s?.grossProfit),
      grossMargin: numOrNull(s?.grossMargin),
      isSelected: d.id === division.id,
    };
  });

  // ---- monthly table: last 6 periods × operating divisions
  const monthlyPeriods = await prisma.financialPeriod.findMany({
    orderBy: { startDate: "desc" },
    take: 6,
    include: {
      summaries: { where: { divisionId: { in: operatingDivisions.map((d) => d.id) } } },
    },
  });
  const monthlyTable = monthlyPeriods.map((mp) => {
    const summariesByDivId = new Map(mp.summaries.map((s) => [s.divisionId ?? "", s]));
    return {
      periodName: mp.name,
      periodStatus: mp.status,
      rows: operatingDivisions.map((d) => {
        const s = summariesByDivId.get(d.id);
        return {
          divisionCode: d.code,
          divisionName: d.name,
          revenue: num(s?.revenue),
          grossProfit: num(s?.grossProfit),
          grossMargin: numOrNull(s?.grossMargin),
          operatingIncome: num(s?.operatingIncome),
        };
      }),
    };
  });

  // ---- AI commentary
  const commentary = await prisma.aiOutput.findFirst({
    where: { module: "financial_commentary" },
    orderBy: { createdAt: "desc" },
  });

  return {
    period: {
      id: period.id,
      name: period.name,
      status: period.status,
      startDate: period.startDate.toISOString(),
      endDate: period.endDate.toISOString(),
    },
    previousPeriod,
    division: { id: division.id, code: division.code, name: division.name },

    revenue: kpi(currentSummary.revenue, previousSummary?.revenue),
    cogs: kpi(currentSummary.cogs, previousSummary?.cogs),
    grossProfit: kpi(currentSummary.grossProfit, previousSummary?.grossProfit),
    grossMargin: kpiOpt(currentSummary.grossMargin, previousSummary?.grossMargin),
    operatingExpenses: kpi(currentSummary.operatingExpenses, previousSummary?.operatingExpenses),
    operatingIncome: kpi(currentSummary.operatingIncome, previousSummary?.operatingIncome),
    ebitda: kpiOpt(currentSummary.ebitda, previousSummary?.ebitda),
    adjustedEbitda: kpiOpt(currentSummary.adjustedEbitda, previousSummary?.adjustedEbitda),
    cash: kpiOpt(currentSummary.cash, previousSummary?.cash),
    accountsReceivable: kpiOpt(
      currentSummary.accountsReceivable,
      previousSummary?.accountsReceivable,
    ),
    accountsPayable: kpiOpt(currentSummary.accountsPayable, previousSummary?.accountsPayable),
    workingCapital: kpiOpt(currentSummary.workingCapital, previousSummary?.workingCapital),

    approvalStatus: currentSummary.approvalStatus,
    notes: currentSummary.notes,
    currency: currentSummary.currency,

    trend,
    divisionComparison,
    monthlyTable,
    aiCommentary: commentary
      ? {
          id: commentary.id,
          output: commentary.output,
          createdAt: commentary.createdAt.toISOString(),
          modelName: commentary.modelName,
          status: commentary.status,
        }
      : null,
  };
}
