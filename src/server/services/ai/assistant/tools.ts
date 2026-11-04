/**
 * The assistant's tools (2026-11-04). Every tool is read-only, bounded,
 * and gated by the permissions of the person asking: a tool the person may
 * not use is not offered to the model at all, and a call that slips
 * through is refused at run time. The model never touches the database or
 * a store directly; it asks, and the server answers with data it may see.
 *
 * Coverage (owner, 2026-11-04): the whole database, through curated tools
 * and, for the owner's account, a guarded read-only SQL tool; the public
 * website's copy; the BigCommerce storefronts through a read-only window on
 * their API; and the outside world through the model's own web search,
 * which is enabled in answer.ts.
 *
 * The canaries in tools.test.ts hold the read-only promise: no Prisma write
 * in this directory except the answer's own AiOutput row, and the only raw
 * statements are the read-only transaction's two SET lines.
 */
import { OrderStatus, type Prisma } from "@prisma/client";

import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { filterDashboardForAi } from "@/server/services/ai";
import { getDashboardData } from "@/server/services/dashboard";
import { listExceptions } from "@/server/services/exceptions";
import { countOrders, getOrderById, listOrders } from "@/server/services/orders";
import { SALE_ORDER_WHERE } from "@/server/services/orders/sale-rule";
import { listPricingCompetitors } from "@/server/services/pricing";
import { getProductSalesStats, getSalesOverview } from "@/server/services/sales-intelligence";

import { readBigCommerce } from "./bigcommerce-read";
import { BLOCKED_TABLES, guardReadOnlySql, toJsonSafe } from "./sql-guard";
import { readWebsiteSection, WEBSITE_SECTIONS } from "./website";

export type ToolContext = { userId: string; permissions: string[]; now: Date };

export type AssistantTool = {
  name: string;
  description: string;
  /** Every listed permission is required. */
  permissions: PermissionKey[];
  /** The SQL tools: the three AI context permissions, which together grant whole-data visibility. */
  requiresDatabaseAccess?: true;
  parameters: Record<string, unknown>;
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};

/**
 * Who may run SQL (owner, 2026-11-04: "the AI should have authority to run
 * SQL queries on the database as needed"). The three AI context permissions
 * are what let a person see financial, customer and investor data through
 * every other tool, so holding all three is the line; the queries themselves
 * are read-only SELECTs under the guard and a read-only transaction.
 */
const DATABASE_ACCESS: PermissionKey[] = [
  PERMISSIONS.AI_USE_FINANCIAL_CONTEXT,
  PERMISSIONS.AI_USE_CUSTOMER_CONTEXT,
  PERMISSIONS.AI_USE_INVESTOR_CONTEXT,
];

export function canQueryDatabase(permissions: string[]): boolean {
  return DATABASE_ACCESS.every((p) => permissions.includes(p));
}

export function canUseTool(tool: AssistantTool, permissions: string[]): boolean {
  if (!tool.permissions.every((p) => permissions.includes(p))) return false;
  if (tool.requiresDatabaseAccess && !canQueryDatabase(permissions)) return false;
  return true;
}

export function toolsForPermissions(permissions: string[]): AssistantTool[] {
  return ASSISTANT_TOOLS.filter((tool) => canUseTool(tool, permissions));
}

// ---------------------------------------------------------------------------
// Argument helpers
// ---------------------------------------------------------------------------

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;
const int = (v: unknown, fallback: number, max: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.trunc(n));
};
const bool = (v: unknown): boolean => v === true || v === "true";

/** A date range from `from`/`to` (YYYY-MM-DD) or `days` back from now (default 30). */
function rangeFromArgs(args: Record<string, unknown>, now: Date): { from: Date; to: Date } {
  const to = str(args.to) ? new Date(`${str(args.to)}T23:59:59.999Z`) : now;
  const fromArg = str(args.from) ? new Date(`${str(args.from)}T00:00:00.000Z`) : null;
  if (fromArg && !Number.isNaN(fromArg.getTime()) && !Number.isNaN(to.getTime())) {
    return { from: fromArg, to };
  }
  const days = int(args.days, 30, 3660);
  return { from: new Date(now.getTime() - days * 86_400_000), to: now };
}

const DATE_RANGE_PROPERTIES = {
  from: { type: "string", description: "Start date, YYYY-MM-DD. With `to`, overrides `days`." },
  to: { type: "string", description: "End date, YYYY-MM-DD (inclusive)." },
  days: {
    type: "integer",
    description: "Days back from today when no dates are given. Default 30.",
  },
  storeId: { type: "string", description: "Limit to one store (see list_stores)." },
  divisionId: { type: "string", description: "Limit to one division." },
};

function customerLabel(c: {
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}): string {
  if (c.companyName) return c.companyName;
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  return name || c.email || "Unknown";
}

// ---------------------------------------------------------------------------
// The tools
// ---------------------------------------------------------------------------

export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    name: "list_stores",
    description:
      "The storefronts and divisions the Command Center tracks, with the ids other tools take.",
    permissions: [PERMISSIONS.AI_USE],
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async () => {
      const [stores, divisions] = await Promise.all([
        prisma.store.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, platform: true, divisionId: true },
        }),
        prisma.division.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, code: true, isActive: true },
        }),
      ]);
      return { stores, divisions };
    },
  },

  {
    name: "dashboard_snapshot",
    description:
      "The executive dashboard: open-period financial KPIs against the prior period, order queue counts, active exceptions, top and low-margin products (90 days), recent campaigns and priority tasks. Redacted to the person's permissions.",
    permissions: [PERMISSIONS.AI_USE],
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async (_args, ctx) => {
      const raw = await getDashboardData();
      const { data, redactedSections } = filterDashboardForAi(raw, ctx.permissions);
      return { dashboard: data, redactedSections };
    },
  },

  {
    name: "sales_overview",
    description:
      "Revenue, order count, units and gross margin for a date range, optionally one store or division. Cancelled, refunded and declined orders are excluded. Use for any 'how are sales' question.",
    permissions: [PERMISSIONS.AI_USE_FINANCIAL_CONTEXT],
    parameters: { type: "object", properties: DATE_RANGE_PROPERTIES, additionalProperties: false },
    run: async (args, ctx) => {
      const range = rangeFromArgs(args, ctx.now);
      const overview = await getSalesOverview(range, {
        storeId: str(args.storeId),
        divisionId: str(args.divisionId),
      });
      return { range, overview };
    },
  },

  {
    name: "top_products",
    description:
      "Products ranked by revenue or units over a date range, with margin where cost is known. Only order lines matched to a product count.",
    permissions: [PERMISSIONS.PRODUCTS_VIEW],
    parameters: {
      type: "object",
      properties: {
        ...DATE_RANGE_PROPERTIES,
        by: {
          type: "string",
          enum: ["revenue", "units"],
          description: "Ranking. Default revenue.",
        },
        limit: { type: "integer", description: "How many, at most 50. Default 10." },
      },
      additionalProperties: false,
    },
    run: async (args, ctx) => {
      const range = rangeFromArgs(args, ctx.now);
      const limit = int(args.limit, 10, 50);
      const stats = await getProductSalesStats(
        range,
        { storeId: str(args.storeId), divisionId: str(args.divisionId) },
        { limit: Math.max(limit, 50) },
      );
      const by = str(args.by) === "units" ? "unitsSold" : "revenue";
      return {
        range,
        products: [...stats].sort((a, b) => b[by] - a[by]).slice(0, limit),
      };
    },
  },

  {
    name: "search_customers",
    description:
      "Find customers by name, company or email, or rank them by lifetime value, order count or last order. Returns at most 50 with their lifetime figures (sales only; cancelled and refunded orders excluded).",
    permissions: [PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.AI_USE_CUSTOMER_CONTEXT],
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Matches company, first or last name, or email." },
        customerType: {
          type: "string",
          enum: ["retail", "b2b", "clinic", "institutional", "supplier", "investor", "unknown"],
        },
        storeId: { type: "string" },
        lapsedDays: {
          type: "integer",
          description: "Only customers whose last order is older than this many days.",
        },
        minLifetimeValue: { type: "number" },
        sort: { type: "string", enum: ["lifetimeValue", "orderCount", "lastOrderAt"] },
        limit: { type: "integer", description: "At most 50. Default 20." },
      },
      additionalProperties: false,
    },
    run: async (args, ctx) => {
      const search = str(args.search);
      const lapsedDays =
        typeof args.lapsedDays === "number" ? args.lapsedDays : Number(args.lapsedDays);
      const minLtv = Number(args.minLifetimeValue);
      const where: Prisma.CustomerWhereInput = {
        deletedAt: null,
        ...(str(args.storeId) ? { storeId: str(args.storeId) } : {}),
        ...(str(args.customerType)
          ? { customerType: str(args.customerType) as Prisma.CustomerWhereInput["customerType"] }
          : {}),
        ...(Number.isFinite(lapsedDays) && lapsedDays > 0
          ? { lastOrderAt: { lt: new Date(ctx.now.getTime() - lapsedDays * 86_400_000) } }
          : {}),
        ...(Number.isFinite(minLtv) && minLtv > 0 ? { lifetimeValue: { gte: minLtv } } : {}),
        ...(search
          ? {
              OR: [
                { companyName: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const sort = str(args.sort) ?? "lifetimeValue";
      const rows = await prisma.customer.findMany({
        where,
        orderBy: { [sort]: "desc" },
        take: int(args.limit, 20, 50),
        select: {
          id: true,
          companyName: true,
          firstName: true,
          lastName: true,
          email: true,
          customerType: true,
          consentStatus: true,
          lifetimeValue: true,
          orderCount: true,
          firstOrderAt: true,
          lastOrderAt: true,
          store: { select: { name: true } },
        },
      });
      return rows.map((c) => ({
        id: c.id,
        name: customerLabel(c),
        email: c.email,
        type: c.customerType,
        consent: c.consentStatus,
        store: c.store?.name ?? null,
        lifetimeValue: Number(c.lifetimeValue),
        orderCount: c.orderCount,
        firstOrderAt: c.firstOrderAt,
        lastOrderAt: c.lastOrderAt,
      }));
    },
  },

  {
    name: "customer_detail",
    description:
      "One customer by id or email: profile, lifetime figures, their 20 most recent orders and the products they buy most.",
    permissions: [PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.AI_USE_CUSTOMER_CONTEXT],
    parameters: {
      type: "object",
      properties: { id: { type: "string" }, email: { type: "string" } },
      additionalProperties: false,
    },
    run: async (args) => {
      const id = str(args.id);
      const email = str(args.email);
      if (!id && !email) throw new Error("Give a customer id or email.");
      const customer = await prisma.customer.findFirst({
        where: id ? { id } : { email: { equals: email, mode: "insensitive" } },
        select: {
          id: true,
          companyName: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          customerType: true,
          consentStatus: true,
          lifetimeValue: true,
          orderCount: true,
          firstOrderAt: true,
          lastOrderAt: true,
          store: { select: { name: true } },
          orders: {
            orderBy: { orderDate: "desc" },
            take: 20,
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
      if (!customer) throw new Error("No such customer.");
      const lines = await prisma.orderItem.groupBy({
        by: ["productName"],
        where: { order: { customerId: customer.id, ...SALE_ORDER_WHERE } },
        _sum: { quantity: true, lineSubtotal: true },
        orderBy: { _sum: { lineSubtotal: "desc" } },
        take: 10,
      });
      return {
        ...customer,
        name: customerLabel(customer),
        lifetimeValue: Number(customer.lifetimeValue),
        orders: customer.orders.map((o) => ({ ...o, grandTotal: Number(o.grandTotal) })),
        topProducts: lines.map((l) => ({
          product: l.productName,
          units: l._sum.quantity ?? 0,
          revenue: Number(l._sum.lineSubtotal ?? 0),
        })),
      };
    },
  },

  {
    name: "product_top_customers",
    description:
      "The customers who bought a product most over a date range, by revenue, with units and order counts. Find the product id with search_products or top_products first.",
    permissions: [PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.AI_USE_CUSTOMER_CONTEXT],
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string" },
        ...DATE_RANGE_PROPERTIES,
        limit: { type: "integer", description: "At most 25. Default 5." },
      },
      required: ["productId"],
      additionalProperties: false,
    },
    run: async (args, ctx) => {
      const productId = str(args.productId);
      if (!productId) throw new Error("productId is required.");
      const range = rangeFromArgs(args, ctx.now);
      const lines = await prisma.orderItem.findMany({
        where: {
          productId,
          order: {
            orderDate: { gte: range.from, lte: range.to },
            customerId: { not: null },
            ...(str(args.storeId) ? { storeId: str(args.storeId) } : {}),
            ...SALE_ORDER_WHERE,
          },
        },
        take: 5000,
        select: {
          quantity: true,
          lineSubtotal: true,
          order: {
            select: {
              id: true,
              customer: {
                select: {
                  id: true,
                  companyName: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      const byCustomer = new Map<
        string,
        { customerId: string; name: string; revenue: number; units: number; orders: Set<string> }
      >();
      for (const line of lines) {
        const c = line.order.customer;
        if (!c) continue;
        const entry = byCustomer.get(c.id) ?? {
          customerId: c.id,
          name: customerLabel(c),
          revenue: 0,
          units: 0,
          orders: new Set<string>(),
        };
        entry.revenue += Number(line.lineSubtotal);
        entry.units += line.quantity;
        entry.orders.add(line.order.id);
        byCustomer.set(c.id, entry);
      }
      return {
        range,
        linesConsidered: lines.length,
        customers: [...byCustomer.values()]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, int(args.limit, 5, 25))
          .map((e) => ({
            ...e,
            revenue: Math.round(e.revenue * 100) / 100,
            orders: e.orders.size,
          })),
      };
    },
  },

  {
    name: "search_orders",
    description:
      "Orders, newest first, 50 per page: by status, store, division, exception flag, or a search on order number or customer. Returns the page and the total count.",
    permissions: [PERMISSIONS.ORDERS_VIEW],
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: Object.values(OrderStatus) },
        search: {
          type: "string",
          description: "Order number, customer email, company or last name.",
        },
        storeId: { type: "string" },
        divisionId: { type: "string" },
        exceptionsOnly: { type: "boolean" },
        page: { type: "integer", description: "1-based. Default 1." },
      },
      additionalProperties: false,
    },
    run: async (args) => {
      const status = str(args.status);
      const filters = {
        status:
          status && (Object.values(OrderStatus) as string[]).includes(status)
            ? (status as OrderStatus)
            : undefined,
        search: str(args.search),
        storeId: str(args.storeId),
        divisionId: str(args.divisionId),
        exceptionsOnly: bool(args.exceptionsOnly),
        page: int(args.page, 1, 1000),
      };
      const [orders, total] = await Promise.all([listOrders(filters), countOrders(filters)]);
      return { total, page: filters.page, orders };
    },
  },

  {
    name: "order_detail",
    description:
      "One order by id or order number: header, customer, line items with costs, shipments.",
    permissions: [PERMISSIONS.ORDERS_VIEW],
    parameters: {
      type: "object",
      properties: { id: { type: "string" }, orderNumber: { type: "string" } },
      additionalProperties: false,
    },
    run: async (args) => {
      const id = str(args.id);
      const orderNumber = str(args.orderNumber);
      if (!id && !orderNumber) throw new Error("Give an order id or order number.");
      const found = id
        ? { id }
        : await prisma.order.findFirst({
            where: { orderNumber: orderNumber! },
            select: { id: true },
          });
      if (!found) throw new Error("No such order.");
      const order = await getOrderById(found.id);
      if (!order) throw new Error("No such order.");
      return order;
    },
  },

  {
    name: "search_products",
    description:
      "Products by name, SKU or brand, with store, status, image count, description length and up to three variants' prices. At most 50.",
    permissions: [PERMISSIONS.PRODUCTS_VIEW],
    parameters: {
      type: "object",
      properties: {
        search: { type: "string" },
        storeId: { type: "string" },
        missingImages: { type: "boolean", description: "Only products with no store images." },
        limit: { type: "integer", description: "At most 50. Default 20." },
      },
      additionalProperties: false,
    },
    run: async (args) => {
      const search = str(args.search);
      const products = await prisma.product.findMany({
        where: {
          ...(str(args.storeId) ? { storeId: str(args.storeId) } : {}),
          ...(bool(args.missingImages) ? { imageCount: 0 } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { sku: { contains: search, mode: "insensitive" } },
                  { brand: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { name: "asc" },
        take: int(args.limit, 20, 50),
        select: {
          id: true,
          name: true,
          sku: true,
          brand: true,
          status: true,
          imageCount: true,
          descriptionLength: true,
          isFeatured: true,
          store: { select: { name: true } },
          variants: { take: 3, select: { sku: true, price: true, salePrice: true } },
        },
      });
      return products.map((p) => ({
        ...p,
        store: p.store?.name ?? null,
        variants: p.variants.map((v) => ({
          sku: v.sku,
          price: Number(v.price),
          salePrice: v.salePrice == null ? null : Number(v.salePrice),
        })),
      }));
    },
  },

  {
    name: "open_exceptions",
    description:
      "Active operating exceptions (top 30 by severity and age): type, entity, age, assignee.",
    permissions: [PERMISSIONS.ORDERS_VIEW],
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async () => {
      const rows = await listExceptions({ status: "active" });
      return rows.slice(0, 30).map((r) => ({
        id: r.id,
        type: r.exceptionType,
        severity: r.severity,
        status: r.status,
        title: r.title,
        entityType: r.entityType,
        entityId: r.entityId,
        ageHours: r.ageHours,
        assigned: r.assignedTo?.name ?? r.assignedTo?.email ?? null,
      }));
    },
  },

  {
    name: "tasks_and_approvals",
    description:
      "Open tasks (by due date, 30) and pending approvals (20). Say `mine: true` for the asking person's own tasks only.",
    permissions: [PERMISSIONS.TASKS_VIEW],
    parameters: {
      type: "object",
      properties: { mine: { type: "boolean" } },
      additionalProperties: false,
    },
    run: async (args, ctx) => {
      const [tasks, approvals] = await Promise.all([
        prisma.task.findMany({
          where: {
            status: { in: ["open", "in_progress", "blocked", "awaiting_approval"] },
            ...(bool(args.mine) ? { assignedToId: ctx.userId } : {}),
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
          take: 30,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: { select: { name: true, email: true } },
          },
        }),
        prisma.approval.findMany({
          where: { status: "pending" },
          orderBy: { createdAt: "asc" },
          take: 20,
          select: { id: true, approvalType: true, status: true, createdAt: true },
        }),
      ]);
      return {
        now: ctx.now,
        tasks: tasks.map((t) => ({
          ...t,
          assignedTo: t.assignedTo?.name ?? t.assignedTo?.email ?? null,
          overdue: t.dueDate != null && t.dueDate < ctx.now,
        })),
        pendingApprovals: approvals,
      };
    },
  },

  {
    name: "financial_summary",
    description:
      "The imported financial summaries by period (revenue, COGS, gross profit and margin, operating expenses and income, EBITDA, cash, working capital), newest first, consolidated or by division. QuickBooks is the source; these are the Command Center's imported figures.",
    permissions: [PERMISSIONS.FINANCIALS_VIEW_SUMMARY, PERMISSIONS.AI_USE_FINANCIAL_CONTEXT],
    parameters: {
      type: "object",
      properties: {
        divisionId: { type: "string", description: "One division; omit for every row." },
        periods: { type: "integer", description: "How many periods back, at most 36. Default 12." },
      },
      additionalProperties: false,
    },
    run: async (args) => {
      const rows = await prisma.financialSummary.findMany({
        where: str(args.divisionId) ? { divisionId: str(args.divisionId) } : {},
        orderBy: { financialPeriod: { startDate: "desc" } },
        take: int(args.periods, 12, 36) * 4,
        include: {
          financialPeriod: { select: { name: true, startDate: true, endDate: true, status: true } },
          division: { select: { name: true, code: true } },
        },
      });
      return rows.map((r) => toJsonSafe(r));
    },
  },

  {
    name: "marketing_performance",
    description:
      "Campaigns sent in the last 90 days with their latest metrics (aggregates, no contacts).",
    permissions: [PERMISSIONS.MARKETING_VIEW],
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async (_args, ctx) => {
      const since = new Date(ctx.now.getTime() - 90 * 86_400_000);
      const campaigns = await prisma.campaign.findMany({
        where: { status: "sent", sentAt: { gte: since } },
        orderBy: { sentAt: "desc" },
        take: 20,
        include: { metrics: { orderBy: { measuredAt: "desc" }, take: 1 } },
      });
      return campaigns.map((c) => {
        const m = c.metrics[0];
        return {
          name: c.name,
          type: c.campaignType,
          sentAt: c.sentAt,
          sent: m?.sentCount ?? null,
          opens: m?.openCount ?? null,
          clicks: m?.clickCount ?? null,
          conversions: m?.conversionCount ?? null,
          attributedRevenue: m?.attributedRevenue == null ? null : Number(m.attributedRevenue),
          unsubscribes: m?.unsubscribeCount ?? null,
        };
      });
    },
  },

  {
    name: "competitor_prices",
    description:
      "The competitors Pricing Intelligence tracks and, for a product, the latest observed competitor prices against our floor price.",
    permissions: [PERMISSIONS.PRICING_VIEW],
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Omit to list the competitors only." },
      },
      additionalProperties: false,
    },
    run: async (args) => {
      const competitors = await listPricingCompetitors();
      const productId = str(args.productId);
      if (!productId) return { competitors };
      const observations = await prisma.competitorPriceObservation.findMany({
        where: { pricingRunItem: { productId }, status: "valid" },
        orderBy: { checkedAt: "desc" },
        take: 30,
        select: {
          competitorUrl: true,
          observedRegularPrice: true,
          observedSalePrice: true,
          observedEffectivePrice: true,
          currency: true,
          availability: true,
          checkedAt: true,
          competitor: { select: { name: true } },
          pricingRunItem: { select: { floorPrice: true, createdAt: true } },
        },
      });
      return { competitors, observations: observations.map((o) => toJsonSafe(o)) };
    },
  },

  {
    name: "website_content",
    description: `What the public website LifeSupplyHealth.com says, by section. Sections: ${WEBSITE_SECTIONS.join(", ")}.`,
    permissions: [PERMISSIONS.AI_USE],
    parameters: {
      type: "object",
      properties: { section: { type: "string", enum: [...WEBSITE_SECTIONS] } },
      required: ["section"],
      additionalProperties: false,
    },
    run: async (args) => {
      const result = await readWebsiteSection(str(args.section) ?? "");
      if (!result.ok) throw new Error(result.reason);
      return result;
    },
  },

  {
    name: "bigcommerce_read",
    description:
      "Read a storefront's BigCommerce API directly (GET only) for what is live right now: /v2/orders, /v2/orders/{id}, /v2/orders/{id}/products, /v2/orders/count, /v3/catalog/products, /v3/catalog/products/{id}, /v3/catalog/products/{id}/variants, /v3/catalog/categories, /v3/catalog/brands, /v3/customers, /v3/inventory/items, /v3/promotions, /v2/store. Pages are capped at 50; pass BigCommerce's own query parameters (e.g. status_id, min_date_created, keyword, sku, page).",
    permissions: [PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS],
    parameters: {
      type: "object",
      properties: {
        storeId: { type: "string", description: "From list_stores." },
        path: { type: "string" },
        query: { type: "object", additionalProperties: true },
      },
      required: ["storeId", "path"],
      additionalProperties: false,
    },
    run: async (args) => {
      const storeId = str(args.storeId);
      const path = str(args.path);
      if (!storeId || !path) throw new Error("storeId and path are required.");
      const query =
        args.query && typeof args.query === "object" ? (args.query as Record<string, unknown>) : {};
      const result = await readBigCommerce({ storeId, path, query });
      if (!result.ok) throw new Error(result.reason);
      return result;
    },
  },

  {
    name: "database_schema",
    description:
      "The database's tables and columns (public schema), so a database_query can be written. Credential and user tables are not listed.",
    permissions: [PERMISSIONS.AI_USE],
    requiresDatabaseAccess: true,
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async () => {
      const rows = await prisma.$queryRaw<
        { table_name: string; column_name: string; data_type: string }[]
      >`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position`;
      const tables: Record<string, string[]> = {};
      for (const row of rows) {
        if ((BLOCKED_TABLES as readonly string[]).includes(row.table_name)) continue;
        (tables[row.table_name] ??= []).push(`${row.column_name} ${row.data_type}`);
      }
      return {
        note: "Column names are camelCase and must be double-quoted in SQL. Sales exclude orders with status cancelled or refunded and payment failed or refunded.",
        tables,
      };
    },
  },

  {
    name: "database_query",
    description:
      "Run one read-only SELECT against the Command Center database (Postgres): joins, groupings, history, anything the curated tools do not answer directly. Rows are capped at 200 and the statement at 10 seconds, so aggregate in SQL. Quote camelCase columns. Use database_schema first in a conversation.",
    permissions: [PERMISSIONS.AI_USE],
    requiresDatabaseAccess: true,
    parameters: {
      type: "object",
      properties: { sql: { type: "string" } },
      required: ["sql"],
      additionalProperties: false,
    },
    run: async (args) => {
      const guard = guardReadOnlySql(str(args.sql) ?? "");
      if (!guard.ok) throw new Error(guard.reason);
      const rows = await prisma.$transaction(
        async (tx) => {
          await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
          await tx.$executeRawUnsafe("SET LOCAL statement_timeout = 10000");
          return tx.$queryRawUnsafe<unknown[]>(guard.sql);
        },
        { timeout: 15_000 },
      );
      return { rowCount: rows.length, rows: toJsonSafe(rows) };
    },
  },
];

export type ToolRunResult = { ok: true; result: unknown } | { ok: false; error: string };

/** Runs a tool for the person, refusing one they may not use. */
export async function runAssistantTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolRunResult> {
  const tool = ASSISTANT_TOOLS.find((t) => t.name === name);
  if (!tool) return { ok: false, error: `Unknown tool "${name}".` };
  if (!canUseTool(tool, ctx.permissions)) {
    return { ok: false, error: `The person asking may not use "${name}".` };
  }
  try {
    return { ok: true, result: await tool.run(args, ctx) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "The tool failed." };
  }
}
