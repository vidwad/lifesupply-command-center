import { Gauge } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  data: {
    openOrders: number;
    exceptionOrders: number;
    awaitingSupplier: number;
    awaitingHumanReview: number;
    completedThisPeriod: number;
    cancelledThisPeriod: number;
  };
};

export function OperationsSummary({ data }: Props) {
  const rows = [
    { label: "Open orders", value: data.openOrders, tone: "default" as const },
    { label: "Awaiting supplier", value: data.awaitingSupplier, tone: "warning" as const },
    { label: "Awaiting human review", value: data.awaitingHumanReview, tone: "warning" as const },
    { label: "Flagged exceptions", value: data.exceptionOrders, tone: "destructive" as const },
    { label: "Completed (period)", value: data.completedThisPeriod, tone: "success" as const },
    { label: "Cancelled / refunded", value: data.cancelledThisPeriod, tone: "muted" as const },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4" /> Operations snapshot
        </CardTitle>
        <CardDescription className="text-xs">Live order counts</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <dl className="divide-y">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-2 first:pt-0">
              <dt className="text-sm text-muted-foreground">{r.label}</dt>
              <dd
                className={
                  r.tone === "destructive" && r.value > 0
                    ? "text-base font-semibold tabular-nums text-destructive"
                    : r.tone === "warning" && r.value > 0
                      ? "text-base font-semibold tabular-nums text-warning"
                      : r.tone === "success"
                        ? "text-base font-semibold tabular-nums text-success"
                        : "text-base font-semibold tabular-nums"
                }
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
