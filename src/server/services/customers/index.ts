import type { CustomerType, Prisma } from "@prisma/client";

import { createKeyedTtlCache } from "@/server/cache/ttl-cache";
import { prisma } from "@/server/db/client";
import { logger } from "@/server/logger";

export type ListCustomersFilters = {
  customerType?: CustomerType;
  storeId?: string;
  consent?: "subscribed" | "unsubscribed" | "transactional";
  /** When the customer last ordered (product owner, 2026-11-10). */
  lastOrder?: LastOrderFilter;
  search?: string;
  /** 1-based page (post-roadmap pagination). */
  page?: number;
  sort?: CustomerSortKey;
  dir?: SortDirection;
};

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

export const CUSTOMERS_PAGE_SIZE = 50;

/**
 * How recently a customer last ordered. The day and month buckets are
 * "within the last N": a customer who ordered yesterday is in all five. The
 * last two are the other end: a last order more than 24 months ago, and no
 * order at all. Together with "any time" they cover every customer once
 * each at the far end and cumulatively at the near end, which is how a
 * reactivation list is read: "who has gone quiet for 90 days", "who has not
 * ordered in two years".
 */
export const LAST_ORDER_FILTERS = ["30d", "60d", "90d", "12m", "24m", "older", "never"] as const;
export type LastOrderFilter = (typeof LAST_ORDER_FILTERS)[number];

export const LAST_ORDER_FILTER_LABELS: Record<LastOrderFilter, string> = {
  "30d": "Last 30 days",
  "60d": "Last 60 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
  "24m": "Last 24 months",
  older: "Over 24 months ago",
  never: "Never ordered",
};

/** Narrows an arbitrary query-string value to a supported last-order filter. */
export function parseLastOrderFilter(value: string | undefined): LastOrderFilter | undefined {
  return LAST_ORDER_FILTERS.includes(value as LastOrderFilter)
    ? (value as LastOrderFilter)
    : undefined;
}

// UTC arithmetic, so the boundary is the same instant whatever the server's
// zone, and a daylight-saving change inside the window does not move it.
const daysAgo = (now: Date, days: number): Date => {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
};

const monthsAgo = (now: Date, months: number): Date => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
};

/**
 * The `lastOrderAt` clause for a filter, relative to `now`. Pure, so the
 * list, the count and the export agree on the boundary, and the test can
 * pin it. Calendar months rather than 30-day multiples, so "12 months"
 * from the 10th is the 10th a year ago.
 */
export function lastOrderWhere(
  filter: LastOrderFilter,
  now: Date = new Date(),
): Prisma.CustomerWhereInput["lastOrderAt"] {
  switch (filter) {
    case "30d":
      return { gte: daysAgo(now, 30) };
    case "60d":
      return { gte: daysAgo(now, 60) };
    case "90d":
      return { gte: daysAgo(now, 90) };
    case "12m":
      return { gte: monthsAgo(now, 12) };
    case "24m":
      return { gte: monthsAgo(now, 24) };
    case "older":
      return { lt: monthsAgo(now, 24) };
    case "never":
      return null;
  }
}

export type SortDirection = "asc" | "desc";

/**
 * Columns the customers list can sort by **in the database**, so the order
 * holds across the whole matching set rather than the fetched page. Every
 * key is a column or a direct relation of the customer row.
 */
export const CUSTOMER_SORT_KEYS = [
  "name",
  "type",
  "store",
  "consent",
  "value",
  "orders",
  "lastOrder",
  "reactivation",
] as const;
export type CustomerSortKey = (typeof CUSTOMER_SORT_KEYS)[number];

/** Narrows an arbitrary query-string value to a supported sort key. */
export function parseCustomerSort(value: string | undefined): CustomerSortKey | undefined {
  return CUSTOMER_SORT_KEYS.includes(value as CustomerSortKey)
    ? (value as CustomerSortKey)
    : undefined;
}

export function parseSortDirection(value: string | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc";
}

/**
 * Builds the orderBy. Every branch ends with `id` so paging is deterministic:
 * without a unique final key, rows sharing a sort value can swap between
 * pages and one is never shown.
 *
 * Every branch begins with `deletedAt`. The list only shows rows where it is
 * null, so naming it changes nothing about the order, but it lets the index
 * on (deletedAt, lastOrderAt DESC NULLS LAST, createdAt DESC, id) serve the
 * default order: Postgres only drops a leading index column from the sort
 * match when the query has an equality on it, and `IS NULL` is not one.
 * Without it the default page read and sorted all 75,000 customers on every
 * load (1.1 s on the production database, 2026-11-05); with it the scan
 * stops after fifty rows.
 *
 * Optional columns sort nulls last in both directions. A customer who has
 * never ordered is not the "latest" last order, and a customer with no
 * reactivation score is not the best candidate; both are absences and
 * belong at the end whichever way the column is sorted.
 */
export function customerOrderBy(
  sort: CustomerSortKey | undefined,
  dir: SortDirection,
): Prisma.CustomerOrderByWithRelationInput[] {
  const live = { deletedAt: "asc" } as const;
  const nullsLast = { sort: dir, nulls: "last" } as const;
  switch (sort) {
    case "name":
      // The display name is the company, else the person's name, else the
      // email, so the order follows the same precedence.
      return [
        live,
        { companyName: nullsLast },
        { lastName: nullsLast },
        { firstName: nullsLast },
        { email: nullsLast },
        { id: "asc" },
      ];
    case "type":
      return [live, { customerType: dir }, { id: "asc" }];
    case "store":
      return [live, { store: { name: dir } }, { id: "asc" }];
    case "consent":
      return [live, { consentStatus: dir }, { id: "asc" }];
    case "value":
      return [live, { lifetimeValue: dir }, { id: "asc" }];
    case "orders":
      return [live, { orderCount: dir }, { id: "asc" }];
    case "lastOrder":
      return [live, { lastOrderAt: nullsLast }, { createdAt: dir }, { id: "asc" }];
    case "reactivation":
      return [live, { reactivationScore: nullsLast }, { id: "asc" }];
    default:
      // Unsorted default: most recent order first, customers who have never
      // ordered last, newest of those first. The index
      // customers_deletedAt_lastOrderAt_createdAt_id_idx matches this order.
      return [
        live,
        { lastOrderAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "asc" },
      ];
  }
}

/**
 * Filter clause shared by listCustomers and countCustomers. The two must
 * agree exactly, or the pagination footer computes its page count from a
 * different population than the rows it is paging through.
 */
function customerWhere(filters: ListCustomersFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (filters.customerType) where.customerType = filters.customerType;
  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.consent) where.consentStatus = filters.consent;
  if (filters.lastOrder) where.lastOrderAt = lastOrderWhere(filters.lastOrder);
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listCustomers(filters: ListCustomersFilters = {}) {
  const customers = await prisma.customer.findMany({
    where: customerWhere(filters),
    orderBy: customerOrderBy(filters.sort, filters.dir ?? "asc"),
    skip: (Math.max(1, filters.page ?? 1) - 1) * CUSTOMERS_PAGE_SIZE,
    take: CUSTOMERS_PAGE_SIZE,
    include: {
      store: { select: { id: true, name: true } },
    },
  });

  return customers.map((c) => ({
    id: c.id,
    displayName: customerDisplayName(c),
    companyName: c.companyName,
    email: c.email,
    customerType: c.customerType,
    consentStatus: c.consentStatus,
    lifetimeValue: num(c.lifetimeValue),
    orderCount: c.orderCount,
    lastOrderAt: c.lastOrderAt,
    reactivationScore: c.reactivationScore,
    store: c.store,
  }));
}

export type CustomerListRow = Awaited<ReturnType<typeof listCustomers>>[number];

/**
 * The header total, the page count, and since 2026-11-12 the totals the page
 * shows for the filtered set: how many customers, their lifetime value and
 * their orders added up (product owner). Counting the whole table walks all
 * 75,000 customers (most of a second on the production database), and the
 * sums ride on the same scan as one aggregate query, so one filter
 * combination's figures are shared by every reader for a minute
 * (2026-11-05); past that the last figures are shown while the next scan
 * runs, and the web process computes the unfiltered ones as it starts.
 * Customers are written by the syncs and imports, which run in the worker,
 * so the totals can trail them by up to a minute; the rows themselves never
 * do. Measured on production: the unfiltered aggregate is one sequential
 * scan at 1.25 s, a last-order window runs off the index in 3 ms.
 */
export const CUSTOMER_COUNT_TTL_MS = 60_000;

/** How many filter combinations' counts are held at once. */
export const CUSTOMER_COUNT_MAX_ENTRIES = 8;

export type CustomerTotals = {
  /** Customers matching the filters. */
  customers: number;
  /** Their lifetime values added up, in the store currency. */
  lifetimeValue: number;
  /** Their order counts added up. Each follows the sale rule (docs/42). */
  orders: number;
};

const totalsCache = createKeyedTtlCache<CustomerTotals>(CUSTOMER_COUNT_TTL_MS, {
  staleWhileRevalidate: true,
  maxEntries: CUSTOMER_COUNT_MAX_ENTRIES,
});

/**
 * The filters that shape the count, in a fixed order, so equal filters share
 * one entry whatever else (page, sort, direction) differs.
 */
export function customerCountKey(filters: ListCustomersFilters): string {
  return JSON.stringify([
    filters.customerType ?? null,
    filters.storeId ?? null,
    filters.consent ?? null,
    filters.lastOrder ?? null,
    filters.search?.trim() || null,
  ]);
}

/**
 * The customers matching the filters, with their lifetime value and orders
 * added up: one aggregate over the same where clause the rows use, so the
 * three figures and the list can never disagree about who is counted.
 */
export async function summarizeCustomers(
  filters: ListCustomersFilters = {},
): Promise<CustomerTotals> {
  return totalsCache.get(customerCountKey(filters), async () => {
    const aggregate = await prisma.customer.aggregate({
      where: customerWhere(filters),
      _count: { _all: true },
      _sum: { lifetimeValue: true, orderCount: true },
    });
    return {
      customers: aggregate._count._all,
      lifetimeValue: num(aggregate._sum.lifetimeValue),
      orders: aggregate._sum.orderCount ?? 0,
    };
  });
}

/** Total Customer rows matching filters (NOT capped — used for the page header). */
export async function countCustomers(filters: ListCustomersFilters = {}): Promise<number> {
  return (await summarizeCustomers(filters)).customers;
}

/** Drops every shared count so the next reader counts anew. */
export function invalidateCustomerCounts(): void {
  totalsCache.clear();
}

/**
 * Counts the unfiltered list ahead of the first reader, at process start.
 * Never throws: a database that is not ready yet is logged, and the first
 * reader counts.
 */
export async function warmCustomerCount(): Promise<void> {
  try {
    const customers = await countCustomers({});
    logger.info({ customers }, "customer count warmed");
  } catch (err) {
    logger.warn({ err }, "customer count could not be warmed");
  }
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      store: true,
      division: true,
      segmentMembers: {
        include: { segment: { select: { id: true, name: true, segmentType: true } } },
      },
      marketingContacts: {
        select: {
          id: true,
          email: true,
          status: true,
          consentStatus: true,
          lastCampaignSentAt: true,
          lastOpenedAt: true,
          lastClickedAt: true,
          tags: true,
        },
      },
      orders: {
        orderBy: { orderDate: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          currency: true,
        },
      },
    },
  });

  if (!customer) return null;

  return {
    ...customer,
    displayName: customerDisplayName(customer),
    lifetimeValue: num(customer.lifetimeValue),
    orders: customer.orders.map((o) => ({
      ...o,
      grandTotal: num(o.grandTotal),
    })),
  };
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerById>>>;

export function customerDisplayName(c: {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
}): string {
  if (c.companyName) return c.companyName;
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  if (name) return name;
  return c.email ?? "Unknown";
}
