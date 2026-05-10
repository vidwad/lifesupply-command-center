import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { UserMenu } from "./UserMenu";

type Props = {
  user: {
    name: string | null;
    email: string;
    roles: string[];
  };
  signOutAction: () => Promise<void>;
};

export function TopBar({ user, signOutAction }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search orders, customers, products…"
            disabled
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            aria-label="Global search"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ⌘K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled>
          Period: MTD
        </Button>
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
