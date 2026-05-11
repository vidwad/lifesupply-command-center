import { getNotificationCounts } from "@/server/services/notifications";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    roles: string[];
    permissions: string[];
  };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
};

export async function AppShell({ user, signOutAction, children }: Props) {
  const notificationCounts = await getNotificationCounts({
    id: user.id,
    permissions: user.permissions,
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <SidebarNav permissions={user.permissions} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} notificationCounts={notificationCounts} signOutAction={signOutAction} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
