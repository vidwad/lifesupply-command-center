import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";

type Exception = {
  id: string;
  orderNumber: string;
  storeName: string;
  customerLabel: string;
  grandTotal: number;
  exceptionStatus: string;
  exceptionReason: string | null;
  orderDate: string;
};

type Props = { exceptions: Exception[] };

export function ExceptionList({ exceptions }: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning" /> Supplier & order exceptions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {exceptions.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No active exceptions"
            description="When orders need management attention, they'll be flagged here."
            className="border-0 bg-transparent"
          />
        ) : (
          <ul className="divide-y">
            {exceptions.map((e) => (
              <li key={e.id} className="flex flex-col gap-1 py-3 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{e.orderNumber}</span>
                    <Badge variant="warning" className="text-[10px]">
                      {e.exceptionStatus.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(e.grandTotal)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {e.storeName} • {e.customerLabel} • {formatDate(e.orderDate)}
                </p>
                {e.exceptionReason && (
                  <p className="text-xs leading-relaxed text-muted-foreground/90">
                    {e.exceptionReason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
