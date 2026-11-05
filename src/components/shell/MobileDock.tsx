"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bot,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Menu,
  ShoppingCart,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import type { DockAction } from "./dock-actions";

type Counts = { approvalsCanDecide: number; myOverdueTasks: number };

type NavKey = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
  exact?: boolean;
  badge?: (counts: Counts) => number;
};

/** The destinations the dock can show, in the order they fill the middle keys. */
export const DOCK_NAV: NavKey[] = [
  {
    id: "home",
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    exact: true,
  },
  {
    id: "orders",
    label: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    permission: PERMISSIONS.ORDERS_VIEW,
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/tasks",
    icon: ClipboardList,
    permission: PERMISSIONS.TASKS_VIEW,
    badge: (counts) => counts.myOverdueTasks + counts.approvalsCanDecide,
  },
  {
    id: "customers",
    label: "Customers",
    href: "/customers",
    icon: Users,
    permission: PERMISSIONS.CUSTOMERS_VIEW,
  },
  {
    id: "products",
    label: "Products",
    href: "/products",
    icon: Boxes,
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
];

/**
 * Whether the phone's on-screen keyboard is up (2026-11-04). iOS does not
 * move a fixed element for the keyboard; it scrolls the window instead,
 * which left the dock floating mid-screen and the header scrolled away
 * after the keyboard closed in the Home Screen app (owner screenshot). The
 * dock hides while the keyboard is up, and when it goes the window is
 * scrolled back to the top, where this layout always keeps it.
 */
function useKeyboardUp(): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let wasUp = false;
    const check = () => {
      const isUp = viewport.height < window.innerHeight * 0.75;
      if (isUp !== wasUp) {
        wasUp = isUp;
        setUp(isUp);
        if (!isUp && window.scrollY > 0) window.scrollTo({ top: 0 });
      }
    };
    viewport.addEventListener("resize", check);
    viewport.addEventListener("scroll", check);
    return () => {
      viewport.removeEventListener("resize", check);
      viewport.removeEventListener("scroll", check);
    };
  }, []);
  return up;
}

/** Height of the keys row, without the bottom padding. Main pads by the same. */
export const DOCK_HEIGHT_PX = 72;

function isActive(pathname: string, key: NavKey): boolean {
  if (pathname === key.href) return true;
  return !key.exact && pathname.startsWith(`${key.href}/`);
}

/**
 * The phone's bar at the foot of every page (product owner, 2026-11-03 and
 * 2026-11-04, after the pookt-operations dock). Hidden from `md` up, where
 * the sidebar is always there. Home, two middle keys that differ by page
 * (the open page's own keys first, then default destinations, never the
 * one already open), the AI key, and Menu, which opens the same sheet as
 * the header's trigger. The AI key opens a panel above the bar holding the
 * assistant; the panel closes without losing a typed question because the
 * panel's content is kept mounted while the dock is.
 */
export function MobileDock({
  permissions,
  counts,
  actions,
  assistant,
}: {
  permissions: string[];
  counts: Counts;
  actions: DockAction[];
  /** The assistant panel's content; omitted when the person cannot use AI. */
  assistant: React.ReactNode | null;
}) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const keyboardUp = useKeyboardUp();

  const allowed = DOCK_NAV.filter((key) => permissions.includes(key.permission));
  const home = allowed.find((key) => key.id === "home");
  const middle: Array<{ kind: "action"; action: DockAction } | { kind: "nav"; key: NavKey }> =
    actions.slice(0, 2).map((action) => ({ kind: "action" as const, action }));
  for (const key of allowed) {
    if (middle.length >= 2) break;
    if (key.id === "home" || isActive(pathname, key)) continue;
    middle.push({ kind: "nav", key });
  }
  const columns = (home ? 1 : 0) + middle.length + (assistant ? 1 : 0) + 1;
  if (columns < 2) return null;

  const keyClass = (active: boolean) =>
    cn(
      "relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold leading-none",
      active ? "text-primary" : "text-muted-foreground",
    );

  const navKey = (key: NavKey) => {
    const Icon = key.icon;
    const active = isActive(pathname, key);
    const badge = key.badge ? key.badge(counts) : 0;
    return (
      <Link
        key={`nav-${key.id}`}
        href={key.href}
        aria-current={active ? "page" : undefined}
        className={keyClass(active)}
      >
        <span className="relative grid h-7 w-7 place-items-center">
          <Icon className="h-5 w-5" aria-hidden="true" />
          {badge > 0 && (
            <span className="absolute -right-2 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold tabular-nums text-destructive-foreground">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
        <span className="max-w-full truncate">{key.label}</span>
      </Link>
    );
  };

  const actionKey = (action: DockAction) => {
    const Icon = action.icon;
    const inner = (
      <>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="max-w-full truncate">{action.label}</span>
      </>
    );
    const className =
      "flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold leading-none text-foreground";
    return action.href ? (
      <Link key={`action-${action.id}`} href={action.href} className={className}>
        {inner}
      </Link>
    ) : (
      <button
        key={`action-${action.id}`}
        type="button"
        onClick={action.onClick}
        className={className}
      >
        {inner}
      </button>
    );
  };

  return (
    <>
      {assistant && assistantOpen && (
        <div
          className="fixed inset-x-0 z-30 px-3 pb-2 pt-[env(safe-area-inset-top)] md:hidden"
          style={{ bottom: `calc(${DOCK_HEIGHT_PX}px + var(--phone-dock-pad, 0px))` }}
        >
          <div className="relative mx-auto max-w-xl">
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              aria-label="Hide the assistant panel"
              className="absolute -top-2 right-2 z-10 grid h-9 w-9 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[60dvh] overflow-y-auto rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-2xl dark:border-sky-900 dark:bg-sky-950">
              {assistant}
            </div>
          </div>
        </div>
      )}
      <nav
        aria-label="Quick access"
        className={cn(
          "phone-dock fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden",
          keyboardUp && "hidden",
        )}
      >
        <div
          className="mx-auto grid max-w-xl px-2"
          style={{
            height: DOCK_HEIGHT_PX,
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {home && navKey(home)}
          {middle.map((entry) =>
            entry.kind === "action" ? actionKey(entry.action) : navKey(entry.key),
          )}
          {assistant && (
            <button
              type="button"
              onClick={() => setAssistantOpen((v) => !v)}
              aria-pressed={assistantOpen}
              aria-label={assistantOpen ? "Hide the assistant" : "Ask the assistant"}
              className={keyClass(assistantOpen || pathname.startsWith("/ai-analyst"))}
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full",
                  assistantOpen && "bg-primary text-primary-foreground",
                )}
              >
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>AI</span>
            </button>
          )}
          <button type="button" onClick={toggleSidebar} className={keyClass(false)}>
            <span className="grid h-7 w-7 place-items-center">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
