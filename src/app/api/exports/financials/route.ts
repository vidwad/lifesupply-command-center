import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_EXPORT);
  const { searchParams } = new URL(req.url);
  const periodId = searchParams.get("period") ?? undefined;
  const divisionId = searchParams.get("division") ?? undefined;

  const summaries = await prisma.financialSummary.findMany({
    where: {
      ...(periodId ? { financialPeriodId: periodId } : {}),
      ...(divisionId ? { divisionId } : {}),
    },
    orderBy: [{ financialPeriod: { startDate: "desc" } }, { division: { name: "asc" } }],
    include: {
      financialPeriod: { select: { name: true, startDate: true, endDate: true, status: true } },
      division: { select: { name: true, code: true } },
    },
    take: 5000,
  });

  const csv = toCsv({
    headers: [
      { key: "period", label: "Period", get: (s) => s.financialPeriod.name },
      { key: "periodStatus", label: "Period Status", get: (s) => s.financialPeriod.status },
      {
        key: "periodStart",
        label: "Period Start",
        get: (s) => s.financialPeriod.startDate.toISOString().slice(0, 10),
      },
      {
        key: "periodEnd",
        label: "Period End",
        get: (s) => s.financialPeriod.endDate.toISOString().slice(0, 10),
      },
      { key: "division", label: "Division", get: (s) => s.division?.name ?? "Consolidated" },
      { key: "divisionCode", label: "Division Code", get: (s) => s.division?.code ?? "" },
      { key: "currency", label: "Currency", get: (s) => s.currency },
      { key: "revenue", label: "Revenue", get: (s) => s.revenue.toString() },
      { key: "cogs", label: "COGS", get: (s) => s.cogs.toString() },
      { key: "grossProfit", label: "Gross Profit", get: (s) => s.grossProfit.toString() },
      {
        key: "grossMargin",
        label: "Gross Margin",
        get: (s) => (s.grossMargin ? s.grossMargin.toString() : ""),
      },
      {
        key: "operatingExpenses",
        label: "Operating Expenses",
        get: (s) => s.operatingExpenses.toString(),
      },
      {
        key: "operatingIncome",
        label: "Operating Income",
        get: (s) => s.operatingIncome.toString(),
      },
      { key: "ebitda", label: "EBITDA", get: (s) => (s.ebitda ? s.ebitda.toString() : "") },
      {
        key: "adjustedEbitda",
        label: "Adjusted EBITDA",
        get: (s) => (s.adjustedEbitda ? s.adjustedEbitda.toString() : ""),
      },
      { key: "cash", label: "Cash", get: (s) => (s.cash ? s.cash.toString() : "") },
      {
        key: "accountsReceivable",
        label: "AR",
        get: (s) => (s.accountsReceivable ? s.accountsReceivable.toString() : ""),
      },
      {
        key: "accountsPayable",
        label: "AP",
        get: (s) => (s.accountsPayable ? s.accountsPayable.toString() : ""),
      },
      {
        key: "workingCapital",
        label: "Working Capital",
        get: (s) => (s.workingCapital ? s.workingCapital.toString() : ""),
      },
      { key: "approvalStatus", label: "Approval", get: (s) => s.approvalStatus },
      { key: "sourceSystem", label: "Source", get: (s) => s.sourceSystem ?? "" },
    ],
    rows: summaries,
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "export.financials.csv",
    entityType: "financial_summary",
    afterData: { rows: summaries.length, periodId, divisionId },
  });

  return csvResponse(`financial-summary-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
