/**
 * Streaming BigCommerce customer → CSV export.
 *
 * Designed to run on a 512MB Render worker without OOM by:
 *   1. Slim per-row state — we keep only (date, total, order_id, billing
 *      contact) per unique customer/guest, never the full BcOrder.
 *   2. Streaming response body — rows are written to a ReadableStream as
 *      we paginate BC; the file starts arriving in the browser within a
 *      second of the first BC page being fetched, so the openresty proxy
 *      in front of Render can't time out.
 *
 * Strategy:
 *   - Page through /v2/orders sorted desc → build slim last-order maps for
 *     registered customers (by id) and guests (by lower(email)). Skip guest
 *     orders whose email belongs to a registered customer once we know the
 *     registered set.
 *   - Page through /v3/customers → emit a CSV row per customer immediately,
 *     joining against the slim order map.
 *   - Then iterate the guest map and emit one CSV row per unique email.
 *
 * Note: we walk orders BEFORE customers so the registered-email skip-list
 * is built up by the time we start emitting. This means no buffering of
 * registered rows is needed.
 */

import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";
import { prisma } from "@/server/db/client";

const BC_BASE = "https://api.bigcommerce.com";
const PAGE_SIZE = 250;
const HARD_CAP_CUSTOMERS = 250_000;
const HARD_CAP_ORDERS = 500_000;

type SlimOrder = {
  orderId: number;
  date: string;
  total: number;
  // Only populated for guest orders; used to fill name/phone columns.
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
  date_created?: string;
};

type BcOrder = {
  id: number;
  customer_id: number;
  date_created: string;
  total_inc_tax: string | number;
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
  "Last Order Date",
  "Last Order Total",
  "Last Order ID",
  "Total Orders",
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
      const startedAt = Date.now();
      const enq = (s: string) => controller.enqueue(encoder.encode(s));
      try {
        // CSV header
        enq(csvLine(COLUMNS));

        // ---- Pass 1: orders (sorted desc) ----
        const lastOrderByCustomer = new Map<number, SlimOrder>();
        const totalOrdersByCustomer = new Map<number, number>();
        const lastOrderByGuestEmail = new Map<string, SlimOrder>();
        const totalOrdersByGuestEmail = new Map<string, number>();

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
            const slim: SlimOrder = {
              orderId: o.id,
              date: o.date_created,
              total: Number(o.total_inc_tax),
            };
            if (o.customer_id && o.customer_id > 0) {
              if (!lastOrderByCustomer.has(o.customer_id)) {
                lastOrderByCustomer.set(o.customer_id, slim);
              }
              totalOrdersByCustomer.set(
                o.customer_id,
                (totalOrdersByCustomer.get(o.customer_id) ?? 0) + 1,
              );
              continue;
            }
            const rawEmail = o.billing_address?.email?.trim().toLowerCase();
            if (!rawEmail) continue;
            guestOrders++;
            if (!lastOrderByGuestEmail.has(rawEmail)) {
              lastOrderByGuestEmail.set(rawEmail, {
                ...slim,
                firstName: o.billing_address?.first_name,
                lastName: o.billing_address?.last_name,
                company: o.billing_address?.company,
                phone: o.billing_address?.phone,
              });
            }
            totalOrdersByGuestEmail.set(
              rawEmail,
              (totalOrdersByGuestEmail.get(rawEmail) ?? 0) + 1,
            );
          }
          if (orders.length < PAGE_SIZE) break;
          orderPage++;
        }

        // ---- Pass 2: customers (registered) — emit as we go ----
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
            const last = lastOrderByCustomer.get(c.id);
            enq(
              csvLine([
                "registered",
                c.id,
                c.email ?? "",
                c.first_name ?? "",
                c.last_name ?? "",
                c.company ?? "",
                c.phone ?? "",
                last?.date ? last.date.slice(0, 10) : "",
                last ? last.total.toFixed(2) : "",
                last?.orderId ?? "",
                totalOrdersByCustomer.get(c.id) ?? 0,
                c.customer_group_id ?? "",
                c.date_created ? c.date_created.slice(0, 10) : "",
              ]),
            );
          }
          if (data.length < PAGE_SIZE) break;
          customerPage++;
        }

        // ---- Pass 3: guest customers — emit, skipping ones whose email
        // is already a registered customer (defensive dedup) ----
        let guestsEmitted = 0;
        for (const [email, last] of lastOrderByGuestEmail.entries()) {
          if (registeredEmails.has(email)) continue;
          guestsEmitted++;
          enq(
            csvLine([
              "guest",
              "",
              email,
              last.firstName ?? "",
              last.lastName ?? "",
              last.company ?? "",
              last.phone ?? "",
              last.date.slice(0, 10),
              last.total.toFixed(2),
              last.orderId,
              totalOrdersByGuestEmail.get(email) ?? 1,
              "",
              "",
            ]),
          );
        }

        controller.close();
        resolveStats({
          customers: customersScanned,
          guests: guestsEmitted,
          orders: ordersScanned,
          guestOrders,
          durationMs: Date.now() - startedAt,
        });
      } catch (err) {
        controller.error(err);
        rejectStats(err);
      }
    },
  });

  return { stream, statsPromise };
}
