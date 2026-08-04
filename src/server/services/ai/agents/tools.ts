/**
 * Agent tool registry (Phase 10 — docs/19 §10, docs/09 §17/§18).
 *
 * Every tool is a READ-ONLY data collector executed server-side BEFORE the
 * model call — the model never chooses or invokes tools itself, it only
 * receives their output as fenced untrusted data. Each tool declares the
 * permission the triggering user must hold; a missing permission means the
 * tool is SKIPPED and the skip is recorded on the run (mirroring the
 * dashboard-redaction approach) rather than silently widening access.
 *
 * The guardrails test suite asserts this module performs zero prisma writes.
 */
import { prisma } from "@/server/db/client";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { getDashboardData } from "@/server/services/dashboard";
import { filterDashboardForAi } from "@/server/services/ai";
import { getOperationsSummary } from "@/server/services/operations";
import { listExceptions } from "@/server/services/exceptions";
import { closeChecklistSummary } from "@/server/services/finance/close-tasks";
import { getBudgetVarianceForPeriod } from "@/server/services/finance/budgets";

export type ToolContext = {
  userId: string;
  permissions: string[];
};

export type ToolResult = {
  data: unknown;
  /** Where the data came from — stored on the run + shown in the UI. */
  source: string;
};

export type AgentTool = {
  key: string;
  description: string;
  permission: PermissionKey;
  /** All registry tools are read-only; the flag is asserted by tests. */
  readonly: true;
  collect: (ctx: ToolContext, params: Record<string, string>) => Promise<ToolResult>;
};

export const AGENT_TOOLS: Record<string, AgentTool> = {
  dashboard_summary: {
    key: "dashboard_summary",
    description:
      "Executive dashboard KPIs, trend, exceptions, and priorities (permission-redacted).",
    permission: PERMISSIONS.AI_USE,
    readonly: true,
    collect: async (ctx) => {
      const raw = await getDashboardData();
      // Same redaction rules as the AI analyst — agents never see more than
      // the triggering user is allowed to see.
      const { data, redactedSections } = filterDashboardForAi(raw, ctx.permissions);
      return {
        data: { dashboard: data, redactedSections },
        source: "dashboard service (redacted to user permissions)",
      };
    },
  },

  operations_summary: {
    key: "operations_summary",
    description: "Deterministic daily operations summary: delayed orders, exceptions, task load.",
    permission: PERMISSIONS.DASHBOARD_OPERATIONS_VIEW,
    readonly: true,
    collect: async () => ({
      data: await getOperationsSummary(),
      source: "operations summary (delay rules + exception + task queues)",
    }),
  },

  open_exceptions: {
    key: "open_exceptions",
    description: "Active exceptions (top 30 by severity/age) with type, entity, and age.",
    permission: PERMISSIONS.ORDERS_VIEW,
    readonly: true,
    collect: async () => {
      const rows = await listExceptions({ status: "active" });
      return {
        data: rows.slice(0, 30).map((r) => ({
          id: r.id,
          type: r.exceptionType,
          severity: r.severity,
          status: r.status,
          title: r.title,
          entityType: r.entityType,
          entityId: r.entityId,
          ageHours: r.ageHours,
          recurringKey: r.recurringKey,
          assigned: r.assignedTo?.name ?? r.assignedTo?.email ?? null,
        })),
        source: "exceptions table (active, top 30)",
      };
    },
  },

  low_margin_products: {
    key: "low_margin_products",
    description: "Lowest-margin products over the last 90 days of order items.",
    permission: PERMISSIONS.PRODUCTS_VIEW,
    readonly: true,
    collect: async (ctx) => {
      const raw = await getDashboardData();
      const { data } = filterDashboardForAi(raw, ctx.permissions);
      return {
        data: { lowMarginProducts: data.lowMarginProducts, topProducts: data.topProducts },
        source: "dashboard product aggregates (90-day order items)",
      };
    },
  },

  marketing_performance: {
    key: "marketing_performance",
    description: "Campaigns sent in the last 90 days with their latest metrics (no contact PII).",
    permission: PERMISSIONS.MARKETING_VIEW,
    readonly: true,
    collect: async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const campaigns = await prisma.campaign.findMany({
        where: { status: "sent", sentAt: { gte: since } },
        orderBy: { sentAt: "desc" },
        take: 20,
        include: { metrics: { orderBy: { measuredAt: "desc" }, take: 1 } },
      });
      return {
        data: campaigns.map((c) => {
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
        }),
        source: "campaigns + latest campaign metrics (90 days, aggregates only)",
      };
    },
  },

  reactivation_overview: {
    key: "reactivation_overview",
    description: "Customer reactivation aggregates: eligible counts by consent status (no PII).",
    permission: PERMISSIONS.AI_USE_CUSTOMER_CONTEXT,
    readonly: true,
    collect: async () => {
      const [byConsent, lapsed] = await Promise.all([
        prisma.customer.groupBy({
          by: ["consentStatus"],
          where: { deletedAt: null },
          _count: { _all: true },
        }),
        prisma.customer.count({
          where: {
            deletedAt: null,
            lastOrderAt: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);
      return {
        data: {
          customersByConsentStatus: byConsent.map((g) => ({
            consentStatus: g.consentStatus,
            count: g._count._all,
          })),
          lapsedOverOneYear: lapsed,
        },
        source: "customer aggregates (counts only, no identities)",
      };
    },
  },

  order_context: {
    key: "order_context",
    description:
      "One order's status, timeline, and exception context for service drafting (minimal PII).",
    permission: PERMISSIONS.ORDERS_VIEW,
    readonly: true,
    collect: async (_ctx, params) => {
      const orderId = params.orderId?.trim();
      if (!orderId) throw new Error("order_context requires an orderId parameter.");
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          status: true,
          fulfillmentStatus: true,
          paymentStatus: true,
          orderDate: true,
          grandTotal: true,
          refundedTotal: true,
          currency: true,
          exceptionStatus: true,
          exceptionReason: true,
          store: { select: { name: true } },
          // First name only — enough to draft a greeting, no full identity.
          customer: { select: { firstName: true, customerType: true } },
          shipments: {
            select: { shippedAt: true, carrier: true, trackingNumber: true, itemsCount: true },
          },
          items: {
            take: 10,
            select: { productName: true, quantity: true },
          },
        },
      });
      if (!order) throw new Error(`Order ${orderId} not found.`);
      return {
        data: {
          ...order,
          grandTotal: Number(order.grandTotal),
          refundedTotal: Number(order.refundedTotal),
        },
        source: `order ${order.orderNumber} (status, shipments, items; first name only)`,
      };
    },
  },

  close_status: {
    key: "close_status",
    description:
      "Monthly close status: latest period state, close-checklist progress, pending adjustments, budget variance.",
    permission: PERMISSIONS.FINANCIALS_VIEW_DETAIL,
    readonly: true,
    collect: async () => {
      const period = await prisma.financialPeriod.findFirst({
        where: { periodType: "month" },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, status: true },
      });
      if (!period) {
        return { data: { note: "No financial periods exist yet." }, source: "financial periods" };
      }
      const [checklist, pendingAdjustments, variance] = await Promise.all([
        closeChecklistSummary(period.id),
        prisma.financialAdjustment.count({
          where: { financialPeriodId: period.id, approvalStatus: "pending" },
        }),
        getBudgetVarianceForPeriod({ periodId: period.id, divisionId: null }),
      ]);
      return {
        data: {
          period: period.name,
          periodStatus: period.status,
          closeChecklist: checklist,
          pendingAdjustments,
          budgetVariance: variance,
        },
        source: `monthly close status for ${period.name} (checklist, adjustments, budget variance)`,
      };
    },
  },

  governance_snapshot: {
    key: "governance_snapshot",
    description: "Pending approvals by type, recent AI output metadata, and feature-flag states.",
    permission: PERMISSIONS.AI_VIEW_LOGS,
    readonly: true,
    collect: async () => {
      const [pendingApprovals, recentOutputs, flags] = await Promise.all([
        prisma.approval.groupBy({
          by: ["approvalType"],
          where: { status: "pending" },
          _count: { _all: true },
        }),
        prisma.aiOutput.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            module: true,
            modelProvider: true,
            modelName: true,
            status: true,
            createdAt: true,
            warnings: true,
          },
        }),
        prisma.featureFlag.findMany({
          select: { key: true, enabled: true },
          orderBy: { key: "asc" },
        }),
      ]);
      return {
        data: {
          pendingApprovalsByType: pendingApprovals.map((g) => ({
            type: g.approvalType,
            count: g._count._all,
          })),
          recentAiOutputs: recentOutputs,
          featureFlags: flags,
        },
        source: "approvals + ai_outputs metadata + feature flags (no output bodies)",
      };
    },
  },
};

export function getAgentTool(key: string): AgentTool | null {
  return AGENT_TOOLS[key] ?? null;
}
