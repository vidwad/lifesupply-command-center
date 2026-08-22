/**
 * DP-4 recommendation queue.
 *
 * A review list, not a control surface: there is no approve or reject control
 * anywhere on this page because approval does not exist until DP-5. Readable
 * on pricing.view so a manager can see what is proposed without holding the
 * permission that generates rows.
 */
import Link from "next/link";
import { Download } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { listRecommendations } from "@/server/services/pricing/recommendations";

export const metadata = { title: "Price recommendations" };
export const dynamic = "force-dynamic";

const money = (value: unknown): string => (value == null ? "—" : `$${Number(value).toFixed(2)}`);
const percent = (value: unknown): string =>
  value == null ? "—" : `${(Number(value) * 100).toFixed(1)}%`;

function hoursSince(date: Date | null): string {
  if (date == null) return "—";
  const hours = (Date.now() - date.getTime()) / (60 * 60 * 1000);
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function typeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  if (type === "reduce") return "destructive";
  if (type === "increase") return "default";
  if (type === "no_change") return "secondary";
  return "outline";
}

export default async function RecommendationsPage(): Promise<React.JSX.Element> {
  const user = await requirePermission(PERMISSIONS.PRICING_VIEW);
  const canExport = userHasPermission(user, PERMISSIONS.PRICING_EXPORT);
  const rows = await listRecommendations();

  return (
    <div>
      <PageHeader
        title="Price recommendations"
        description="Proposals awaiting human review. No recommendation has been approved. No price has been changed. Approval and writeback are later phases. Generating a recommendation creates a queue row only — it does not approve, reject, or write back to BigCommerce."
        actions={
          canExport ? (
            <Button asChild variant="outline">
              <a href="/api/exports/pricing/recommendations">
                <Download /> Export CSV
              </a>
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Queue</CardTitle>
          <CardDescription>
            {rows.length === 0
              ? "No recommendations yet. Open a pricing run that has competitor observations and generate recommendations from it."
              : `${rows.length} recommendation(s), newest first. Every row requires approval.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? null : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Store</th>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3 text-right">Current</th>
                    <th className="py-2 pr-3 text-right">Cost</th>
                    <th className="py-2 pr-3 text-right">Floor</th>
                    <th className="py-2 pr-3 text-right">Lowest comp.</th>
                    <th className="py-2 pr-3 text-right">Recommended</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3 text-right">Margin before</th>
                    <th className="py-2 pr-3 text-right">Margin after</th>
                    <th className="py-2 pr-3 text-right">Confidence</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Evidence age</th>
                    <th className="py-2 pr-3">Run</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const item = row.pricingRunItem;
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{item.store.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs">
                          <Link
                            href={`/products/pricing/recommendations/${row.id}`}
                            className="hover:underline"
                          >
                            {item.sku}
                          </Link>
                        </td>
                        <td className="max-w-[18rem] truncate py-2 pr-3">
                          {item.productName ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {money(item.currentEffectivePrice)}
                        </td>
                        <td className="py-2 pr-3 text-right">{money(row.costPrice)}</td>
                        <td className="py-2 pr-3 text-right">{money(row.floorPrice)}</td>
                        <td className="py-2 pr-3 text-right">{money(row.lowestCompetitorPrice)}</td>
                        <td className="py-2 pr-3 text-right font-medium">
                          {money(row.recommendedSalePrice)}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={typeVariant(row.recommendationType)}>
                            {row.recommendationType.replaceAll("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 text-right">{percent(row.marginBefore)}</td>
                        <td className="py-2 pr-3 text-right">{percent(row.marginAfter)}</td>
                        <td className="py-2 pr-3 text-right">
                          {row.lowestCompetitorPrice == null
                            ? "—"
                            : percent(Number(item.confidence ?? 0))}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline">{row.status.replaceAll("_", " ")}</Badge>
                        </td>
                        <td className="py-2 pr-3">{hoursSince(item.lastCheckedAt)}</td>
                        <td className="py-2 pr-3">
                          <Link
                            href={`/products/pricing/runs/${item.pricingRun.id}`}
                            className="text-xs hover:underline"
                          >
                            {item.pricingRun.sourceType.replaceAll("_", " ")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
