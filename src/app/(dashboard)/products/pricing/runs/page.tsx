import Link from "next/link";
import { ArrowLeft, ListPlus, Upload } from "lucide-react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { isFeatureOn } from "@/server/services/feature-flags";
import { listPricingRuns } from "@/server/services/pricing/runs";

export const metadata = { title: "Pricing runs" };
export const dynamic = "force-dynamic";

export default async function PricingRunsPage() {
  await requirePermission(PERMISSIONS.PRICING_VIEW);
  // Posture decision (DP-2A): pricing.intelligence gates CREATION and mutation.
  // Existing runs stay readable and exportable on permission alone. Tripping
  // the flag — or the global kill switch — must stop new activity, not hide the
  // blocked-row fix-list an operator may need precisely because it was tripped.
  // Reading a stored run contacts nothing external.
  const enabled = await isFeatureOn(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const runs = await listPricingRuns();

  return (
    <div>
      <PageHeader
        title="Pricing runs"
        description="Draft product lists for future price checking. Building a list selects products and records a cost basis and price floor — no competitor site is contacted and no price is changed in this phase."
        breadcrumb={
          <Link href="/products/pricing" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Pricing Intelligence
          </Link>
        }
        actions={
          enabled ? (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/products/pricing/upload">
                  <Upload /> Upload list
                </Link>
              </Button>
              <Button asChild>
                <Link href="/products/pricing/runs/new">
                  <ListPlus /> New run
                </Link>
              </Button>
            </div>
          ) : null
        }
      />
      <div className="space-y-4 p-6">
        {!enabled ? (
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Pricing Intelligence is off, so no new runs can be built. Existing runs below remain
            readable and exportable. An administrator can enable{" "}
            {FEATURE_FLAGS.PRICING_INTELLIGENCE}.
          </div>
        ) : null}
        {runs.length === 0 ? (
          <EmptyState
            icon={ListPlus}
            title="No pricing runs yet"
            description="Build a list from top products or upload a CSV. Runs stay in draft — nothing is checked or written back in this phase."
          />
        ) : (
          <div className="grid gap-3">
            {runs.map((run) => (
              <Card key={run.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <Link
                      href={`/products/pricing/runs/${run.id}`}
                      className="font-medium hover:underline"
                    >
                      {run.store.name} · {run.sourceType.replaceAll("_", " ")}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {run._count.items} items
                      {run.rankingBasis
                        ? ` · ranked by ${run.rankingBasis.replaceAll("_", " ")}`
                        : ""}
                      {run.lookbackWindow ? ` · ${run.lookbackWindow} lookback` : ""} · batch{" "}
                      {run.dailyBatchSize}/day
                    </p>
                  </div>
                  <Badge variant="outline">{run.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
