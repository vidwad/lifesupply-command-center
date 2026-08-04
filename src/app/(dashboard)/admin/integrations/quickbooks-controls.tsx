"use client";

/**
 * QuickBooks controls (Phase 6): OAuth Connect + read-only report sync.
 */
import { useState } from "react";
import { Link2, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type State =
  | { kind: "idle" }
  | { kind: "dispatching" }
  | { kind: "queued" }
  | { kind: "skipped"; reason: string }
  | { kind: "fail"; message: string };

export function QuickBooksControls({ connected }: { connected: boolean }): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function runSync(): Promise<void> {
    setState({ kind: "dispatching" });
    try {
      const res = await fetch("/api/sync/quickbooks/reports", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        setState({ kind: "fail", message: (await res.text()).slice(0, 300) });
        return;
      }
      const result = (await res.json()) as
        | { status: "queued" }
        | { status: "skipped"; reason: string };
      setState(
        result.status === "queued"
          ? { kind: "queued" }
          : { kind: "skipped", reason: result.reason },
      );
    } catch (err) {
      setState({ kind: "fail", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={connected ? "outline" : "default"}
          onClick={() => {
            // Full navigation to the OAuth route handler — deliberately not a
            // <Link>, which could prefetch the redirect endpoint.
            window.location.href = "/api/auth/quickbooks/connect";
          }}
        >
          <Link2 className="mr-1 h-3 w-3" />
          {connected ? "Reconnect QuickBooks" : "Connect QuickBooks"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={state.kind === "dispatching" || !connected}
          onClick={() => void runSync()}
        >
          {state.kind === "dispatching" ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3 w-3" />
          )}
          Sync reports (read-only)
        </Button>
        {!connected && (
          <span className="text-xs text-muted-foreground">Connect before syncing.</span>
        )}
      </div>
      {state.kind === "queued" && (
        <p className="text-xs text-muted-foreground">
          Queued — pulls P&amp;L, balance sheet, and A/R–A/P agings for the last 2 months on the
          worker. Review results in /financials.
        </p>
      )}
      {state.kind === "skipped" && <p className="text-xs text-warning">{state.reason}</p>}
      {state.kind === "fail" && (
        <p className="break-all text-xs text-destructive">{state.message}</p>
      )}
    </div>
  );
}
