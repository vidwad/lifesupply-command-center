/**
 * Agent keys (Phase 10). Kept in a leaf module so output-schemas.ts, the
 * prompt-template builtins, and the registry can all reference the same list
 * without import cycles.
 */
export const AGENT_KEYS = [
  "management_briefing",
  "fulfillment_exception",
  "product_margin",
  "marketing_analyst",
  "customer_service_draft",
  "governance_guardrail",
  "accounting_close",
] as const;

export type AgentKey = (typeof AGENT_KEYS)[number];

export const agentTemplateKey = (key: AgentKey): string => `agent_${key}`;
export const agentModule = (key: AgentKey): string => `agent_${key}`;
