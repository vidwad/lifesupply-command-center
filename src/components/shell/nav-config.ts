import {
  BarChart3,
  Bot,
  Boxes,
  Briefcase,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  LineChart,
  Megaphone,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
  badge?: string;
};

/**
 * Primary left-nav items. Order matches docs/08 §3.2.
 * Each item is gated by a single permission key — if the user lacks it,
 * the item does not render.
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Executive Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    label: "Operations",
    href: "/operations",
    icon: Gauge,
    permission: PERMISSIONS.DASHBOARD_OPERATIONS_VIEW,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    permission: PERMISSIONS.ORDERS_VIEW,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    permission: PERMISSIONS.CUSTOMERS_VIEW,
  },
  {
    label: "Products & Catalog",
    href: "/products",
    icon: Boxes,
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: Building2,
    permission: PERMISSIONS.SUPPLIERS_VIEW,
  },
  {
    label: "Financials",
    href: "/financials",
    icon: CircleDollarSign,
    permission: PERMISSIONS.FINANCIALS_VIEW_SUMMARY,
  },
  {
    label: "Marketing",
    href: "/marketing",
    icon: Megaphone,
    permission: PERMISSIONS.MARKETING_VIEW,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: LineChart,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    label: "AI Analyst",
    href: "/ai-analyst",
    icon: Bot,
    permission: PERMISSIONS.AI_USE,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    label: "Tasks & Workflows",
    href: "/tasks",
    icon: ClipboardList,
    permission: PERMISSIONS.TASKS_VIEW,
  },
  {
    label: "Investor Relations",
    href: "/investors",
    icon: Briefcase,
    permission: PERMISSIONS.INVESTORS_VIEW,
  },
  {
    label: "M&A / Opportunities",
    href: "/opportunities",
    icon: TrendingUp,
    permission: PERMISSIONS.OPPORTUNITIES_VIEW,
  },
  {
    label: "Automation Center",
    href: "/automation",
    icon: Wrench,
    permission: PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS,
  },
  {
    label: "Admin Settings",
    href: "/admin",
    icon: ShieldCheck,
    permission: PERMISSIONS.ADMIN_MANAGE_USERS,
  },
];

export const NAV_ICONS = {
  Sparkles,
  BarChart3,
};
