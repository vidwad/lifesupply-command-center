import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

type Props = {
  user: {
    name: string | null;
    email: string;
    roles: string[];
    permissions: string[];
  };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
};

export function AppShell({ user, signOutAction, children }: Props) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <SidebarNav permissions={user.permissions} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} signOutAction={signOutAction} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
