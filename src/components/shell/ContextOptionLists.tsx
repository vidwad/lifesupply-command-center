"use client";

import { useId, useState } from "react";
import { CalendarDays, Check, ChevronDown, Layers, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { type ContextOption, useContextParams } from "./context-params";

type Props = {
  divisions: ContextOption[];
  periods: ContextOption[];
};

/**
 * The division and period selectors as plain buttons, for the navigation
 * drawer (product owner, 2026-10-29: the drawer's "All divisions" control
 * did not always open on the first touch). A native select inside the
 * modal drawer opens an operating-system picker, which depends on the
 * dialog's focus trap and scroll lock and on how the phone's browser treats
 * a tap on it. These lists are ordinary buttons rendered in the drawer, so
 * a touch is a touch. No hover styles either: a phone browser can spend a
 * first tap on hover.
 */
export function ContextOptionLists({ divisions, periods }: Props) {
  const { selectedDivision, selectedPeriod, setDivision, setPeriod } = useContextParams();
  return (
    <div className="flex flex-col gap-2">
      <OptionList
        icon={Layers}
        label="Division"
        emptyLabel="All divisions"
        options={divisions}
        selected={selectedDivision}
        onSelect={setDivision}
      />
      <OptionList
        icon={CalendarDays}
        label="Period"
        emptyLabel="Open period"
        options={periods}
        selected={selectedPeriod}
        onSelect={setPeriod}
      />
    </div>
  );
}

function OptionList({
  icon: Icon,
  label,
  emptyLabel,
  options,
  selected,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  /** The label of the empty value, which is the default. */
  emptyLabel: string;
  options: ContextOption[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const all: ContextOption[] = [{ value: "", label: emptyLabel }, ...options];
  // An address naming a value no longer offered reads as the default.
  const current = all.find((option) => option.value === selected) ?? all[0]!;

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent"
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="truncate text-xs font-medium text-foreground">{current.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {expanded ? (
        <div
          id={listId}
          role="radiogroup"
          aria-label={label}
          className="mt-1 flex flex-col gap-0.5 rounded-md border bg-background p-1"
        >
          {all.map((option) => {
            const active = option.value === current.value;
            return (
              <button
                key={option.value || "__default"}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  onSelect(option.value);
                  setExpanded(false);
                }}
                className={cn(
                  "flex min-h-10 w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent",
                  active ? "bg-accent font-medium" : "text-foreground",
                )}
              >
                <span className="truncate">{option.label}</span>
                {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
