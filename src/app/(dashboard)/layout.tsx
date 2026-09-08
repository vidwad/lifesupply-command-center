import { AppShell } from "@/components/shell/AppShell";
import { signOutAction } from "@/server/auth/actions";
import { requireUser } from "@/server/permissions";

export const metadata: Metadata = {
  title: {
    default: "LifeSupply Command Center",
    template: "%s | LifeSupply Command Center",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={user} signOutAction={signOutAction}>
      {children}
    </AppShell>
  );
}
import type { Metadata } from "next";
