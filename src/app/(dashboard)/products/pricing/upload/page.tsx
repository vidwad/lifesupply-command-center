import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission } from "@/server/permissions";
import { requireFeature } from "@/server/services/feature-flags";

import { UploadForm } from "../runs/run-forms";

export const metadata = { title: "Upload product list" };
export const dynamic = "force-dynamic";

export default async function PricingUploadPage() {
  await requirePermission(PERMISSIONS.PRICING_CREATE_RUNS);
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const stores = await prisma.store.findMany({
    where: { platform: "bigcommerce" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Upload product list"
        description="Upload a CSV of products to price-check later. This creates a draft list only — no competitor site is contacted and no price is changed."
        breadcrumb={
          <Link href="/products/pricing" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Pricing Intelligence
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload a list</CardTitle>
            <CardDescription>
              Rows are matched to catalogue variants by SKU. Unmatched SKUs and rows without a cost
              are imported and blocked so nothing disappears silently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm stores={stores} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
