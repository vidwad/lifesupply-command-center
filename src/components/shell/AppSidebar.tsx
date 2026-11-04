"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { ContextOptionLists } from "./ContextOptionLists";
import type { ContextOption } from "./context-params";
import { NAV_GROUPS, isNavItemActive, type NavItem } from "./nav-config";

type Props = {
  permissions: string[];
  divisions: ContextOption[];
  periods: ContextOption[];
  /** Attention counts shown beside Tasks and Approvals. */
  counts: { myOverdueTasks: number; approvalsCanDecide: number };
};

const BADGES: Record<string, (counts: Props["counts"]) => number> = {
  "/tasks": (c) => c.myOverdueTasks,
  "/approvals": (c) => c.approvalsCanDecide,
};

/**
 * The application's navigation (2026-11-04, after the owner's
 * pookt-operations app): one dark panel, grouped by job, that collapses
 * to an icon rail on a desktop and opens as a sheet on a phone. Every item
 * is gated by its own permission, as before. On a phone the division and
 * period context sits at the foot of the sheet as plain buttons, and the
 * sheet closes when a destination is chosen.
 */
export function AppSidebar({ permissions, divisions, periods, counts }: Props) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  // A choice should reveal the page, not leave the sheet covering it.
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => permissions.includes(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <Sidebar
      className="border-r border-white/10 bg-slate-950 text-slate-300"
      mobileTitle="LifeSupply Command Center"
    >
      <SidebarHeader className="hidden border-b border-white/10 px-3 py-3 md:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-sm font-bold text-slate-950">
            LS
          </span>
          <span className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-tight text-white">LifeSupply</span>
            <span className="text-xs leading-tight text-slate-400">Command Center</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {groups.map((group, index) => (
          <div key={group.label}>
            {index > 0 && <SidebarSeparator className="my-2 border-white/10" />}
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="text-slate-500">{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavEntry
                    key={item.href}
                    item={item}
                    active={isNavItemActive(pathname, item)}
                    badge={BADGES[item.href]?.(counts) ?? 0}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      {/* The context lives in the header's selectors from `lg` up; on a
          phone it is here, as buttons rather than native selects (2026-10-29). */}
      <SidebarFooter className="border-t border-white/10 p-3 md:hidden">
        <p className="mb-2 px-1 text-[10px] uppercase tracking-widest text-slate-500">Context</p>
        <div className="rounded-md bg-background px-3 py-2 text-foreground">
          <ContextOptionLists divisions={divisions} periods={periods} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavEntry({ item, active, badge }: { item: NavItem; active: boolean; badge: number }) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            active
              ? "bg-white font-medium text-slate-950"
              : "text-slate-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon />
          <span>{item.label}</span>
          {badge > 0 && (
            <SidebarMenuBadge
              className={
                active ? "bg-slate-950 text-white" : "bg-destructive text-destructive-foreground"
              }
            >
              {badge > 99 ? "99+" : badge}
            </SidebarMenuBadge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
