import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listFinancialSelectors } from "@/server/services/financials";
import { requirePermission } from "@/server/permissions";

import { GenerateReportForm } from "./generate-report-form";

export const metadata = { title: "Generate report" };
export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  await requirePermission(PERMISSIONS.REPORTS_GENERATE);
  const selectors = await listFinancialSelectors();

  return (
    <div>
      <PageHeader
        title="Generate Monthly Management Report"
        description="Pulls live financial, operating, marketing, and task data for the selected period × division."
        breadcrumb={
          <Link href="/reports" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Reports
          </Link>
        }
      />
      <div className="p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Source data</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerateReportForm periods={selectors.periods} divisions={selectors.divisions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
