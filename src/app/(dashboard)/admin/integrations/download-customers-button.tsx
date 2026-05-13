"use client";

import { useState } from "react";
import { Download, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type State =
  | { kind: "idle" }
  | { kind: "loading"; elapsedSec: number }
  | { kind: "fail"; message: string; status: number | string };

type Props = {
  integrationId: string;
  /** Used in the downloaded filename. */
  integrationName: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function DownloadCustomersButton({ integrationId, integrationName }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function run() {
    setState({ kind: "loading", elapsedSec: 0 });
    // Lightweight elapsed-time ticker so the user sees activity during the
    // potentially long BC paginated pull.
    const startedAt = Date.now();
    const ticker = setInterval(() => {
      setState((prev) =>
        prev.kind === "loading"
          ? { kind: "loading", elapsedSec: Math.floor((Date.now() - startedAt) / 1000) }
          : prev,
      );
    }, 1000);

    try {
      const res = await fetch(`/api/integrations/${integrationId}/export/customers/csv`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        let status: number | string = res.status;
        try {
          const body = (await res.json()) as { error?: string; status?: number | string };
          if (body.error) message = body.error;
          if (body.status != null) status = body.status;
        } catch {
          try {
            message = (await res.text()).slice(0, 300) || message;
          } catch {
            // ignore
          }
        }
        setState({ kind: "fail", message, status });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bc-customers-${slugify(integrationName)}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState({ kind: "idle" });
    } catch (err) {
      setState({
        kind: "fail",
        message: err instanceof Error ? err.message : "Network error",
        status: "network",
      });
    } finally {
      clearInterval(ticker);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={state.kind === "loading"}
      >
        {state.kind === "loading" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Download className="mr-1 h-3 w-3" />
        )}
        {state.kind === "loading"
          ? `Pulling… ${state.elapsedSec}s`
          : "Download enriched customers (.csv)"}
      </Button>

      {state.kind === "fail" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <div className="space-y-0.5">
            <p className="font-medium text-destructive">Export failed ({state.status})</p>
            <p className="text-muted-foreground break-all">{state.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
