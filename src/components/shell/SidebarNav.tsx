"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { PRIMARY_NAV, type NavItem } from "./nav-config";

type Props = {
  permissions: string[];
};

export function SidebarNav({ permissions }: Props) {
  const pathname = usePathname();
  const visibleItems = PRIMARY_NAV.filter((item) => permissions.includes(item.permission));

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link href="/dashboard" className="mb-3 flex items-center gap-2 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-sm font-bold">LS</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">LifeSupply</span>
          <span className="text-xs leading-tight text-muted-foreground">Command Center</span>
        </div>
      </Link>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <SidebarNavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="border-t px-3 pt-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Phase 1 — MVP shell
        </p>
      </div>
    </nav>
  );
}

function SidebarNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-secondary font-medium text-secondary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
