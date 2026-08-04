/**
 * Page-based pagination footer (post-roadmap follow-up). Plain links so it
 * works in server components and preserves the page's other filters.
 */
import Link from "next/link";

export function Pagination({
  basePath,
  page,
  pageSize,
  totalCount,
  params,
}: {
  basePath: string;
  page: number;
  pageSize: number;
  totalCount: number;
  /** Current filter params to preserve (page is managed here). */
  params: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    if (target > 1) qs.set("page", String(target));
    const s = qs.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };

  const linkCls =
    "rounded-md border bg-background px-3 py-1.5 font-medium hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <nav className="flex items-center justify-between gap-3 text-xs" aria-label="Pagination">
      <Link href={href(page - 1)} aria-disabled={page <= 1} className={linkCls}>
        ← Previous
      </Link>
      <span className="text-muted-foreground">
        Page {page.toLocaleString()} of {totalPages.toLocaleString()} ·{" "}
        {totalCount.toLocaleString()} rows
      </span>
      <Link href={href(page + 1)} aria-disabled={page >= totalPages} className={linkCls}>
        Next →
      </Link>
    </nav>
  );
}
