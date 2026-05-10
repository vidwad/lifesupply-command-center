/**
 * Client-safe permission key registry. Server-side enforcement lives in
 * src/server/permissions/. UI may use these to hide nav items, but never to
 * gate sensitive data — that must be enforced server-side.
 *
 * Source: docs/06_SECURITY_AND_PERMISSIONS.md §5
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",
  DASHBOARD_EXECUTIVE_VIEW: "dashboard.executive_view",
  DASHBOARD_FINANCIAL_VIEW: "dashboard.financial_view",
  DASHBOARD_OPERATIONS_VIEW: "dashboard.operations_view",

  // Orders
  ORDERS_VIEW: "orders.view",
  ORDERS_UPDATE: "orders.update",
  ORDERS_EXPORT: "orders.export",
  ORDERS_MANAGE_EXCEPTIONS: "orders.manage_exceptions",
  ORDERS_APPROVE_EXTERNAL_UPDATE: "orders.approve_external_update",

  // Customers
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_EXPORT: "customers.export",
  CUSTOMERS_VIEW_CONSENT: "customers.view_consent",
  CUSTOMERS_MANAGE_SEGMENTS: "customers.manage_segments",

  // Products
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_EXPORT: "products.export",
  PRODUCTS_MANAGE_SUPPLIER_MAPPING: "products.manage_supplier_mapping",
  PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE: "products.approve_bigcommerce_update",

  // Suppliers
  SUPPLIERS_VIEW: "suppliers.view",
  SUPPLIERS_UPDATE: "suppliers.update",
  SUPPLIERS_MANAGE_PORTAL_SETTINGS: "suppliers.manage_portal_settings",
  SUPPLIERS_VIEW_CREDENTIALS_REFERENCE: "suppliers.view_credentials_reference",
  SUPPLIERS_RUN_AUTOMATION: "suppliers.run_automation",
  SUPPLIERS_APPROVE_ORDER_AUTOMATION: "suppliers.approve_order_automation",

  // Financials
  FINANCIALS_VIEW_SUMMARY: "financials.view_summary",
  FINANCIALS_VIEW_DETAIL: "financials.view_detail",
  FINANCIALS_IMPORT: "financials.import",
  FINANCIALS_REVIEW: "financials.review",
  FINANCIALS_APPROVE: "financials.approve",
  FINANCIALS_EXPORT: "financials.export",
  FINANCIALS_MANAGE_ADJUSTMENTS: "financials.manage_adjustments",

  // Marketing
  MARKETING_VIEW: "marketing.view",
  MARKETING_MANAGE_SEGMENTS: "marketing.manage_segments",
  MARKETING_DRAFT_CAMPAIGN: "marketing.draft_campaign",
  MARKETING_APPROVE_CAMPAIGN: "marketing.approve_campaign",
  MARKETING_EXPORT_CONTACTS: "marketing.export_contacts",
  MARKETING_SYNC_MAILCHIMP: "marketing.sync_mailchimp",

  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_EXPORT: "analytics.export",
  ANALYTICS_MANAGE_GA4_SETTINGS: "analytics.manage_ga4_settings",

  // AI
  AI_USE: "ai.use",
  AI_USE_FINANCIAL_CONTEXT: "ai.use_financial_context",
  AI_USE_CUSTOMER_CONTEXT: "ai.use_customer_context",
  AI_USE_INVESTOR_CONTEXT: "ai.use_investor_context",
  AI_VIEW_LOGS: "ai.view_logs",
  AI_APPROVE_OUTPUT: "ai.approve_output",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_GENERATE: "reports.generate",
  REPORTS_EDIT: "reports.edit",
  REPORTS_APPROVE: "reports.approve",
  REPORTS_EXPORT: "reports.export",
  REPORTS_DELETE: "reports.delete",

  // Tasks
  TASKS_VIEW: "tasks.view",
  TASKS_CREATE: "tasks.create",
  TASKS_ASSIGN: "tasks.assign",
  TASKS_UPDATE: "tasks.update",
  TASKS_COMPLETE: "tasks.complete",
  TASKS_DELETE: "tasks.delete",

  // Investors
  INVESTORS_VIEW: "investors.view",
  INVESTORS_UPDATE: "investors.update",
  INVESTORS_EXPORT: "investors.export",
  INVESTORS_GENERATE_UPDATE: "investors.generate_update",
  INVESTORS_APPROVE_MATERIALS: "investors.approve_materials",

  // Opportunities
  OPPORTUNITIES_VIEW: "opportunities.view",
  OPPORTUNITIES_UPDATE: "opportunities.update",
  OPPORTUNITIES_EXPORT: "opportunities.export",
  OPPORTUNITIES_AI_ANALYZE: "opportunities.ai_analyze",
  OPPORTUNITIES_MARK_CONFIDENTIAL: "opportunities.mark_confidential",

  // Admin
  ADMIN_MANAGE_USERS: "admin.manage_users",
  ADMIN_MANAGE_ROLES: "admin.manage_roles",
  ADMIN_MANAGE_PERMISSIONS: "admin.manage_permissions",
  ADMIN_MANAGE_INTEGRATIONS: "admin.manage_integrations",
  ADMIN_VIEW_AUDIT_LOGS: "admin.view_audit_logs",
  ADMIN_MANAGE_SYSTEM_SETTINGS: "admin.manage_system_settings",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS) as PermissionKey[];
