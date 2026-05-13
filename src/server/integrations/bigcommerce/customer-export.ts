/**
 * Live BigCommerce customer export.
 *
 * Pulls customers + their most recent order directly from the BC API for a
 * specific connection (storeHash + apiToken in the vault). Returns rows ready
 * to render into XLSX/CSV — never persists to the DB. Designed for one-shot
 * "give me a list" requests where the operator hasn't run a sync yet.
 *
 * Strategy:
 *   1. Page through /v3/customers (250/page)        — emails + names
 *   2. Page through /v2/orders sorted desc (250/page) — last order per customer
 *   3. Join in-memory by customer_id; emit one row per customer.
 *
 * Hard cap of 25,000 customers to keep memory bounded. If a real store
 * needs more, switch to a stream-to-disk approach.
 */

import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";
import { prisma } from "@/server/db/client";

const BC_BASE = "https://api.bigcommerce.com";
const PAGE_SIZE = 250;
const HARD_CAP_CUSTOMERS = 25_000;
const HARD_CAP_ORDERS = 100_000;

export type CustomerExportRow = {
  /** BC numeric customer id, or null for guest checkouts. */
  customerId: number | null;
  /** "registered" if from /v3/customers, "guest" if synthesized from orders. */
  source: "registered" | "guest";
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  customerGroupId: number | null;
  registeredAt: string | null;
  lastOrderDate: string | null;
  lastOrderTotal: number | null;
  lastOrderId: number | null;
  totalOrders: number;
};

export type CustomerExportResult =
  | {
      ok: true;
      rows: CustomerExportRow[];
      stats: {
        /** Registered customers from /v3/customers. */
        customers: number;
        /** Unique guest emails synthesized from /v2/orders where customer_id = 0. */
        guests: number;
        /** Total orders scanned. */
        orders: number;
        /** Subset of orders that were guest checkouts. */
        guestOrders: number;
        durationMs: number;
        truncated: boolean;
      };
    }
  | {
      ok: false;
      status: number | "network" | "missing_credential";
      message: string;
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
  /** Present on v2 orders by default; some orders (POS, abandoned) may omit. */
  billing_address?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    phone?: string;
  };
};

type BcCustomersV3Response = {
  data: BcCustomer[];
  meta?: { pagination?: { total: number; total_pages: number; current_page: number } };
};

async function bcFetch(
  url: string,
  apiToken: string,
): Promise<{ ok: true; status: number; body: string } | { ok: false; status: number | "network"; body: string }> {
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

export async function exportBigCommerceCustomersByConnection(
  connectionName: string,
): Promise<CustomerExportResult> {
  const startedAt = Date.now();

  const conn = await prisma.integrationConnection.findFirst({
    where: { integrationType: "bigcommerce", name: connectionName },
    select: { id: true },
  });
  if (!conn) return { ok: false, status: "missing_credential", message: "Integration not found" };

  const bundle = await resolveCredentialsBundleForConnection(conn.id);
  if (!bundle?.storeHash || !bundle?.apiToken) {
    return {
      ok: false,
      status: "missing_credential",
      message: "Both storeHash and apiToken must be configured.",
    };
  }
  const { storeHash, apiToken } = bundle;
  const storeRoot = `${BC_BASE}/stores/${encodeURIComponent(storeHash)}`;

  // ---- Step 1: page through customers (v3) ----
  const customers: Map<number, BcCustomer> = new Map();
  let customerPage = 1;
  let customersTruncated = false;
  while (customers.size < HARD_CAP_CUSTOMERS) {
    const url = `${storeRoot}/v3/customers?limit=${PAGE_SIZE}&page=${customerPage}`;
    const r = await bcFetch(url, apiToken);
    if (!r.ok) {
      return {
        ok: false,
        status: r.status,
        message: `Customers page ${customerPage}: ${r.body || `HTTP ${r.status}`}`,
      };
    }
    const parsed = JSON.parse(r.body) as BcCustomersV3Response;
    if (!parsed.data || parsed.data.length === 0) break;
    for (const c of parsed.data) {
      if (customers.size >= HARD_CAP_CUSTOMERS) {
        customersTruncated = true;
        break;
      }
      customers.set(c.id, c);
    }
    if (customersTruncated) break;
    if (parsed.data.length < PAGE_SIZE) break;
    customerPage++;
  }

  // ---- Step 2: page through orders (v2), keeping latest per customer ----
  // BC v2 orders supports `sort=date_created:desc`. We walk pages until we
  // either exhaust them, hit our hard cap, or finish covering every customer.
  // Guest checkouts have customer_id = 0 — we track them separately keyed by
  // billing email so they show up in the export too.
  const lastOrderByCustomer = new Map<number, BcOrder>();
  const totalOrdersByCustomer = new Map<number, number>();
  const lastOrderByGuestEmail = new Map<string, BcOrder>();
  const totalOrdersByGuestEmail = new Map<string, number>();
  // Map of registered customer id → set of emails we've seen on their orders.
  // Lets us skip guest-emit when an order's billing email actually belongs to
  // a registered customer (defensive — same human, two records).
  const registeredEmails = new Set<string>();
  for (const c of customers.values()) {
    if (c.email) registeredEmails.add(c.email.toLowerCase());
  }

  let orderPage = 1;
  let ordersScanned = 0;
  let ordersTruncated = false;
  let guestOrders = 0;
  while (ordersScanned < HARD_CAP_ORDERS) {
    const url = `${storeRoot}/v2/orders?limit=${PAGE_SIZE}&page=${orderPage}&sort=date_created:desc`;
    const r = await bcFetch(url, apiToken);
    if (!r.ok) {
      // 204 No Content is BC's way of saying "no more orders" — treat as end.
      if (r.status === 404) break;
      return {
        ok: false,
        status: r.status,
        message: `Orders page ${orderPage}: ${r.body || `HTTP ${r.status}`}`,
      };
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
      if (ordersScanned > HARD_CAP_ORDERS) {
        ordersTruncated = true;
        break;
      }
      // Sorted desc, so first sighting is the most recent.
      if (o.customer_id && o.customer_id > 0) {
        if (!lastOrderByCustomer.has(o.customer_id)) lastOrderByCustomer.set(o.customer_id, o);
        totalOrdersByCustomer.set(
          o.customer_id,
          (totalOrdersByCustomer.get(o.customer_id) ?? 0) + 1,
        );
        continue;
      }
      // Guest order — key by billing email if present.
      const rawEmail = o.billing_address?.email?.trim().toLowerCase();
      if (!rawEmail) continue;
      if (registeredEmails.has(rawEmail)) continue; // covered by registered row
      guestOrders++;
      if (!lastOrderByGuestEmail.has(rawEmail)) lastOrderByGuestEmail.set(rawEmail, o);
      totalOrdersByGuestEmail.set(
        rawEmail,
        (totalOrdersByGuestEmail.get(rawEmail) ?? 0) + 1,
      );
    }
    if (ordersTruncated) break;
    if (orders.length < PAGE_SIZE) break;
    orderPage++;
  }

  // ---- Step 3: join + emit ----
  const rows: CustomerExportRow[] = [];
  for (const c of customers.values()) {
    const last = lastOrderByCustomer.get(c.id) ?? null;
    rows.push({
      customerId: c.id,
      source: "registered",
      email: c.email ?? "",
      firstName: c.first_name ?? "",
      lastName: c.last_name ?? "",
      company: c.company ?? "",
      phone: c.phone ?? "",
      customerGroupId: c.customer_group_id ?? null,
      registeredAt: c.date_created ?? null,
      lastOrderDate: last?.date_created ?? null,
      lastOrderTotal: last ? Number(last.total_inc_tax) : null,
      lastOrderId: last?.id ?? null,
      totalOrders: totalOrdersByCustomer.get(c.id) ?? 0,
    });
  }
  for (const [email, last] of lastOrderByGuestEmail.entries()) {
    rows.push({
      customerId: null,
      source: "guest",
      email,
      firstName: last.billing_address?.first_name ?? "",
      lastName: last.billing_address?.last_name ?? "",
      company: last.billing_address?.company ?? "",
      phone: last.billing_address?.phone ?? "",
      customerGroupId: null,
      registeredAt: null,
      lastOrderDate: last.date_created,
      lastOrderTotal: Number(last.total_inc_tax),
      lastOrderId: last.id,
      totalOrders: totalOrdersByGuestEmail.get(email) ?? 1,
    });
  }

  // Sort: most-recently-transacted first; never-transacted last.
  rows.sort((a, b) => {
    if (a.lastOrderDate && b.lastOrderDate) return b.lastOrderDate.localeCompare(a.lastOrderDate);
    if (a.lastOrderDate) return -1;
    if (b.lastOrderDate) return 1;
    return a.email.localeCompare(b.email);
  });

  return {
    ok: true,
    rows,
    stats: {
      customers: customers.size,
      guests: lastOrderByGuestEmail.size,
      orders: ordersScanned,
      guestOrders,
      durationMs: Date.now() - startedAt,
      truncated: customersTruncated || ordersTruncated,
    },
  };
}
