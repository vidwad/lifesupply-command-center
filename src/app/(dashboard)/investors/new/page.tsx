import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

import { InvestorForm } from "../investor-form";

export const metadata = { title: "New investor" };

export default async function NewInvestorPage() {
  await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  return (
    <div>
      <PageHeader
        title="New investor"
        description="Add a new investor or lender contact to the pipeline."
        breadcrumb={
          <Link href="/investors" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Investors
          </Link>
        }
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Investor details</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestorForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
