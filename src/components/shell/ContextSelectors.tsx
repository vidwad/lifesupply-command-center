"use client";

import { CalendarDays, Layers } from "lucide-react";

import { type ContextOption, useContextParams } from "./context-params";

type Props = {
  divisions: ContextOption[];
  periods: ContextOption[];
};

const selectClass =
  "h-9 appearance-none rounded-md border border-input bg-background pl-7 pr-7 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The top bar's division and period selectors, shown from `lg` up. Native
 * selects suit a pointer; the navigation drawer below `lg` uses
 * ContextOptionLists instead, because a native select inside the modal
 * drawer did not reliably open on a phone's first touch (2026-10-29).
 */
export function ContextSelectors({ divisions, periods }: Props) {
  const { selectedDivision, selectedPeriod, setDivision, setPeriod } = useContextParams();

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <div className="relative">
        <Layers className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <select
          aria-label="Division"
          value={selectedDivision}
          onChange={(e) => setDivision(e.target.value)}
          className={selectClass}
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
          onChange={(e) => setPeriod(e.target.value)}
          className={selectClass}
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
