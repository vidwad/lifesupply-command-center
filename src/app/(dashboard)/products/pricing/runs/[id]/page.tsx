import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { getPricingRun } from "@/server/services/pricing/runs";

export const metadata = { title: "Pricing run" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const money = (value: unknown): string => (value == null ? "—" : `$${Number(value).toFixed(2)}`);

export default async function PricingRunPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.PRICING_VIEW);
  const canExport = userHasPermission(user, PERMISSIONS.PRICING_EXPORT);
  const { id } = await params;
  const run = await getPricingRun(id);
  if (!run) notFound();

  const counts = {
    total: run._count.items,
    pending: run.items.filter((item) => item.status === "pending").length,
    blocked: run.items.filter((item) => item.status === "blocked").length,
    missingCost: run.items.filter((item) => item.blockedReason === "missing_cost").length,
  };

  return (
    <div>
      <PageHeader
        title={`${run.store.name} — ${run.sourceType.replaceAll("_", " ")}`}
        description="Draft product list. Nothing here has been price-checked: no competitor site was contacted, no recommendation exists, and no price was written back."
        breadcrumb={
          <Link
            href="/products/pricing/runs"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Pricing runs
          </Link>
        }
        actions={
          canExport ? (
            <Button asChild variant="outline">
              <a href={`/api/exports/pricing/runs/${run.id}`}>
                <Download /> Export CSV
              </a>
            </Button>
          ) : null
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Status", run.status],
            ["Total items", String(counts.total)],
            ["Pending", String(counts.pending)],
            ["Blocked", String(counts.blocked)],
            ["Missing cost", String(counts.missingCost)],
            ["Target count", run.targetCount != null ? String(run.targetCount) : "—"],
            ["Batch / day", String(run.dailyBatchSize)],
            ["Ranking", run.rankingBasis?.replaceAll("_", " ") ?? "—"],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products ({run.items.length} shown)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-right">Regular</th>
                  <th className="px-4 py-2 text-right">Sale</th>
                  <th className="px-4 py-2 text-right">Effective</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                  <th className="px-4 py-2 text-left">Cost source</th>
                  <th className="px-4 py-2 text-right">Floor</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {run.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-2">{item.productName ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{money(item.currentRegularPrice)}</td>
                    <td className="px-4 py-2 text-right">{money(item.currentSalePrice)}</td>
                    <td className="px-4 py-2 text-right">{money(item.currentEffectivePrice)}</td>
                    <td className="px-4 py-2 text-right">{money(item.costPrice)}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {item.costSource ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">{money(item.floorPrice)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={item.status === "blocked" ? "destructive" : "outline"}>
                        {item.status === "blocked"
                          ? (item.blockedReason ?? "blocked").replaceAll("_", " ")
                          : item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
