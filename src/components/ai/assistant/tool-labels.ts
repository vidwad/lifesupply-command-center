/** How the assistant's tools are named to the person (2026-11-04). */
export const TOOL_LABELS: Record<string, string> = {
  list_stores: "stores",
  dashboard_snapshot: "dashboard",
  sales_overview: "sales",
  top_products: "top products",
  search_customers: "customers",
  customer_detail: "customer",
  product_top_customers: "product's customers",
  search_orders: "orders",
  order_detail: "order",
  search_products: "products",
  open_exceptions: "exceptions",
  tasks_and_approvals: "tasks and approvals",
  financial_summary: "financials",
  marketing_performance: "campaigns",
  competitor_prices: "competitor prices",
  website_content: "website",
  bigcommerce_read: "store API",
  database_schema: "database schema",
  database_query: "database query",
  draft_task: "task draft",
};

export const toolLabel = (name: string): string => TOOL_LABELS[name] ?? name.replace(/_/g, " ");
