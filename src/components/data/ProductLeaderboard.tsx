import { Boxes, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatCurrency, formatPercent } from "@/lib/format";

type ProductRow =
  | { id: string; name: string; sku: string | null; revenue: number; quantity: number }
  | { id: string; name: string; sku: string | null; revenue: number; marginPct: number };

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  products: ProductRow[];
  /** Show "qty" or "margin" as the secondary metric. */
  secondaryMetric: "quantity" | "margin";
};

export function ProductLeaderboard({
  title,
  description,
  icon: Icon = Boxes,
  products,
  secondaryMetric,
}: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {products.length === 0 ? (
          <EmptyState
            icon={Icon}
            title="No data yet"
            description="Once orders are imported, the top performers will appear here."
            className="border-0 bg-transparent"
          />
        ) : (
          <ol className="divide-y">
            {products.map((p, idx) => {
              const secondary =
                secondaryMetric === "quantity" && "quantity" in p
                  ? `${p.quantity} units`
                  : "marginPct" in p
                    ? `${formatPercent(p.marginPct, 1)} margin`
                    : "";
              return (
                <li key={p.id} className="flex items-center gap-3 py-2 first:pt-0">
                  <span className="w-5 text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku ?? "—"} • {secondary}
                    </p>
                  </div>
                  <div className="text-right text-sm font-medium tabular-nums">
                    {formatCurrency(p.revenue)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
