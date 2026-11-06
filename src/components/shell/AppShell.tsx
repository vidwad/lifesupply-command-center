import { cookies } from "next/headers";

import { AnalystChat } from "@/app/(dashboard)/ai-analyst/analyst-chat";
import { SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/server/db/client";
import { getNotificationCounts } from "@/server/services/notifications";

import { AppSidebar } from "./AppSidebar";
import { DockShell } from "./DockShell";
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

/** What the dock's assistant panel offers first. */
const DOCK_ASSISTANT_SUGGESTIONS = [
  "What needs my attention today?",
  "How are sales this month against last?",
  "Which orders are stuck?",
];

/**
 * The application shell (2026-11-04, after the owner's pookt-operations
 * app): a collapsible grouped sidebar, a header naming the open module,
 * and on a phone a dock of function keys at the foot of every page with
 * the assistant a tap away. The column is the phone's visible height
 * (`h-dvh`, `h-screen` as the fallback) so nothing sits behind a browser
 * toolbar; the main area pads for the fixed dock below `md` through the
 * `phone-dock-space` rule. The dock's height is a CSS variable, never a
 * constant imported from the dock: that module is "use client", and a value
 * imported from it into this server component is a client reference, which
 * wrote an invalid padding and left every page's foot behind the dock
 * (2026-11-05).
 */
export async function AppShell({ user, signOutAction, children }: Props) {
  const [notificationCounts, divisions, periods, cookieStore] = await Promise.all([
    getNotificationCounts({ id: user.id, permissions: user.permissions }),
    prisma.division.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.financialPeriod.findMany({
      where: { periodType: "month" },
      orderBy: { startDate: "desc" },
      take: 12,
      select: { id: true, name: true, status: true },
    }),
    cookies(),
  ]);
  // The desktop panel remembers whether it was collapsed.
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const divisionOptions = divisions.map((d) => ({ value: d.id, label: d.name }));
  const periodOptions = periods.map((p) => ({
    value: p.id,
    label: p.status === "open" ? `${p.name} · open` : p.name,
  }));
  const counts = {
    approvalsCanDecide: notificationCounts.approvalsCanDecide,
    myOverdueTasks: notificationCounts.myOverdueTasks,
  };
  const canUseAi = user.permissions.includes("ai.use");

  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      className="h-dvh h-screen overflow-hidden bg-muted/20"
    >
      <AppSidebar
        permissions={user.permissions}
        divisions={divisionOptions}
        periods={periodOptions}
        counts={counts}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* The status bar's band when the app runs full screen from the Home
            Screen: the time and signal are white, so the band is dark. Zero
            height everywhere else. */}
        <div
          aria-hidden="true"
          className="shrink-0 bg-slate-950 pt-[env(safe-area-inset-top)] md:hidden"
        />
        <TopBar
          user={user}
          divisions={divisionOptions}
          periods={periodOptions}
          notificationCounts={notificationCounts}
          signOutAction={signOutAction}
        />
        <DockShell
          permissions={user.permissions}
          counts={counts}
          assistant={canUseAi ? <AnalystChat suggestions={DOCK_ASSISTANT_SUGGESTIONS} /> : null}
        >
          <main className="phone-dock-space flex-1 overflow-y-auto">{children}</main>
        </DockShell>
      </div>
    </SidebarProvider>
  );
}
