"use client";

import { usePathname } from "next/navigation";

import { navGroupForPath, navItemForPath } from "./nav-config";

/**
 * The header names the open module (2026-11-04, after the owner's
 * pookt-operations app): the matching navigation item's label, with its
 * group beneath it from `sm` up. A page outside the navigation shows the
 * application's name.
 */
export function HeaderTitle() {
  const pathname = usePathname();
  const item = navItemForPath(pathname);
  const group = navGroupForPath(pathname);
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold leading-tight">
        {item?.label ?? "Command Center"}
      </p>
      <p className="mt-0.5 hidden truncate text-[11px] leading-tight text-muted-foreground sm:block">
        {group ? `${group.label} · LifeSupply Command Center` : "LifeSupply Command Center"}
      </p>
    </div>
  );
}
