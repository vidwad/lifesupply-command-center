import Link from "next/link";
import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CommandPaletteTrigger } from "./CommandPalette";
import { ContextSelectors } from "./ContextSelectors";
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

export function TopBar({
  user,
  divisions,
  periods,
  notificationCounts,
  signOutAction,
}: Props) {
  const canUseAi = user.permissions.includes("ai.use");
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="w-full max-w-md">
          <CommandPaletteTrigger permissions={user.permissions} />
        </div>
      </div>
      <div className="flex items-center gap-2">
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
