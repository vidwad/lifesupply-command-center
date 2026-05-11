"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { Button } from "@/components/ui/button";

type Preset = {
  label: string;
  /** Days back from today, inclusive of today. */
  days: number;
};

const PRESETS: Preset[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12m", days: 365 },
];

type Props = {
  fromParam?: string;
  toParam?: string;
  /** Optional default preset applied if no params are present (label match). */
  defaultPreset?: string;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({
  fromParam = "from",
  toParam = "to",
  defaultPreset,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFrom = searchParams.get(fromParam) ?? "";
  const urlTo = searchParams.get(toParam) ?? "";
  // Local draft so the inputs feel responsive while typing; commit on blur.
  const [from, setFrom] = useState(urlFrom);
  const [to, setTo] = useState(urlTo);

  const apply = (nextFrom: string, nextTo: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextFrom) next.set(fromParam, nextFrom);
    else next.delete(fromParam);
    if (nextTo) next.set(toParam, nextTo);
    else next.delete(toParam);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const applyPreset = (days: number) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    const f = isoDate(start);
    const t = isoDate(today);
    setFrom(f);
    setTo(t);
    apply(f, t);
  };

  const reset = () => {
    setFrom("");
    setTo("");
    apply("", "");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
      <CalendarRange className="ml-1 h-4 w-4 text-muted-foreground" />
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        onBlur={() => apply(from, to)}
        className="h-8 rounded-md border bg-background px-2 text-xs"
        aria-label="Start date"
      />
      <span className="text-xs text-muted-foreground">→</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        onBlur={() => apply(from, to)}
        className="h-8 rounded-md border bg-background px-2 text-xs"
        aria-label="End date"
      />
      <div className="ml-1 flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className={
              "rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-wide " +
              (defaultPreset === p.label && !from && !to
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground")
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      {(from || to) && (
        <Button type="button" size="sm" variant="ghost" onClick={reset}>
          Reset
        </Button>
      )}
    </div>
  );
}
