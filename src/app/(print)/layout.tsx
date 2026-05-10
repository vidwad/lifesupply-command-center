import { requireUser } from "@/server/permissions";

/**
 * Print-friendly route group — bypasses the AppShell so users can browser-print
 * straight to PDF. Still auth-gated.
 */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="min-h-screen bg-white text-foreground">{children}</div>;
}
