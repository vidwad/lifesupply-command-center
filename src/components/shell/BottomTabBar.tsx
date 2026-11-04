"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ClipboardList,
  LayoutDashboard,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Counts = { approvalsCanDecide: number; myOverdueTasks: number };

type Props = {
  permissions: string[];
  counts: Counts;
};

type TabItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
  /** Only this exact address counts as active; children of it do not. */
  exact?: boolean;
  badge?: (counts: Counts) => number;
};

/**
 * The phone's function keys (product owner, 2026-11-03). Five destinations
 * a thumb reaches without opening the drawer; each is gated by the same
 * permission as its sidebar entry, so a person sees only what they can
 * open. The AI key goes to the AI Analyst today; when the assistant drawer
 * ships (docs/43 stage 2) it opens the drawer instead.
 */
export const BOTTOM_TABS: TabItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    exact: true,
  },
  { label: "Orders", href: "/orders", icon: ShoppingCart, permission: PERMISSIONS.ORDERS_VIEW },
  { label: "Customers", href: "/customers", icon: Users, permission: PERMISSIONS.CUSTOMERS_VIEW },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ClipboardList,
    permission: PERMISSIONS.TASKS_VIEW,
    badge: (counts) => counts.myOverdueTasks + counts.approvalsCanDecide,
  },
  { label: "AI", href: "/ai-analyst", icon: Bot, permission: PERMISSIONS.AI_USE },
];

function isActive(pathname: string, item: TabItem): boolean {
  if (pathname === item.href) return true;
  return !item.exact && pathname.startsWith(`${item.href}/`);
}

/**
 * Sits below the scrolling main area in the shell's column, so it never
 * covers content and needs no bottom padding on pages. Hidden from `md`
 * up, where the sidebar carries the same destinations. The bottom padding
 * keeps the keys above an iPhone's home indicator.
 */
export function BottomTabBar({ permissions, counts }: Props) {
  const pathname = usePathname();
  const items = BOTTOM_TABS.filter((item) => permissions.includes(item.permission));
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Quick access"
      className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          const badge = item.badge ? item.badge(counts) : 0;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium leading-tight",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold tabular-nums text-destructive-foreground">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
