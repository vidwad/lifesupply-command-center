"use client";

/**
 * Selection bar for the Product Studio list (2026-10-26): the project
 * checkboxes belong to this form through the `form` attribute, so the
 * server-rendered cards and rows need no client wrapper. Submitting opens
 * the summary PDF for the selected projects in a new tab; a plain GET, no
 * server action, nothing written.
 *
 * For a Super Admin the bar also offers "Run unattended" (2026-10-27): the
 * same selection, sent by a second submit button to the run form in the
 * Automation Center, where the criteria are set and the run is started.
 * This button too is a GET; nothing starts until that form is submitted.
 */
import { useEffect, useState } from "react";
import { Bot, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

export const STUDIO_REPORT_FORM_ID = "studio-report";

export function ReportBar({
  total,
  canAutopilot = false,
}: {
  total: number;
  canAutopilot?: boolean;
}): React.JSX.Element {
  const [count, setCount] = useState(0);

  const boxes = () =>
    Array.from(
      document.querySelectorAll<HTMLInputElement>(
        `input[type="checkbox"][form="${STUDIO_REPORT_FORM_ID}"]`,
      ),
    );

  useEffect(() => {
    const recount = () => setCount(boxes().filter((box) => box.checked).length);
    recount();
    document.addEventListener("change", recount);
    return () => document.removeEventListener("change", recount);
  }, []);

  const setAll = (checked: boolean) => {
    for (const box of boxes()) box.checked = checked;
    setCount(checked ? boxes().length : 0);
  };

  return (
    <form
      id={STUDIO_REPORT_FORM_ID}
      method="GET"
      action="/api/product-studio/report"
      target="_blank"
      className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-3"
    >
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={total > 0 && count === total}
          onChange={(event) => setAll(event.target.checked)}
          aria-label="Select all projects shown"
        />
        Select all shown
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={count === 0}>
        <FileText />
        {count === 0 ? "Summary report (PDF)" : `Summary report for ${count} selected (PDF)`}
      </Button>
      {canAutopilot ? (
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={count === 0}
          formAction="/automation/product-studio/new"
          formTarget="_self"
          title="Set the criteria, then the worker researches, generates and reviews each selected project with no further input. Super Admin only."
        >
          <Bot />
          {count === 0 ? "Run unattended" : `Run ${count} selected unattended`}
        </Button>
      ) : null}
      <span className="text-xs text-muted-foreground">
        {canAutopilot
          ? "The report is one page per project. An unattended run opens a form for the criteria first; nothing starts from this page."
          : "One page per project: identity, listing copy, market range, compositions with review and publishing status, warnings and sources. Up to fifty projects."}
      </span>
    </form>
  );
}
