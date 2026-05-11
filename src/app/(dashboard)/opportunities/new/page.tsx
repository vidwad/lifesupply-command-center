import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listAssignableUsers } from "@/server/services/tasks";
import { requirePermission } from "@/server/permissions";

import { OpportunityForm } from "../opportunity-form";

export const metadata = { title: "New opportunity" };

export default async function NewOpportunityPage() {
  await requirePermission(PERMISSIONS.OPPORTUNITIES_UPDATE);
  const ownerOptions = await listAssignableUsers();

  return (
    <div>
      <PageHeader
        title="New opportunity"
        description="Add a strategic opportunity to the pipeline. AcquisitionTarget records can be added later if relevant."
        breadcrumb={
          <Link href="/opportunities" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Opportunities
          </Link>
        }
      />
      <div className="p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Opportunity details</CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunityForm mode="create" ownerOptions={ownerOptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
