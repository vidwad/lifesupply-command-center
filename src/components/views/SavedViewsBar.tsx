/**
 * Saved views bar (Phase 8). Server component: renders the user's saved
 * views for a queue page as plain links, plus a save-current-filters form.
 * Views are per-user; applying one is just navigation.
 */
import Link from "next/link";
import { X } from "lucide-react";

import { listSavedViews, type SavedViewPage, viewHref } from "@/server/services/saved-views";

import { deleteViewAction, saveViewAction } from "./saved-view-actions";

export async function SavedViewsBar({
  userId,
  page,
  currentParams,
}: {
  userId: string;
  page: SavedViewPage;
  /** The page's current (already validated) filter params. */
  currentParams: Record<string, string | undefined>;
}) {
  const views = await listSavedViews(userId, page);
  const definedParams = Object.fromEntries(
    Object.entries(currentParams).filter(([, v]) => typeof v === "string" && v !== ""),
  ) as Record<string, string>;
  const hasFilters = Object.keys(definedParams).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium uppercase tracking-wide text-muted-foreground">Saved views</span>
      {views.length === 0 && (
        <span className="text-muted-foreground">none yet — filter the queue, then save it</span>
      )}
      {views.map((v) => (
        <span
          key={v.id}
          className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1"
        >
          <Link href={viewHref(v)} className="font-medium hover:underline">
            {v.name}
          </Link>
          <form action={deleteViewAction} className="inline-flex">
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="page" value={page} />
            <button
              type="submit"
              aria-label={`Delete saved view ${v.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </form>
        </span>
      ))}
      <form action={saveViewAction} className="ml-auto flex items-center gap-1">
        <input type="hidden" name="page" value={page} />
        <input type="hidden" name="params" value={JSON.stringify(definedParams)} />
        <input
          type="text"
          name="name"
          required
          maxLength={60}
          placeholder={hasFilters ? "Save current filters as…" : "Save default view as…"}
          className="h-7 w-44 rounded-md border bg-background px-2"
        />
        <button type="submit" className="h-7 rounded-md border px-2 font-medium hover:bg-accent">
          Save
        </button>
      </form>
    </div>
  );
}
