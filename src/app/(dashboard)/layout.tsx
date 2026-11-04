import { AppShell } from "@/components/shell/AppShell";
import { signOutAction } from "@/server/auth/actions";
import { requireUser } from "@/server/permissions";

export const metadata: Metadata = {
  title: {
    default: "LifeSupply Command Center",
    template: "%s | LifeSupply Command Center",
  },
  robots: { index: false, follow: false },
  // Added to the Home Screen, the Command Center opens full screen with no
  // browser bar (product owner, 2026-11-04). The manifest in app/manifest.ts
  // carries the rest; this is the iOS-specific half, and it belongs to the
  // dashboard surface only, not the public website that shares the root.
  appleWebApp: { capable: true, title: "Command Center", statusBarStyle: "default" },
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
