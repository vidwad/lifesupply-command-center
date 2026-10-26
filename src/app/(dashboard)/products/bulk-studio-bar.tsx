"use client";

/**
 * "Open in Product Studio" for the products list (2026-10-26).
 *
 * The row checkboxes belong to this form through the `form` attribute, so
 * the server-rendered table needs no client wrapper; this component only
 * owns the form, counts what is ticked, and submits. Creation only: the
 * action queues no research or generation, and the copy says so.
 */
import { useActionState, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { bulkCreateProjectsAction } from "./studio/actions";

export const BULK_STUDIO_FORM_ID = "bulk-studio";

export function BulkStudioBar(): React.JSX.Element {
  const [state, action, pending] = useActionState(bulkCreateProjectsAction, undefined);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const recount = () =>
      setCount(
        document.querySelectorAll(`input[type="checkbox"][form="${BULK_STUDIO_FORM_ID}"]:checked`)
          .length,
      );
    recount();
    document.addEventListener("change", recount);
    return () => document.removeEventListener("change", recount);
  }, []);

  return (
    <form id={BULK_STUDIO_FORM_ID} action={action} className="flex flex-wrap items-center gap-3">
      <Button type="submit" size="sm" variant="outline" disabled={pending || count === 0}>
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {count === 0
          ? "Open selected in Product Studio"
          : `Open ${count} selected in Product Studio`}
      </Button>
      <span className="text-xs text-muted-foreground">
        Creates one project per product with the store&apos;s first image as its photograph. No
        research or image generation runs until you start it on each project.
      </span>
      {state?.error ? (
        <p role="alert" className="basis-full text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
