import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { getOpportunityById } from "@/server/services/opportunities";
import { listAssignableUsers } from "@/server/services/tasks";
import { requirePermission } from "@/server/permissions";

import { OpportunityForm } from "../../opportunity-form";

export const metadata = { title: "Edit opportunity" };

type Props = { params: Promise<{ id: string }> };

export default async function EditOpportunityPage({ params }: Props) {
  await requirePermission(PERMISSIONS.OPPORTUNITIES_UPDATE);
  const { id } = await params;
  const [opportunity, ownerOptions] = await Promise.all([
    getOpportunityById(id),
    listAssignableUsers(),
  ]);
  if (!opportunity) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit — ${opportunity.title}`}
        breadcrumb={
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> {opportunity.title}
          </Link>
        }
      />
      <div className="p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Opportunity details</CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunityForm
              mode="edit"
              ownerOptions={ownerOptions}
              defaults={{
                id: opportunity.id,
                title: opportunity.title,
                opportunityType: opportunity.opportunityType,
                status: opportunity.status,
                strategicRationale: opportunity.strategicRationale,
                estimatedRevenueImpact: opportunity.estimatedRevenueImpact,
                estimatedMarginImpact: opportunity.estimatedMarginImpact,
                estimatedCost: opportunity.estimatedCost,
                riskRating: opportunity.riskRating,
                priority: opportunity.priority,
                ownerId: opportunity.ownerId,
                nextAction: opportunity.nextAction,
                dueDate: opportunity.dueDate
                  ? opportunity.dueDate.toISOString().slice(0, 10)
                  : null,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
