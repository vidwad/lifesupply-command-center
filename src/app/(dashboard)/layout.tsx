import { AppShell } from "@/components/shell/AppShell";
import { signOutAction } from "@/server/auth/actions";
import { requireUser } from "@/server/permissions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={user} signOutAction={signOutAction}>
      {children}
    </AppShell>
  );
}
