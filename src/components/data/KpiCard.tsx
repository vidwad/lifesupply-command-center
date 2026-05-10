import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  /** Sub-line shown directly under the value, e.g. "MTD" or "vs. April". */
  caption?: string;
  /** Decimal change vs prior period (e.g. 0.052 for +5.2%). */
  deltaPct?: number | null;
  /** Direction in which "up" is good. Defaults to "up_is_good". */
  deltaPolarity?: "up_is_good" | "down_is_good" | "neutral";
  icon?: LucideIcon;
  /** Tone overrides the value text colour, e.g. red for warnings. */
  tone?: "default" | "success" | "warning" | "destructive";
};

const TONE_CLASS: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function KpiCard({
  label,
  value,
  caption,
  deltaPct,
  deltaPolarity = "up_is_good",
  icon: Icon,
  tone = "default",
}: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className={cn("text-2xl font-semibold tracking-tight", TONE_CLASS[tone])}>{value}</div>
        <div className="flex items-center justify-between gap-2 text-xs">
          {caption ? (
            <span className="text-muted-foreground">{caption}</span>
          ) : (
            <span className="text-muted-foreground">&nbsp;</span>
          )}
          <DeltaBadge deltaPct={deltaPct} polarity={deltaPolarity} />
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaBadge({
  deltaPct,
  polarity,
}: {
  deltaPct: Props["deltaPct"];
  polarity: NonNullable<Props["deltaPolarity"]>;
}) {
  if (deltaPct == null) return <span className="text-muted-foreground">—</span>;

  const pct = Math.abs(deltaPct) * 100;
  const isPositive = deltaPct > 0;
  const isZero = Math.abs(deltaPct) < 0.0005;

  let tone: "success" | "destructive" | "muted" = "muted";
  if (!isZero && polarity !== "neutral") {
    const goodDirectionUp = polarity === "up_is_good";
    const isGood = goodDirectionUp ? isPositive : !isPositive;
    tone = isGood ? "success" : "destructive";
  }

  const Icon = isZero ? Minus : isPositive ? ArrowUp : ArrowDown;
  const color =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", color)}>
      <Icon className="h-3 w-3" />
      {pct.toFixed(1)}%
    </span>
  );
}
