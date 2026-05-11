import { type Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { buildXlsxWorkbook, xlsxResponse } from "@/server/services/exports/xlsx";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const D = (d: Prisma.Decimal | null | undefined) => (d == null ? null : Number(d));

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

  const buffer = await buildXlsxWorkbook({
    sheetName: "Financial Summary",
    columns: [
      { header: "Period", key: "period", width: 14, get: (s) => s.financialPeriod.name },
      { header: "Period Status", key: "periodStatus", width: 12, get: (s) => s.financialPeriod.status },
      {
        header: "Period Start",
        key: "periodStart",
        width: 12,
        get: (s) => s.financialPeriod.startDate,
      },
      {
        header: "Period End",
        key: "periodEnd",
        width: 12,
        get: (s) => s.financialPeriod.endDate,
      },
      {
        header: "Division",
        key: "division",
        width: 20,
        get: (s) => s.division?.name ?? "Consolidated",
      },
      { header: "Division Code", key: "divisionCode", width: 12, get: (s) => s.division?.code ?? "" },
      { header: "Currency", key: "currency", width: 10, get: (s) => s.currency },
      { header: "Revenue", key: "revenue", width: 16, numFmt: "$#,##0.00", get: (s) => D(s.revenue) },
      { header: "COGS", key: "cogs", width: 16, numFmt: "$#,##0.00", get: (s) => D(s.cogs) },
      { header: "Gross Profit", key: "grossProfit", width: 16, numFmt: "$#,##0.00", get: (s) => D(s.grossProfit) },
      { header: "Gross Margin", key: "grossMargin", width: 14, numFmt: "0.0%", get: (s) => D(s.grossMargin) },
      { header: "Operating Expenses", key: "opex", width: 18, numFmt: "$#,##0.00", get: (s) => D(s.operatingExpenses) },
      { header: "Operating Income", key: "opIncome", width: 18, numFmt: "$#,##0.00", get: (s) => D(s.operatingIncome) },
      { header: "EBITDA", key: "ebitda", width: 16, numFmt: "$#,##0.00", get: (s) => D(s.ebitda) },
      { header: "Adjusted EBITDA", key: "adjEbitda", width: 18, numFmt: "$#,##0.00", get: (s) => D(s.adjustedEbitda) },
      { header: "Cash", key: "cash", width: 16, numFmt: "$#,##0.00", get: (s) => D(s.cash) },
      { header: "AR", key: "ar", width: 16, numFmt: "$#,##0.00", get: (s) => D(s.accountsReceivable) },
      { header: "AP", key: "ap", width: 16, numFmt: "$#,##0.00", get: (s) => D(s.accountsPayable) },
      { header: "Working Capital", key: "wc", width: 18, numFmt: "$#,##0.00", get: (s) => D(s.workingCapital) },
      { header: "Approval Status", key: "approval", width: 14, get: (s) => s.approvalStatus },
      { header: "Source System", key: "source", width: 14, get: (s) => s.sourceSystem ?? "" },
    ],
    rows: summaries,
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "export.financials.xlsx",
    entityType: "financial_summary",
    afterData: { rows: summaries.length, periodId, divisionId, bytes: buffer.length },
  });

  return xlsxResponse(
    `financial-summary-${new Date().toISOString().slice(0, 10)}.xlsx`,
    buffer,
  );
}
