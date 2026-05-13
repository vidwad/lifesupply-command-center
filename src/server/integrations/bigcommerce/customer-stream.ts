/**
 * Streaming BigCommerce customer → CSV export with lightweight enrichment.
 *
 * Designed for the 512MB Render worker: streams rows as we paginate, slim
 * per-customer state (~150 bytes including aggregates) so even Enterprise
 * stores with hundreds of thousands of customers stay well under the
 * memory budget.
 *
 * Output columns include lifetime spend, AOV, recency cohort, customer
 * lifespan, B2B detection, and payment methods — all derived from the
 * orders + customers walks WITHOUT any additional per-order API calls,
 * so this is a free upgrade over the previous "last-order-only" CSV.
 *
 * For deeper enrichment (per-order product mix / category resolution,
 * per-order refund transactions, wishlists, abandoned carts), use the
 * standalone Python tool at bc-customer-enrichment/ — it runs locally
 * and does the per-order fetches that would OOM this worker.
 *
 * Audit-logged after the stream finishes via the stats promise.
 */

import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";
import { prisma } from "@/server/db/client";

const BC_BASE = "https://api.bigcommerce.com";
const PAGE_SIZE = 250;
const HARD_CAP_CUSTOMERS = 250_000;
const HARD_CAP_ORDERS = 500_000;
// Customer groups treated as B2B for the Is B2B column. LifeSupply hint from
// the spec: groups 4 and 8 may correspond to wholesale / institutional tiers.
const B2B_GROUP_IDS = new Set<number>([4, 8]);
const NOW_MS = Date.now;

type CustomerAgg = {
  count: number;
  spend: number;
  firstMs: number; // +Infinity until first order seen
  lastMs: number; // -Infinity until first order seen
  lastOrderId: number;
  lastTotal: number;
  largest: number;
  paymentMethods: Set<string>;
};

type GuestAgg = CustomerAgg & {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
};

type BcCustomer = {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  customer_group_id?: number;
  tax_exempt_category?: string;
  date_created?: string;
};

type BcOrder = {
  id: number;
  customer_id: number;
  date_created: string;
  total_inc_tax: string | number;
  payment_method?: string;
  billing_address?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    phone?: string;
  };
};

const COLUMNS = [
  "Source",
  "Customer ID",
  "Email",
  "First Name",
  "Last Name",
  "Company",
  "Phone",
  "First Order Date",
  "Last Order Date",
  "Last Order Total",
  "Last Order ID",
  "Total Orders",
  "Total Lifetime Spend",
  "AOV",
  "Days Since Last Order",
  "Customer Lifespan Days",
  "Order Frequency Days",
  "Recency Bucket",
  "Funnel Gap Days",
  "Largest Single Order",
  "Payment Methods",
  "Is B2B",
  "Tax Exempt",
  "Tax Exempt Category",
  "Customer Group ID",
  "Registered",
];

/**
 * RFC 4180 CSV cell escaper. Wraps in double-quotes when the value contains
 * a comma, newline, or quote; doubles internal quotes.
 */
function csvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvLine(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(",") + "\n";
}

function recencyBucket(daysSince: number | null): string {
  if (daysSince === null) return "never";
  if (daysSince <= 30) return "0-30";
  if (daysSince <= 90) return "31-90";
  if (daysSince <= 180) return "91-180";
  if (daysSince <= 365) return "181-365";
  return "365+";
}

function emptyAgg(): CustomerAgg {
  return {
    count: 0,
    spend: 0,
    firstMs: Number.POSITIVE_INFINITY,
    lastMs: Number.NEGATIVE_INFINITY,
    lastOrderId: 0,
    lastTotal: 0,
    largest: 0,
    paymentMethods: new Set<string>(),
  };
}

function isoDate(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

function daysBetween(laterMs: number, earlierMs: number): number {
  return Math.floor((laterMs - earlierMs) / (1000 * 60 * 60 * 24));
}

async function bcFetch(
  url: string,
  apiToken: string,
): Promise<
  | { ok: true; status: number; body: string }
  | { ok: false; status: number | "network"; body: string }
> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { "X-Auth-Token": apiToken, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    return { ok: false, status: "network", body: err instanceof Error ? err.message : "network" };
  }
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body: body.slice(0, 200) };
  return { ok: true, status: res.status, body };
}

export type StreamPrepResult =
  | { ok: true; storeRoot: string; apiToken: string }
  | { ok: false; status: number | string; message: string };

/**
 * Resolve credentials for a BigCommerce connection. Returns a structured
 * error if anything is missing — call this BEFORE returning the stream so
 * the route can respond with a normal JSON error instead of a partial CSV.
 */
export async function prepareBigCommerceCustomerStream(
  connectionName: string,
): Promise<StreamPrepResult> {
  const conn = await prisma.integrationConnection.findFirst({
    where: { integrationType: "bigcommerce", name: connectionName },
    select: { id: true },
  });
  if (!conn) {
    return { ok: false, status: "missing_credential", message: "Integration not found" };
  }
  const bundle = await resolveCredentialsBundleForConnection(conn.id);
  if (!bundle?.storeHash || !bundle?.apiToken) {
    return {
      ok: false,
      status: "missing_credential",
      message: "Both storeHash and apiToken must be configured.",
    };
  }
  return {
    ok: true,
    storeRoot: `${BC_BASE}/stores/${encodeURIComponent(bundle.storeHash)}`,
    apiToken: bundle.apiToken,
  };
}

export type StreamStats = {
  customers: number;
  guests: number;
  orders: number;
  guestOrders: number;
  durationMs: number;
};

/**
 * Update a per-customer aggregate with one order's data. Captures min/max
 * dates, count/spend totals, the most-recent-order metadata for the "Last
 * Order *" columns, and the set of payment methods used.
 *
 * Returns true when the supplied order is the most-recent one seen so far —
 * the caller uses that to refresh guest billing identity.
 */
function updateAgg(
  agg: CustomerAgg,
  orderId: number,
  orderMs: number,
  total: number,
  paymentMethod?: string,
): boolean {
  agg.count++;
  agg.spend += total;
  if (total > agg.largest) agg.largest = total;
  if (paymentMethod) agg.paymentMethods.add(paymentMethod);
  if (!Number.isFinite(orderMs)) return false;
  if (orderMs < agg.firstMs) agg.firstMs = orderMs;
  const wasMostRecent = orderMs >= agg.lastMs;
  if (wasMostRecent) {
    agg.lastMs = orderMs;
    agg.lastOrderId = orderId;
    agg.lastTotal = total;
  }
  return wasMostRecent;
}

/**
 * Build the readable stream that emits CSV rows. Resolves to the stream and
 * a stats promise that fulfills once the stream is fully drained.
 */
export function buildBigCommerceCustomerCsvStream(prep: { storeRoot: string; apiToken: string }): {
  stream: ReadableStream<Uint8Array>;
  statsPromise: Promise<StreamStats>;
} {
  const { storeRoot, apiToken } = prep;
  const encoder = new TextEncoder();

  let resolveStats: (s: StreamStats) => void = () => {};
  let rejectStats: (err: unknown) => void = () => {};
  const statsPromise = new Promise<StreamStats>((res, rej) => {
    resolveStats = res;
    rejectStats = rej;
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = NOW_MS();
      const todayMs = startedAt;
      const enq = (s: string) => controller.enqueue(encoder.encode(s));
      try {
        enq(csvLine(COLUMNS));

        // ---- Pass 1: orders → per-customer + per-guest aggregates ---- //
        const aggByCustomer = new Map<number, CustomerAgg>();
        const aggByGuestEmail = new Map<string, GuestAgg>();

        let orderPage = 1;
        let ordersScanned = 0;
        let guestOrders = 0;
        while (ordersScanned < HARD_CAP_ORDERS) {
          const url = `${storeRoot}/v2/orders?limit=${PAGE_SIZE}&page=${orderPage}&sort=date_created:desc`;
          const r = await bcFetch(url, apiToken);
          if (!r.ok) {
            if (r.status === 404) break;
            throw new Error(`Orders page ${orderPage}: ${r.body || `HTTP ${r.status}`}`);
          }
          if (r.status === 204 || r.body.trim() === "") break;
          let orders: BcOrder[];
          try {
            orders = JSON.parse(r.body) as BcOrder[];
          } catch {
            break;
          }
          if (!Array.isArray(orders) || orders.length === 0) break;
          for (const o of orders) {
            ordersScanned++;
            if (ordersScanned > HARD_CAP_ORDERS) break;
            const orderMs = new Date(o.date_created).getTime();
            const total = Number(o.total_inc_tax) || 0;
            const pm = o.payment_method?.trim() || undefined;

            if (o.customer_id && o.customer_id > 0) {
              let agg = aggByCustomer.get(o.customer_id);
              if (!agg) {
                agg = emptyAgg();
                aggByCustomer.set(o.customer_id, agg);
              }
              updateAgg(agg, o.id, orderMs, total, pm);
              continue;
            }

            const rawEmail = o.billing_address?.email?.trim().toLowerCase();
            if (!rawEmail) continue;
            guestOrders++;
            let gAgg = aggByGuestEmail.get(rawEmail);
            if (!gAgg) {
              gAgg = { ...emptyAgg() } as GuestAgg;
              aggByGuestEmail.set(rawEmail, gAgg);
            }
            const wasMostRecent = updateAgg(gAgg, o.id, orderMs, total, pm);
            if (wasMostRecent) {
              const fn = o.billing_address?.first_name?.trim();
              const ln = o.billing_address?.last_name?.trim();
              const co = o.billing_address?.company?.trim();
              const ph = o.billing_address?.phone?.trim();
              if (fn) gAgg.firstName = fn;
              if (ln) gAgg.lastName = ln;
              if (co) gAgg.company = co;
              if (ph) gAgg.phone = ph;
            }
          }
          if (orders.length < PAGE_SIZE) break;
          orderPage++;
        }

        // ---- Pass 2: customers (registered) — emit as we go ---- //
        const registeredEmails = new Set<string>();
        let customerPage = 1;
        let customersScanned = 0;
        while (customersScanned < HARD_CAP_CUSTOMERS) {
          const url = `${storeRoot}/v3/customers?limit=${PAGE_SIZE}&page=${customerPage}`;
          const r = await bcFetch(url, apiToken);
          if (!r.ok) {
            throw new Error(`Customers page ${customerPage}: ${r.body || `HTTP ${r.status}`}`);
          }
          let parsed: { data?: BcCustomer[] };
          try {
            parsed = JSON.parse(r.body) as { data?: BcCustomer[] };
          } catch {
            break;
          }
          const data = parsed.data ?? [];
          if (data.length === 0) break;
          for (const c of data) {
            customersScanned++;
            if (customersScanned > HARD_CAP_CUSTOMERS) break;
            if (c.email) registeredEmails.add(c.email.toLowerCase());
            const a = aggByCustomer.get(c.id);
            enq(emitRow("registered", c, a, todayMs));
          }
          if (data.length < PAGE_SIZE) break;
          customerPage++;
        }

        // ---- Pass 3: unregistered guests — dedup against registered ---- //
        let guestsEmitted = 0;
        for (const [email, gAgg] of aggByGuestEmail.entries()) {
          if (registeredEmails.has(email)) continue;
          guestsEmitted++;
          enq(emitGuestRow(email, gAgg, todayMs));
        }

        controller.close();
        resolveStats({
          customers: customersScanned,
          guests: guestsEmitted,
          orders: ordersScanned,
          guestOrders,
          durationMs: NOW_MS() - startedAt,
        });
      } catch (err) {
        controller.error(err);
        rejectStats(err);
      }
    },
  });

  return { stream, statsPromise };
}

/** Build one CSV row for a registered /v3/customers result. */
function emitRow(
  source: "registered",
  c: BcCustomer,
  a: CustomerAgg | undefined,
  todayMs: number,
): string {
  const hasOrders = a !== undefined && a.count > 0;
  const totalOrders = a?.count ?? 0;
  const totalSpend = a?.spend ?? 0;
  const aov = totalOrders > 0 ? totalSpend / totalOrders : 0;
  const lastMs = a?.lastMs;
  const firstMs = a?.firstMs;
  const daysSince =
    lastMs !== undefined && Number.isFinite(lastMs)
      ? Math.max(daysBetween(todayMs, lastMs), 0)
      : null;
  const bucket = recencyBucket(daysSince);
  const lifespan =
    firstMs !== undefined &&
    lastMs !== undefined &&
    Number.isFinite(firstMs) &&
    Number.isFinite(lastMs)
      ? Math.max(daysBetween(lastMs, firstMs), 0)
      : 0;
  const orderFreq =
    totalOrders > 1 && lifespan > 0
      ? (lifespan / (totalOrders - 1)).toFixed(1)
      : "";
  let funnelGap: number | "" = "";
  if (c.date_created && firstMs !== undefined && Number.isFinite(firstMs)) {
    const regMs = new Date(c.date_created).getTime();
    if (Number.isFinite(regMs)) funnelGap = daysBetween(firstMs, regMs);
  }
  const isB2B =
    !!(c.company && c.company.trim()) ||
    (c.customer_group_id !== undefined && B2B_GROUP_IDS.has(c.customer_group_id));
  const taxExempt = !!(c.tax_exempt_category && c.tax_exempt_category.trim());
  const paymentMethods = a ? Array.from(a.paymentMethods).sort().join("|") : "";

  return csvLine([
    source,
    c.id,
    c.email ?? "",
    c.first_name ?? "",
    c.last_name ?? "",
    c.company ?? "",
    c.phone ?? "",
    isoDate(firstMs ?? Number.NaN),
    isoDate(lastMs ?? Number.NaN),
    hasOrders ? (a!.lastTotal).toFixed(2) : "",
    a?.lastOrderId || "",
    totalOrders,
    hasOrders ? totalSpend.toFixed(2) : "0.00",
    hasOrders ? aov.toFixed(2) : "",
    daysSince ?? "",
    lifespan,
    orderFreq,
    bucket,
    funnelGap,
    hasOrders ? (a!.largest).toFixed(2) : "",
    paymentMethods,
    isB2B ? "true" : "false",
    taxExempt ? "true" : "false",
    c.tax_exempt_category ?? "",
    c.customer_group_id ?? "",
    c.date_created ? c.date_created.slice(0, 10) : "",
  ]);
}

/** Build one CSV row for a guest checkout (no /v3/customers row exists). */
function emitGuestRow(email: string, a: GuestAgg, todayMs: number): string {
  const totalOrders = a.count;
  const totalSpend = a.spend;
  const aov = totalOrders > 0 ? totalSpend / totalOrders : 0;
  const daysSince = Number.isFinite(a.lastMs)
    ? Math.max(daysBetween(todayMs, a.lastMs), 0)
    : null;
  const bucket = recencyBucket(daysSince);
  const lifespan =
    Number.isFinite(a.firstMs) && Number.isFinite(a.lastMs)
      ? Math.max(daysBetween(a.lastMs, a.firstMs), 0)
      : 0;
  const orderFreq =
    totalOrders > 1 && lifespan > 0
      ? (lifespan / (totalOrders - 1)).toFixed(1)
      : "";
  const isB2B = !!(a.company && a.company.trim());
  const paymentMethods = Array.from(a.paymentMethods).sort().join("|");

  return csvLine([
    "guest",
    "",
    email,
    a.firstName ?? "",
    a.lastName ?? "",
    a.company ?? "",
    a.phone ?? "",
    isoDate(a.firstMs),
    isoDate(a.lastMs),
    a.lastTotal.toFixed(2),
    a.lastOrderId || "",
    totalOrders,
    totalSpend.toFixed(2),
    aov.toFixed(2),
    daysSince ?? "",
    lifespan,
    orderFreq,
    bucket,
    "", // no registration date for guests → no funnel gap
    a.largest.toFixed(2),
    paymentMethods,
    isB2B ? "true" : "false",
    "false", // no tax_exempt_category for guests
    "",
    "",
    "",
  ]);
}
