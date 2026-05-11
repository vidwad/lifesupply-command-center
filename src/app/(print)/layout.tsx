import { requireUser } from "@/server/permissions";

/**
 * Print-friendly route group — bypasses the AppShell so users can browser-print
 * straight to PDF. Always light, even when the dashboard is in dark mode:
 * paper output should never use a dark background.
 */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-screen bg-white text-slate-900 [color-scheme:light]">{children}</div>
  );
}
