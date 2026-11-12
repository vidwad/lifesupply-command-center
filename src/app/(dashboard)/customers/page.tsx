import Link from "next/link";
import { DollarSign, ShoppingCart, Users } from "lucide-react";

import { DataTable, TBody, TD, THead, TR } from "@/components/data/DataTable";
import { ExportButton } from "@/components/data/ExportButton";
import { KpiCard } from "@/components/data/KpiCard";
import { SortHeader } from "@/components/data/SortHeader";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { AssistantPageContext } from "@/components/ai/assistant/page-context";
import { PageHeader } from "@/components/shell/PageHeader";
import { Pagination } from "@/components/data/Pagination";
import { formatCurrency, formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import {
  CUSTOMERS_PAGE_SIZE,
  LAST_ORDER_FILTER_LABELS,
  LAST_ORDER_FILTERS,
  listCustomers,
  parseCustomerSort,
  parseLastOrderFilter,
  parseSortDirection,
  summarizeCustomers,
  type ListCustomersFilters,
} from "@/server/services/customers";
import { listStores } from "@/server/services/stores";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { SyncButtons } from "@/components/sync/SyncButtons";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const TYPE_FILTERS = [
  { label: "All types", value: "" },
  { label: "B2B", value: "b2b" },
  { label: "Clinic", value: "clinic" },
  { label: "Institutional", value: "institutional" },
  { label: "Retail", value: "retail" },
] as const;

const CONSENT_FILTERS = [
  { label: "Any consent", value: "" },
  { label: "Subscribed", value: "subscribed" },
  { label: "Unsubscribed", value: "unsubscribed" },
  { label: "Transactional", value: "transactional" },
] as const;

const CONSENT_BADGE: Record<string, "success" | "destructive" | "secondary" | "outline"> = {
  subscribed: "success",
  unsubscribed: "destructive",
  transactional: "secondary",
  pending: "outline",
  cleaned: "outline",
  unknown: "outline",
};

type SearchParams = {
  type?: string;
  consent?: string;
  store?: string;
  /** Last-order recency, one of LAST_ORDER_FILTERS. */
  last?: string;
  q?: string;
  page?: string;
  sort?: string;
  dir?: string;
};

const PILL_ACTIVE = "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground";
const PILL_IDLE =
  "rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.CUSTOMERS_VIEW);
  const params = await searchParams;
  const canExport = userHasPermission(user, PERMISSIONS.CUSTOMERS_EXPORT);

  // Unknown sort keys fall back to the default ordering rather than erroring,
  // so a stale bookmark still renders the list.
  const sort = parseCustomerSort(params.sort);
  const dir = parseSortDirection(params.dir);
  const stores = await listStores();
  const storeId = stores.some((s) => s.id === params.store) ? params.store : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const filters: ListCustomersFilters = {
    customerType: TYPE_FILTERS.some((t) => t.value && t.value === params.type)
      ? (params.type as ListCustomersFilters["customerType"])
      : undefined,
    consent: CONSENT_FILTERS.some((c) => c.value && c.value === params.consent)
      ? (params.consent as ListCustomersFilters["consent"])
      : undefined,
    storeId,
    lastOrder: parseLastOrderFilter(params.last),
    search: params.q?.trim() || undefined,
    page,
    sort,
    dir,
  };

  // The count and the totals come from one aggregate shared across readers
  // for a minute (see summarizeCustomers), so
  // the header total can trail a sync by that long; the rows never do.
  const [customers, totals] = await Promise.all([
    listCustomers(filters),
    summarizeCustomers(filters),
  ]);
  const totalCustomers = totals.customers;

  // The filters in force, as query-string values. A pill link overrides one
  // of them; the search form, the sort headers and the pagination footer
  // carry all of them forward.
  const active = {
    type: filters.customerType ?? "",
    consent: filters.consent ?? "",
    store: storeId ?? "",
    last: filters.lastOrder ?? "",
    q: filters.search ?? "",
  };
  const anyFilter = Boolean(
    active.type || active.consent || active.store || active.last || active.q,
  );

  // Changing a filter resets to page 1: staying on page 7 of a different
  // filter would usually land on an empty page. Sort is preserved, since it
  // is a view preference rather than a filter.
  const filterHref = (override: Partial<typeof active>): string => {
    const next = { ...active, ...override };
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value) qs.set(key, value);
    if (sort) qs.set("sort", sort);
    if (sort && dir === "desc") qs.set("dir", "desc");
    const s = qs.toString();
    return `/customers${s ? `?${s}` : ""}`;
  };

  // Params every sort header and the pagination footer must carry forward.
  const carried = {
    type: active.type || undefined,
    consent: active.consent || undefined,
    store: active.store || undefined,
    last: active.last || undefined,
    q: active.q || undefined,
  };
  const sortHeader = (
    label: string,
    sortKey: string,
    options: { align?: "left" | "right"; defaultDir?: "asc" | "desc" } = {},
  ) => (
    <SortHeader
      label={label}
      sortKey={sortKey}
      activeKey={sort}
      activeDir={dir}
      basePath="/customers"
      params={carried}
      align={options.align}
      defaultDir={options.defaultDir}
    />
  );

  const exportQuery = new URLSearchParams({
    ...(active.type && { type: active.type }),
    ...(active.consent && { consent: active.consent }),
    ...(active.last && { last: active.last }),
  }).toString();

  return (
    <div>
      <AssistantPageContext
        value={{
          route: "/customers",
          title: "Customers",
          filters: {
            ...(active.type && { type: active.type }),
            ...(active.consent && { consent: active.consent }),
            ...(active.store && { store: active.store }),
            ...(filters.lastOrder && { lastOrder: LAST_ORDER_FILTER_LABELS[filters.lastOrder] }),
            ...(active.q && { search: active.q }),
            ...(sort && { sort: `${sort} ${dir}` }),
            page: String(page),
          },
          storeId: storeId,
          figures: [
            { label: "Customers matching", value: totalCustomers.toLocaleString() },
            { label: "Lifetime value, matching", value: formatCurrency(totals.lifetimeValue) },
            { label: "Orders, matching", value: totals.orders.toLocaleString() },
          ],
        }}
      />
      <PageHeader
        title="Customers"
        description="B2B clinics, institutional buyers, and retail customers across all stores."
        breadcrumb={`${totalCustomers.toLocaleString()} ${totalCustomers === 1 ? "customer" : "customers"}`}
        actions={
          <div className="flex items-center gap-3">
            <SyncButtons entity="customers" />
            {canExport ? (
              <ExportButton
                href={`/api/exports/customers${exportQuery ? `?${exportQuery}` : ""}`}
              />
            ) : null}
          </div>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={filterHref({ type: f.value })}
              aria-current={active.type === f.value ? "true" : undefined}
              className={active.type === f.value ? PILL_ACTIVE : PILL_IDLE}
            >
              {f.label}
            </Link>
          ))}

          <form action="/customers" className="ml-auto flex items-center gap-2">
            {active.type && <input type="hidden" name="type" value={active.type} />}
            {active.consent && <input type="hidden" name="consent" value={active.consent} />}
            {active.store && <input type="hidden" name="store" value={active.store} />}
            {active.last && <input type="hidden" name="last" value={active.last} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {sort && dir === "desc" && <input type="hidden" name="dir" value="desc" />}
            <input
              type="search"
              name="q"
              defaultValue={active.q}
              placeholder="Search name, company, email…"
              className="h-9 w-64 max-w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CONSENT_FILTERS.map((f) => (
            <Link
              key={f.value || "any"}
              href={filterHref({ consent: f.value })}
              aria-current={active.consent === f.value ? "true" : undefined}
              className={active.consent === f.value ? PILL_ACTIVE : PILL_IDLE}
            >
              {f.label}
            </Link>
          ))}

          {stores.length > 1 ? (
            <>
              <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
              <Link
                href={filterHref({ store: "" })}
                aria-current={active.store === "" ? "true" : undefined}
                className={active.store === "" ? PILL_ACTIVE : PILL_IDLE}
              >
                All stores
              </Link>
              {stores.map((s) => (
                <Link
                  key={s.id}
                  href={filterHref({ store: s.id })}
                  aria-current={active.store === s.id ? "true" : undefined}
                  className={active.store === s.id ? PILL_ACTIVE : PILL_IDLE}
                >
                  {s.name}
                </Link>
              ))}
            </>
          ) : null}

          {anyFilter ? (
            <Link
              href={filterHref({ type: "", consent: "", store: "", last: "", q: "" })}
              className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Clear filters
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Last order</span>
          <Link
            href={filterHref({ last: "" })}
            aria-current={active.last === "" ? "true" : undefined}
            className={active.last === "" ? PILL_ACTIVE : PILL_IDLE}
          >
            Any time
          </Link>
          {LAST_ORDER_FILTERS.map((f) => (
            <Link
              key={f}
              href={filterHref({ last: f })}
              aria-current={active.last === f ? "true" : undefined}
              className={active.last === f ? PILL_ACTIVE : PILL_IDLE}
            >
              {LAST_ORDER_FILTER_LABELS[f]}
            </Link>
          ))}
        </div>

        {/*
         * Totals for the filtered set (product owner, 2026-11-12): the same
         * aggregate that counts the header and the pager, so these three
         * figures describe exactly the customers the rows below page through.
         */}
        <div className="grid gap-3 sm:grid-cols-3" data-testid="customer-totals">
          <KpiCard
            label="Customers"
            value={totalCustomers.toLocaleString()}
            caption={anyFilter ? "matching the filters" : "all customers"}
            icon={Users}
          />
          <KpiCard
            label="Lifetime value"
            value={formatCurrency(totals.lifetimeValue)}
            caption="added up across them"
            icon={DollarSign}
          />
          <KpiCard
            label="Orders"
            value={totals.orders.toLocaleString()}
            caption="added up across them"
            icon={ShoppingCart}
          />
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers match these filters"
            description="Adjust filters or run pnpm db:seed to populate sample customers."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                {sortHeader("Customer", "name")}
                {sortHeader("Type", "type")}
                {sortHeader("Store", "store")}
                {sortHeader("Consent", "consent")}
                {sortHeader("Lifetime value", "value", { align: "right", defaultDir: "desc" })}
                {sortHeader("Orders", "orders", { align: "right", defaultDir: "desc" })}
                {sortHeader("Last order", "lastOrder", { defaultDir: "desc" })}
                {sortHeader("Reactivation", "reactivation", { align: "right", defaultDir: "desc" })}
              </tr>
            </THead>
            <TBody>
              {customers.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                      {c.displayName}
                    </Link>
                    {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </TD>
                  <TD>
                    <Badge variant="outline">{c.customerType}</Badge>
                  </TD>
                  <TD className="text-muted-foreground">{c.store?.name ?? "—"}</TD>
                  <TD>
                    <Badge variant={CONSENT_BADGE[c.consentStatus] ?? "outline"}>
                      {c.consentStatus}
                    </Badge>
                  </TD>
                  <TD align="right" className="font-medium tabular-nums">
                    {formatCurrency(c.lifetimeValue)}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {c.orderCount}
                  </TD>
                  <TD className="text-muted-foreground">
                    {c.lastOrderAt ? formatDate(c.lastOrderAt) : "Never"}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {c.reactivationScore != null ? c.reactivationScore : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}

        <Pagination
          basePath="/customers"
          page={page}
          pageSize={CUSTOMERS_PAGE_SIZE}
          totalCount={totalCustomers}
          params={{ ...carried, sort, dir: sort && dir === "desc" ? "desc" : undefined }}
        />
      </div>
    </div>
  );
}
