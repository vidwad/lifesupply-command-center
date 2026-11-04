import Link from "next/link";
import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { CommandPaletteTrigger } from "./CommandPalette";
import { ContextSelectors } from "./ContextSelectors";
import { HeaderTitle } from "./HeaderTitle";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

type Option = { value: string; label: string };

type Props = {
  user: {
    name: string | null;
    email: string;
    roles: string[];
    permissions: string[];
  };
  divisions: Option[];
  periods: Option[];
  notificationCounts: {
    approvalsCanDecide: number;
    myOverdueTasks: number;
    openExceptions: number;
    total: number;
  };
  signOutAction: () => Promise<void>;
};

/**
 * The header (2026-11-04, after the owner's pookt-operations app): the
 * sidebar trigger, which collapses the panel on a desktop and opens the
 * sheet on a phone; the open module's name; then search, the context
 * selectors from `lg` up, AI, theme, notifications and the account.
 */
export function TopBar({ user, divisions, periods, notificationCounts, signOutAction }: Props) {
  const canUseAi = user.permissions.includes("ai.use");
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur md:gap-4 md:px-5">
      <div className="flex min-w-0 flex-1 basis-40 items-center gap-3">
        <SidebarTrigger />
        <div className="hidden h-5 w-px bg-border sm:block" />
        <HeaderTitle />
      </div>
      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        {/* Narrow until the widest screens, so the module's name keeps its room. */}
        <div className="w-9 md:w-40 xl:w-64">
          <CommandPaletteTrigger permissions={user.permissions} />
        </div>
        <ContextSelectors divisions={divisions} periods={periods} />
        {canUseAi && (
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/ai-analyst">
              <Bot className="h-4 w-4" />
              <span className="hidden lg:inline">AI</span>
            </Link>
          </Button>
        )}
        <ThemeToggle />
        <NotificationBell counts={notificationCounts} />
        <UserMenu
          name={user.name}
          email={user.email}
          roles={user.roles}
          signOutAction={signOutAction}
        />
      </div>
    </header>
  );
}
