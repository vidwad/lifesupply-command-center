/**
 * Timestamp formatting for BigCommerce filter parameters.
 *
 * WHY THIS EXISTS. `Date.prototype.toISOString()` emits milliseconds
 * (`2026-05-15T01:57:42.796Z`). The BigCommerce **v3 catalog** endpoints reject
 * that outright:
 *
 *   HTTP 422 — {"status":422,"code":20203,
 *               "title":"The value for field date_modified is invalid"}
 *
 * Confirmed against the live API on 2026-08-23:
 *
 *   date_modified:min=2026-05-15T01:57:42.796Z  -> 422
 *   date_modified:min=2026-05-15T01:57:42Z      -> 200
 *
 * The failure mode is quiet and total: every incremental catalog sync returns
 * 422 on page 1, imports zero products, and — because categories are fetched
 * separately and unfiltered — still looks like it did some work.
 *
 * Seconds precision is accepted everywhere BigCommerce takes a timestamp
 * (v2 `min_date_modified` and v3 `date_modified:min` alike), so this is applied
 * to every outbound sync watermark rather than only the catalog, and the same
 * bug cannot reappear on a different endpoint.
 *
 * Losing sub-second precision on a watermark is harmless: it can only widen the
 * window by up to 999ms, and every sync writes with upsert semantics, so the
 * worst case is re-reading a handful of records that were already current.
 */

/**
 * ISO-8601 UTC to seconds precision — `YYYY-MM-DDTHH:MM:SSZ`.
 *
 * Truncates rather than rounds, so the returned instant is never later than
 * `date`. A watermark that moved forward, even by a millisecond, could skip a
 * record modified inside that gap.
 */
export function bigCommerceTimestamp(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("bigCommerceTimestamp received an invalid Date");
  }
  // toISOString() is always `YYYY-MM-DDTHH:MM:SS.mmmZ` (24 chars) for in-range
  // dates; dropping the last 5 characters removes `.mmm` and the trailing `Z`,
  // which is re-added. Years outside 0000-9999 use an expanded ±YYYYYY form —
  // not reachable from a database timestamp, and the regex below refuses it
  // rather than silently producing a malformed filter.
  const iso = date.toISOString();
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.\d{3}Z$/.exec(iso);
  if (!match) {
    throw new RangeError(`bigCommerceTimestamp cannot format ${iso}`);
  }
  return `${match[1]}Z`;
}

/** Nullable convenience wrapper — returns undefined so it can be spread into optional args. */
export function bigCommerceTimestampOrUndefined(date: Date | null | undefined): string | undefined {
  return date ? bigCommerceTimestamp(date) : undefined;
}
