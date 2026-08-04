"use client";

/**
 * Dispatches the Mailchimp subscriber/suppression read sync (Phase 4). Runs
 * on the background worker; consent fields update as it processes.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type State =
  | { kind: "idle" }
  | { kind: "dispatching" }
  | { kind: "queued" }
  | { kind: "skipped"; reason: string }
  | { kind: "fail"; message: string };

export function MailchimpSyncButton(): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: "idle" });
  const router = useRouter();

  async function run(): Promise<void> {
    setState({ kind: "dispatching" });
    try {
      const res = await fetch("/api/sync/mailchimp/members", {
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
      if (result.status === "queued") {
        setState({ kind: "queued" });
        router.refresh();
      } else {
        setState({ kind: "skipped", reason: result.reason });
      }
    } catch (err) {
      setState({ kind: "fail", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={state.kind === "dispatching"}
        onClick={() => void run()}
      >
        {state.kind === "dispatching" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="mr-1 h-3 w-3" />
        )}
        Sync Mailchimp consent
      </Button>
      {state.kind === "queued" && (
        <p className="text-xs text-muted-foreground">
          Queued — runs on the worker. Refresh in a minute for updated consent counts.
        </p>
      )}
      {state.kind === "skipped" && <p className="text-xs text-warning">{state.reason}</p>}
      {state.kind === "fail" && (
        <p className="break-all text-xs text-destructive">{state.message}</p>
      )}
    </div>
  );
}
