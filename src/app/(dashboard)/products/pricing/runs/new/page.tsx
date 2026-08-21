import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission } from "@/server/permissions";
import { requireFeature } from "@/server/services/feature-flags";
import { resolveDailyBatchSize } from "@/server/services/pricing/runs";

import { TopProductsForm } from "../run-forms";

export const metadata = { title: "New pricing run" };
export const dynamic = "force-dynamic";

export default async function NewPricingRunPage() {
  await requirePermission(PERMISSIONS.PRICING_CREATE_RUNS);
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const stores = await prisma.store.findMany({
    where: { platform: "bigcommerce" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const defaultBatchSize = stores[0] ? await resolveDailyBatchSize(stores[0].id) : 300;

  return (
    <div>
      <PageHeader
        title="New pricing run"
        description="Select top products from synced order history. This creates a draft list only — no competitor site is contacted and no price is changed."
        breadcrumb={
          <Link
            href="/products/pricing/runs"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Pricing runs
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>
              Ranked from `OrderItem` history already synced into the Command Center. Grouped by
              variant where available, then product, then SKU.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsForm stores={stores} defaultBatchSize={defaultBatchSize} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
