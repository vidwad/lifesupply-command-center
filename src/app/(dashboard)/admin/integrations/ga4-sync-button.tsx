"use client";

/**
 * GA4 daily metric sync (Phase 6). Fans out to every configured + mapped GA4
 * connection; unmapped properties are skipped with a reason.
 */
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type Job = { status: "queued" | "skipped"; connectionName: string; reason?: string };

type State =
  | { kind: "idle" }
  | { kind: "dispatching" }
  | { kind: "done"; queued: number; skipped: Job[] }
  | { kind: "fail"; message: string };

export function Ga4SyncButton(): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function run(): Promise<void> {
    setState({ kind: "dispatching" });
    try {
      const res = await fetch("/api/sync/ga4/daily", { method: "POST", cache: "no-store" });
      if (!res.ok) {
        setState({ kind: "fail", message: (await res.text()).slice(0, 300) });
        return;
      }
      const { jobs } = (await res.json()) as { jobs: Job[] };
      setState({
        kind: "done",
        queued: jobs.filter((j) => j.status === "queued").length,
        skipped: jobs.filter((j) => j.status === "skipped"),
      });
    } catch (err) {
      setState({ kind: "fail", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={state.kind === "dispatching"}
        onClick={() => void run()}
      >
        {state.kind === "dispatching" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="mr-1 h-3 w-3" />
        )}
        Sync GA4 metrics (30d)
      </Button>
      {state.kind === "done" && (
        <p className="text-xs text-muted-foreground">
          Queued {state.queued} propert{state.queued === 1 ? "y" : "ies"}
          {state.skipped.length > 0 &&
            ` · skipped: ${state.skipped.map((s) => s.connectionName).join(", ")}`}
        </p>
      )}
      {state.kind === "fail" && (
        <p className="break-all text-xs text-destructive">{state.message}</p>
      )}
    </div>
  );
}
