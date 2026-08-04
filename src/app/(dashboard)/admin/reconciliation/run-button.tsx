"use client";

/**
 * Dispatches a reconciliation run across all mapped BC stores. Runs execute
 * on the background worker; the page is refreshed after dispatch and the
 * operator refreshes again once the sync log shows completion.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";

type DispatchedJob = {
  status: "queued" | "skipped";
  connectionName: string;
  storeName: string | null;
  reason?: string;
};

type State =
  | { kind: "idle" }
  | { kind: "dispatching" }
  | { kind: "done"; queued: number; skipped: DispatchedJob[] }
  | { kind: "fail"; message: string };

export function RunReconciliationButton(): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: "idle" });
  const router = useRouter();

  async function run(): Promise<void> {
    setState({ kind: "dispatching" });
    try {
      const res = await fetch("/api/sync/bigcommerce/reconciliation", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        setState({ kind: "fail", message: (await res.text()).slice(0, 300) });
        return;
      }
      const { jobs } = (await res.json()) as { jobs: DispatchedJob[] };
      const queued = jobs.filter((j) => j.status === "queued").length;
      const skipped = jobs.filter((j) => j.status === "skipped");
      setState({ kind: "done", queued, skipped });
      router.refresh();
    } catch (err) {
      setState({ kind: "fail", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        disabled={state.kind === "dispatching"}
        onClick={() => void run()}
      >
        {state.kind === "dispatching" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Scale className="mr-1 h-3 w-3" />
        )}
        Run reconciliation
      </Button>
      {state.kind === "done" && (
        <span className="text-xs text-muted-foreground">
          Queued {state.queued} store{state.queued === 1 ? "" : "s"}
          {state.skipped.length > 0 && `, ${state.skipped.length} skipped`} — runs on the worker;
          refresh in a minute for results.
        </span>
      )}
      {state.kind === "fail" && (
        <span className="break-all text-xs text-destructive">{state.message}</span>
      )}
    </div>
  );
}
