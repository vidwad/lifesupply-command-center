"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  /** The current choices in a few words, shown on the closed control. */
  summary: string;
  children: React.ReactNode;
};

/**
 * Folds a page's secondary filters behind one control on a phone (product
 * owner, 2026-11-04). On the Products page four wrapping rows of pills and
 * inputs filled the whole screen before the table began. From `md` up the
 * children render exactly as before and the control is not shown; below
 * it, the control shows what is applied and opens the rows on tap. State
 * lives in the page, so a navigation to a filtered address re-renders
 * closed with the new summary.
 */
export function PhoneFilterDisclosure({ summary, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-xs md:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="font-medium">Filters</span>
          <span className="block truncate text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <div className={cn("space-y-4", open ? "block" : "hidden md:block")}>{children}</div>
    </>
  );
}
