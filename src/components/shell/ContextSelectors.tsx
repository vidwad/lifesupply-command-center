"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Layers } from "lucide-react";

type Option = { value: string; label: string };

type Props = {
  divisions: Option[];
  periods: Option[];
};

const PERIOD_PARAM = "period";
const DIVISION_PARAM = "division";

export function ContextSelectors({ divisions, periods }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const selectedPeriod = searchParams.get(PERIOD_PARAM) ?? "";
  const selectedDivision = searchParams.get(DIVISION_PARAM) ?? "";

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <div className="relative">
        <Layers className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <select
          aria-label="Division"
          value={selectedDivision}
          onChange={(e) => updateParam(DIVISION_PARAM, e.target.value)}
          className="h-9 appearance-none rounded-md border border-input bg-background pl-7 pr-7 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All divisions</option>
          {divisions.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <select
          aria-label="Period"
          value={selectedPeriod}
          onChange={(e) => updateParam(PERIOD_PARAM, e.target.value)}
          className="h-9 appearance-none rounded-md border border-input bg-background pl-7 pr-7 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Open period</option>
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
