/**
 * Agent registry (Phase 10 — docs/19 §10).
 *
 * Each agent is configuration, not code: a run permission, a set of
 * read-only tools, an optional parameter spec, and a prompt template that
 * demands the shared structured-output envelope. Agents READ, ANALYZE,
 * DRAFT, CLASSIFY, and RECOMMEND — they take no actions. Turning a
 * recommendation into a Task is an explicit human step (accept.ts), and
 * every prohibited external action (customer sends, supplier orders, price
 * changes, QuickBooks entries, investor distribution) already sits behind
 * its own approval + feature-flag gates elsewhere in the app.
 */
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

import { AGENT_KEYS, agentTemplateKey, type AgentKey } from "./keys";

export type AgentParamSpec = {
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
};

export type AgentDefinition = {
  key: AgentKey;
  name: string;
  description: string;
  /** Permission required to trigger a run. Tool permissions apply on top. */
  runPermission: PermissionKey;
  toolKeys: string[];
  templateKey: string;
  params: AgentParamSpec[];
};

export const AGENT_DEFINITIONS: Record<AgentKey, AgentDefinition> = {
  management_briefing: {
    key: "management_briefing",
    name: "Management Briefing Agent",
    description:
      "Reads the executive dashboard and operations summary; produces a structured daily briefing with findings and recommended follow-ups.",
    runPermission: PERMISSIONS.AI_USE,
    toolKeys: ["dashboard_summary", "operations_summary"],
    templateKey: agentTemplateKey("management_briefing"),
    params: [],
  },
  fulfillment_exception: {
    key: "fulfillment_exception",
    name: "Fulfillment Exception Agent",
    description:
      "Classifies the active exception queue: groups recurring problems, flags the most urgent, and proposes follow-up tasks.",
    runPermission: PERMISSIONS.ORDERS_VIEW,
    toolKeys: ["open_exceptions", "operations_summary"],
    templateKey: agentTemplateKey("fulfillment_exception"),
    params: [],
  },
  product_margin: {
    key: "product_margin",
    name: "Product & Margin Agent",
    description:
      "Analyzes low-margin and top-selling products and recommends catalog, pricing-review, or sourcing follow-ups (recommendations only — no price changes).",
    runPermission: PERMISSIONS.PRODUCTS_VIEW,
    toolKeys: ["low_margin_products", "dashboard_summary"],
    templateKey: agentTemplateKey("product_margin"),
    params: [],
  },
  marketing_analyst: {
    key: "marketing_analyst",
    name: "Marketing Analyst Agent",
    description:
      "Reviews recent campaign performance and reactivation aggregates; recommends next campaign focuses. Never sends anything.",
    runPermission: PERMISSIONS.MARKETING_VIEW,
    toolKeys: ["marketing_performance", "reactivation_overview"],
    templateKey: agentTemplateKey("marketing_analyst"),
    params: [],
  },
  customer_service_draft: {
    key: "customer_service_draft",
    name: "Customer Service Drafting Agent",
    description:
      "Drafts a customer-service reply for one order (status update, delay apology, refund explanation). Draft only — a human reviews and sends outside the system.",
    runPermission: PERMISSIONS.ORDERS_VIEW,
    toolKeys: ["order_context"],
    templateKey: agentTemplateKey("customer_service_draft"),
    params: [
      {
        name: "orderId",
        label: "Order ID",
        required: true,
        placeholder: "Order record id (from the order page URL)",
      },
      {
        name: "situation",
        label: "Situation",
        required: false,
        placeholder: "e.g. customer asked where their order is",
      },
    ],
  },
  accounting_close: {
    key: "accounting_close",
    name: "Accounting Close Assistant",
    description:
      "Reviews the monthly close: checklist progress, pending adjustments, and budget variance. Drafts commentary and follow-ups — it never records or modifies financial data.",
    runPermission: PERMISSIONS.FINANCIALS_VIEW_DETAIL,
    toolKeys: ["close_status", "dashboard_summary"],
    templateKey: agentTemplateKey("accounting_close"),
    params: [],
  },
  governance_guardrail: {
    key: "governance_guardrail",
    name: "Governance / Approval Guardrail Agent",
    description:
      "Reviews pending approvals, recent AI output metadata, and feature-flag states; flags stale approvals, unusual AI activity, or risky flag combinations.",
    runPermission: PERMISSIONS.AI_VIEW_LOGS,
    toolKeys: ["governance_snapshot"],
    templateKey: agentTemplateKey("governance_guardrail"),
    params: [],
  },
};

export function listAgents(): AgentDefinition[] {
  return AGENT_KEYS.map((key) => AGENT_DEFINITIONS[key]);
}

export function getAgent(key: string): AgentDefinition | null {
  return (AGENT_DEFINITIONS as Record<string, AgentDefinition>)[key] ?? null;
}
