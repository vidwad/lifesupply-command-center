"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Building2, Search, Settings, Sparkles, type LucideIcon } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { PRIMARY_NAV } from "@/components/shell/nav-config";

type Props = {
  permissions: string[];
};

type ActionItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  hint?: string;
  permission?: string;
};

const QUICK_ACTIONS: ActionItem[] = [
  {
    label: "Ask the AI Analyst",
    href: "/ai-analyst",
    icon: Bot,
    hint: "Open the management chat",
    permission: "ai.use",
  },
  {
    label: "Generate AI briefing",
    href: "/dashboard",
    icon: Sparkles,
    hint: "Run today's executive briefing",
    permission: "ai.use",
  },
  {
    label: "Approvals queue",
    href: "/approvals",
    icon: Building2,
    hint: "Decide pending approvals",
  },
  {
    label: "Admin settings",
    href: "/admin",
    icon: Settings,
    hint: "Users, roles, integrations",
    permission: "admin.manage_users",
  },
];

export function CommandPaletteTrigger({ permissions }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navItems = PRIMARY_NAV.filter((item) => permissions.includes(item.permission));
  const actionItems = QUICK_ACTIONS.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background pl-3 pr-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Search and navigation"
      >
        <Search className="h-4 w-4" />
        <span className="hidden flex-1 truncate sm:inline">
          Search modules, jump to actions…
        </span>
        <kbd className="pointer-events-none ml-auto hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          {isMac ? "⌘" : "Ctrl"}K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command palette"
        description="Search modules, jump to pages, or run quick actions."
      >
        <CommandInput placeholder="Type to search…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          {actionItems.length > 0 && (
            <>
              <CommandGroup heading="Quick actions">
                {actionItems.map((a) => (
                  <CommandItem
                    key={a.href + a.label}
                    value={`${a.label} ${a.hint ?? ""}`}
                    onSelect={() => go(a.href)}
                  >
                    <a.icon className="text-muted-foreground" />
                    <span>{a.label}</span>
                    {a.hint && <CommandShortcut>{a.hint}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => go(item.href)}
              >
                <item.icon className="text-muted-foreground" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
