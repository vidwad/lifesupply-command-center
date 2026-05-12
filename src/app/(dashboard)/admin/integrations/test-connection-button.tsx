"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PlayCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ResultState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string; detail?: Record<string, string | number | null> }
  | { kind: "fail"; message: string; status: number | string };

type Props = {
  integrationId: string;
};

export function TestConnectionButton({ integrationId }: Props) {
  const [state, setState] = useState<ResultState>({ kind: "idle" });

  async function run() {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/integrations/${integrationId}/test`, {
        method: "POST",
        cache: "no-store",
      });
      const body = (await res.json()) as {
        ok: boolean;
        message: string;
        status: number | string;
        detail?: Record<string, string | number | null>;
      };
      if (body.ok) {
        setState({ kind: "ok", message: body.message, detail: body.detail });
      } else {
        setState({ kind: "fail", message: body.message, status: body.status });
      }
    } catch (err) {
      setState({
        kind: "fail",
        message: err instanceof Error ? err.message : "Network error",
        status: "network",
      });
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
          <PlayCircle className="mr-1 h-3 w-3" />
        )}
        {state.kind === "loading" ? "Testing…" : "Test connection"}
      </Button>

      {state.kind === "ok" && (
        <div className="flex items-start gap-2 rounded-md border border-success/40 bg-success/5 p-2 text-xs">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          <div className="space-y-1">
            <p className="font-medium text-success">{state.message}</p>
            {state.detail && (
              <ul className="text-muted-foreground">
                {Object.entries(state.detail)
                  .filter(([, v]) => v != null && v !== "")
                  .map(([k, v]) => (
                    <li key={k}>
                      <span className="font-mono">{k}:</span> {String(v)}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {state.kind === "fail" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <div className="space-y-0.5">
            <p className="font-medium text-destructive">
              {state.status === "missing_credential"
                ? "Missing credentials"
                : state.status === "not_implemented"
                  ? "Not yet supported"
                  : `Failed (${state.status})`}
            </p>
            <p className="text-muted-foreground break-all">{state.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
