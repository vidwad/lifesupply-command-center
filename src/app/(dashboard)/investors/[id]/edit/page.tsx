import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { getInvestorById } from "@/server/services/investors";
import { requirePermission } from "@/server/permissions";

import { InvestorForm } from "../../investor-form";

export const metadata = { title: "Edit investor" };

type Props = { params: Promise<{ id: string }> };

export default async function EditInvestorPage({ params }: Props) {
  await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  const { id } = await params;
  const investor = await getInvestorById(id);
  if (!investor) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit — ${investor.name}`}
        breadcrumb={
          <Link
            href={`/investors/${investor.id}`}
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> {investor.name}
          </Link>
        }
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Investor details</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestorForm
              mode="edit"
              defaults={{
                id: investor.id,
                name: investor.name,
                organization: investor.organization,
                email: investor.email,
                phone: investor.phone,
                investorType: investor.investorType,
                status: investor.status,
                notes: investor.notes,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
