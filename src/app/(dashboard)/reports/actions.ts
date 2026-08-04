"use server";

import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import {
  generateBoardReport,
  generateInvestorLenderPackage,
  generateMonthlyManagementReport,
} from "@/server/services/reports";
import { requirePermission } from "@/server/permissions";

export type GenerateReportState = { error?: string } | undefined;

export async function generateReportAction(
  _prev: GenerateReportState,
  formData: FormData,
): Promise<GenerateReportState> {
  const user = await requirePermission(PERMISSIONS.REPORTS_GENERATE);
  const periodId = String(formData.get("periodId") ?? "");
  const divisionCode = String(formData.get("divisionCode") ?? "CONS");
  const reportType = String(formData.get("reportType") ?? "monthly_management");
  if (!periodId) return { error: "Period is required." };

  let report;
  try {
    if (reportType === "board") {
      report = await generateBoardReport({ periodId, preparedById: user.id });
    } else if (reportType === "investor") {
      report = await generateInvestorLenderPackage({ periodId, preparedById: user.id });
    } else {
      report = await generateMonthlyManagementReport({
        periodId,
        divisionCode,
        preparedById: user.id,
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate report." };
  }

  redirect(`/reports/${report.id}`);
}
