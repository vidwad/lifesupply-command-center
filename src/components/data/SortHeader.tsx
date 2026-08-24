/**
 * Sortable column header — a plain link, so it works in server components and
 * survives a refresh, a bookmark, or a shared URL.
 *
 * Only use this on columns the query can genuinely order by. Reordering the
 * rows already fetched would present a page-local shuffle as a whole-result
 * ordering, which is worse than no sort control at all.
 */
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { TH } from "@/components/data/DataTable";
import { cn } from "@/lib/utils";

export type SortHeaderProps = {
  label: string;
  /** This column's sort key. */
  sortKey: string;
  /** The key currently sorted by, if any. */
  activeKey?: string;
  activeDir: "asc" | "desc";
  basePath: string;
  /** Other params to preserve. `sort`, `dir` and `page` are managed here. */
  params: Record<string, string | undefined>;
  align?: "left" | "right" | "center";
};

export function SortHeader({
  label,
  sortKey,
  activeKey,
  activeDir,
  basePath,
  params,
  align = "left",
}: SortHeaderProps) {
  const isActive = activeKey === sortKey;
  // Clicking the active column flips direction; a new column starts ascending.
  const nextDir = isActive && activeDir === "asc" ? "desc" : "asc";

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  qs.set("sort", sortKey);
  if (nextDir === "desc") qs.set("dir", "desc");
  // Deliberately no `page`: a re-sort invalidates the current page number, and
  // staying on page 7 of a different ordering shows an unrelated slice.

  const Icon = !isActive ? ChevronsUpDown : activeDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TH align={align} className="p-0">
      <Link
        href={`${basePath}?${qs.toString()}`}
        // aria-sort belongs on the th; the link carries the accessible action.
        aria-label={`Sort by ${label}, ${nextDir === "asc" ? "ascending" : "descending"}`}
        className={cn(
          "flex w-full items-center gap-1 px-4 py-3 font-medium transition-colors hover:text-foreground",
          align === "right" && "justify-end",
          align === "center" && "justify-center",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className={cn("h-3 w-3 shrink-0", isActive ? "opacity-100" : "opacity-40")} />
      </Link>
    </TH>
  );
}
