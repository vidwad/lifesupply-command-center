"use client";

import Link from "next/link";
import { AlertTriangle, Bell, ClipboardList, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  counts: {
    approvalsCanDecide: number;
    myOverdueTasks: number;
    openExceptions: number;
    total: number;
  };
};

export function NotificationBell({ counts }: Props) {
  const items = [
    {
      icon: ShieldCheck,
      label: "Pending approvals you can decide",
      count: counts.approvalsCanDecide,
      href: "/approvals",
      tone: counts.approvalsCanDecide > 0 ? "warning" : "muted",
    },
    {
      icon: ClipboardList,
      label: "My overdue tasks",
      count: counts.myOverdueTasks,
      href: "/tasks?view=overdue",
      tone: counts.myOverdueTasks > 0 ? "destructive" : "muted",
    },
    {
      icon: AlertTriangle,
      label: "Open order exceptions",
      count: counts.openExceptions,
      href: "/operations?view=needs_attention",
      tone: counts.openExceptions > 0 ? "warning" : "muted",
    },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {counts.total > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-medium tabular-nums text-destructive-foreground",
                "bg-destructive",
              )}
            >
              {counts.total > 99 ? "99+" : counts.total}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between">
            <span>Needs attention</span>
            <span className="text-xs font-normal text-muted-foreground">
              {counts.total} {counts.total === 1 ? "item" : "items"}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {counts.total === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            All clear — nothing needs your attention right now.
          </div>
        ) : (
          <ul className="py-1">
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent",
                    item.count === 0 && "opacity-60",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      item.tone === "destructive" && "text-destructive",
                      item.tone === "warning" && "text-warning",
                      item.tone === "muted" && "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span
                    className={cn(
                      "min-w-[24px] rounded px-1.5 py-0.5 text-center text-xs font-medium tabular-nums",
                      item.count === 0
                        ? "bg-muted text-muted-foreground"
                        : item.tone === "destructive"
                          ? "bg-destructive/10 text-destructive"
                          : item.tone === "warning"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
