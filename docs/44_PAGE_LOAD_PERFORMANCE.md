# Page load performance

**Status:** Standing record, opened November 5, 2026. Each entry names the pull request that
shipped it.

**Routes covered so far:** `/products`, `/dashboard`, `/customers`.

## 1. Purpose

The product owner reported in early November 2026 that the executive dashboard, the products list
and the customers list took several seconds to open on the production Command Center. This document
records what each load cost, what the cost was, what changed, and the rules those changes settled,
so later work on a slow page starts from the measurements rather than from guesses.

## 2. The platform the figures come from

The production database is Render's smallest Postgres plan: a tenth of a CPU, 256 MB of memory
(64 MB of shared buffers), 1.6 MB of `work_mem`, holding about 1.5 GB of data. The web service is a
Render Starter instance with 512 MB. Three facts follow and shaped every change below.

- A scan of a whole table costs most of a second or more, whatever the indexes, because the heap of
  each large table (products 76 MB, orders 188 MB, order items 216 MB, customers 75 MB) is larger
  than the buffer cache and the CPU is a tenth of a core.
- Concurrent queries do not run in parallel; they share the tenth of a core. Fourteen queries fired
  at once take about as long as fourteen in sequence, and every other request in flight waits
  behind them.
- A `Prisma` `count` or `findMany` that walks ten thousand rows is a second of wall time, not a
  rounding error.

Raising the plan is the owner's billing decision and would change all of these at once.

## 3. How a slow page is measured

1. **The server's own timing.** Render's request logs (`type=request`) carry `responseTimeMS` for
   every request. A page's `?_rsc=` request is a client-side navigation to it (page segment only);
   the bare path is a full page load (session, shell and page). Both matter: the owner's phone does
   the first after a tap and the second after a login or a reload.
2. **The plan.** `EXPLAIN (ANALYZE, BUFFERS)` on the production database, through the read-only
   Render MCP, of the SQL Prisma generates. The buffers line says whether the time is disk or CPU;
   `Heap Fetches` on an index-only scan says the visibility map is stale.
3. **The rewritten query, on production, before coding.** A change that moves a query from a
   scan-and-sort to an index scan shows as such in the plan; one that does not is not worth
   shipping.
4. **A local served build driven with Playwright** after the change, for correctness: the pages
   render with the right counts and rows, no console errors, no horizontal overflow at 390 px.

## 4. Rules these changes settled

### 4.1 Every ORDER BY on a soft-deleted table names `deletedAt` first

The lists filter `WHERE "deletedAt" IS NULL`, and their default-order indexes begin with
`deletedAt`. Postgres only drops a leading index column from the ORDER BY match when the query has
an *equality* on that column, and `IS NULL` is not one, so an index `(deletedAt, a, b, id)` did not
serve `ORDER BY a, b, id` at all: the planner scanned every live row and sorted. Naming `deletedAt`
first in the ORDER BY changes nothing about the result (every listed row is null there) and lets the
same index stop after one page.

| List | Default page before | After | Where |
| --- | --- | --- | --- |
| Products (51,158 rows) | Seq scan and top-N sort, 1,900 ms, 9,707 buffers read | Index scan, 0.4 ms, 50 buffers hit | `productOrderBy`, #272 |
| Customers (74,930 rows) | Index-only scan of every row and top-N sort, 1,100 ms | Index-only scan, 0.1 ms, 4 buffers hit | `customerOrderBy`, this round |

Both builders have a test that every branch begins with `{ deletedAt: "asc" }` and ends with
`{ id: "asc" }`.

### 4.2 Figures that are the same for every reader are loaded once and shared

`src/server/cache/ttl-cache.ts` holds one entry (or one per key) in the web process for a time to
live, serves the last good value while the next load runs in the background, and lets a write mark
the entry stale (`expire()`) or drop it (`clear()`). What is shared, and for how long:

| Figure | Readers | Held | Why that long |
| --- | --- | --- | --- |
| Product sales by product and day | products list segments and columns | 30 minutes | Reads the whole order history, 10.8 s; changes only when an order sync runs |
| Products population (id, image status) per filter combination | products list header and pills | 1 minute, 8 keys | Reads the whole catalogue, 0.7 s warm; only the sync (in the worker) writes it |
| Customers count per filter combination | customers list header and page count | 1 minute, 8 keys | Walks all 74,930 index entries, 0.9 s; only the syncs and imports (in the worker) write it |
| Open-exception count | the shell's bell on every full page load; the dashboard KPI | 1 minute | 2,695 rows with a heap fetch each, 0.4 s; resolving an exception marks it stale |
| Executive dashboard | `/dashboard`, the AI briefing, the assistant | 1 minute | About three seconds of order counts and aggregates; regenerating the briefing clears it, resolving an exception marks it stale |

The rows themselves are never cached: a list page always reads its fifty rows live. Only totals and
figures derived from whole tables are shared, so after a sync the header total or a pill count can
trail the rows by up to a minute. Each page says so in a comment beside the call.

### 4.3 The shared figures are loaded as the web process starts

`src/instrumentation.ts` warms them one after another, cheapest and most visited first: products
population, customers count, open-exception count, dashboard, then the product sales figures. The
first visit to a page after a deploy no longer pays the cold load. Each warm-up logs its own
outcome (`… warmed` or `… could not be warmed`) and never throws. The Render log of the 22:02 UTC
deploy on November 5 shows the lines for the first two; the rest follow from this round.

### 4.4 A background refresh runs its heavy queries in sequence

The dashboard's refresh used to fire fourteen queries at once. On a tenth of a core that starved
the reader whose visit started the refresh: a dashboard served from the cache still took 3.1 s on
November 5 at 23:36 UTC, because the shell's own counts were queued behind the refresh. The order
counts, the exception list and the product aggregate now run one after another inside
`loadDashboardData`; the cheap lookups still run alongside. The refresh takes about as long overall
and the requests in flight keep most of the database.

## 5. Record by route

### `/products` (PR #272, merged November 5, 2026 as `2e82f03`)

Owner's load at 20:56 UTC: 4,494 ms (`?_rsc`). Default order not using its index (§4.1), the
population scan reading the whole heap on every load (§4.2), the sales figures reloading every ten
minutes at 10.8 s each (now thirty). `docs/37_PRODUCT_PERFORMANCE_SEGMENTS.md` carries the
product-specific detail.

### `/customers` (this round)

Owner's load at 23:23 UTC: 5,468 ms (`?_rsc`). Two queries made up the database time, both measured
on production:

- the default list, 1,100 ms, scanning all 74,930 index entries and sorting them (§4.1; now 0.1
  ms);
- the count behind the header total and the page count, 905 ms, an index-only scan of every live
  row (§4.2; now shared for a minute and counted at start).

The rest of the time was contention: in the same second the owner's phone prefetched a product
detail page that took 8,755 ms on the server, and the database had a tenth of a core to divide.

Not changed: a search runs `ILIKE` over four columns of all 74,930 rows for the list and again for
the count, about a second each. The structural fix is a trigram index (`pg_trgm`) on those columns;
it needs the extension enabled on the production database and a migration, and is recorded here
rather than done.

### `/dashboard` (this round)

Two loads on November 5, both full pages on the owner's phone:

- 23:23:32 UTC, 8,887 ms: the first dashboard visit since the 22:02 deploy, so the cache was empty
  and the page waited for the whole load (§4.3 now warms it at start).
- 23:36:20 UTC, 3,129 ms: the cache held the 23:23 figures and served them, but the visit started a
  refresh, and the shell's counts queued behind its fourteen concurrent queries (§4.4). The shell
  also counted open exceptions itself on every full page load, 396 ms (§4.2).

The load's own cost on production, each query measured alone: open-order count 1,398 ms (an
index-only scan of 11,164 entries with 5,208 heap fetches), product aggregate over the last ninety
days 799 ms, exception count 396 ms, exception list and the rest under 100 ms together.

The open-order count's heap fetches are a stale visibility map, not a missing index: `orders` was
last autovacuumed on October 30 and carries 11,202 dead rows against 95,676 live, under the 20
percent that triggers autovacuum. A one-time `VACUUM (ANALYZE) orders` on the production database
would bring that count to tens of milliseconds. It is a maintenance statement on the production
database, so it is the owner's call and is recorded here rather than run.

## 6. Open items

| Item | Measured | Note |
| --- | --- | --- |
| `/orders` list | 13,528 ms (`?_rsc`, November 5, 20:56 UTC) | Its count and aggregates scan the orders and order-items heaps; the same treatment as the lists above |
| Product detail page | 8,755 ms (one prefetch, November 5, 23:23 UTC) | Not yet examined; it was prefetched from the products list while the customers page loaded |
| `VACUUM (ANALYZE) orders` | 5,208 heap fetches on the open-order count | Owner's decision; see §5 |
| Trigram index for customer search | about 1 s per search | Needs `pg_trgm` and a migration |
| Postgres plan | a tenth of a core, 64 MB of cache | Owner's billing decision; every figure above moves with it |
