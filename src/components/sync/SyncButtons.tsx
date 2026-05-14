"use client";

/**
 * Generic BC sync buttons shared by /customers and /orders.
 *
 * Two actions, fans out to all configured BC stores in parallel:
 *   - Full sync (confirmation-gated; takes minutes)
 *   - Incremental sync (no confirm; pulls since last successful sync)
 *
 * Pass `entity="customers"` or `entity="orders"` — that's the only
 * difference between the two pages' button bars.
 */
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Entity = "customers" | "orders";

type DispatchedJob = {
  status: "queued" | "skipped";
  syncLogId: string | null;
  connectionName: string;
  storeName: string | null;
  reason?: string;
};

type JobProgress = {
  id: string;
  connectionName: string;
  status: "running" | "success" | "failed" | "partial";
  isFinished: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorSummary: string | null;
  metadata?: { ordersScanned?: number } | null;
};

type State =
  | { kind: "idle" }
  | { kind: "dispatching"; mode: "full" | "incremental" }
  | {
      kind: "running";
      mode: "full" | "incremental";
      jobs: JobProgress[];
      skipped: DispatchedJob[];
      startedMs: number;
      elapsedSec: number;
    }
  | {
      kind: "done";
      mode: "full" | "incremental";
      jobs: JobProgress[];
      skipped: DispatchedJob[];
      durationMs: number;
    }
  | { kind: "fail"; mode: "full" | "incremental"; message: string };

const POLL_INTERVAL_MS = 2_000;

const ENTITY_LABEL: Record<Entity, string> = {
  customers: "customer",
  orders: "order",
};

export function SyncButtons({ entity }: { entity: Entity }): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    };
  }, []);

  async function fetchJobStatus(id: string): Promise<JobProgress | null> {
    try {
      const res = await fetch(`/api/sync/jobs/${id}`, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as JobProgress;
    } catch {
      return null;
    }
  }

  function startPolling(
    mode: "full" | "incremental",
    queuedJobs: DispatchedJob[],
    skipped: DispatchedJob[],
  ): void {
    const startedMs = Date.now();
    const initialJobs: JobProgress[] = queuedJobs
      .filter((j): j is DispatchedJob & { syncLogId: string } => j.syncLogId !== null)
      .map((j) => ({
        id: j.syncLogId,
        connectionName: j.connectionName,
        status: "running" as const,
        isFinished: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errorSummary: null,
      }));

    setState({
      kind: "running",
      mode,
      jobs: initialJobs,
      skipped,
      startedMs,
      elapsedSec: 0,
    });

    elapsedTimer.current = setInterval(() => {
      setState((prev) =>
        prev.kind === "running"
          ? { ...prev, elapsedSec: Math.floor((Date.now() - prev.startedMs) / 1000) }
          : prev,
      );
    }, 1_000);

    pollTimer.current = setInterval(async () => {
      const ids = initialJobs.map((j) => j.id);
      const updates = await Promise.all(ids.map((id) => fetchJobStatus(id)));

      setState((prev) => {
        if (prev.kind !== "running") return prev;
        const merged = prev.jobs.map((j, i) => updates[i] ?? j);
        const allDone = merged.every((j) => j.isFinished);
        if (allDone) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          if (elapsedTimer.current) clearInterval(elapsedTimer.current);
          return {
            kind: "done",
            mode: prev.mode,
            jobs: merged,
            skipped: prev.skipped,
            durationMs: Date.now() - prev.startedMs,
          };
        }
        return { ...prev, jobs: merged };
      });
    }, POLL_INTERVAL_MS);
  }

  async function dispatch(mode: "full" | "incremental"): Promise<void> {
    setState({ kind: "dispatching", mode });
    try {
      const res = await fetch(`/api/sync/bigcommerce/${entity}/${mode}`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text();
        setState({ kind: "fail", mode, message: body.slice(0, 300) });
        return;
      }
      const { jobs } = (await res.json()) as { jobs: DispatchedJob[] };
      const queued = jobs.filter((j) => j.status === "queued");
      const skipped = jobs.filter((j) => j.status === "skipped");
      if (queued.length === 0) {
        setState({
          kind: "fail",
          mode,
          message: `No BC stores were dispatched. ${skipped.length} skipped.`,
        });
        return;
      }
      startPolling(mode, queued, skipped);
    } catch (err) {
      setState({
        kind: "fail",
        mode,
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  const isBusy = state.kind === "dispatching" || state.kind === "running";

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={() => void dispatch("incremental")}
      >
        {state.kind === "running" && state.mode === "incremental" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="mr-1 h-3 w-3" />
        )}
        Incremental sync
      </Button>

      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={isBusy}
        onClick={() => setConfirmOpen(true)}
      >
        {state.kind === "running" && state.mode === "full" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Zap className="mr-1 h-3 w-3" />
        )}
        Full sync
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run a full BC {entity} sync?</DialogTitle>
            <DialogDescription>
              {entity === "customers"
                ? "Walks every customer + order from all configured BigCommerce stores."
                : "Walks every order from all configured BigCommerce stores."}{" "}
              Typically takes 2–10 minutes per store, depending on history.
              Existing local fields like notes, exception status, and{" "}
              {entity === "customers" ? "reactivation score" : "estimated margins"}{" "}
              are preserved — only BC-owned fields are overwritten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                void dispatch("full");
              }}
            >
              Run full sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SyncStatusPanel state={state} entity={entity} />
    </div>
  );
}

function SyncStatusPanel({
  state,
  entity,
}: {
  state: State;
  entity: Entity;
}): React.JSX.Element | null {
  if (state.kind === "idle" || state.kind === "dispatching") {
    return state.kind === "dispatching" ? (
      <span className="text-xs text-muted-foreground">Dispatching…</span>
    ) : null;
  }

  const label = ENTITY_LABEL[entity];

  if (state.kind === "fail") {
    return (
      <div className="flex items-center gap-1 text-xs text-destructive">
        <XCircle className="h-3 w-3" />
        <span className="break-all">{state.message}</span>
      </div>
    );
  }

  if (state.kind === "running") {
    const totalProcessed = state.jobs.reduce(
      (sum, j) => sum + j.recordsProcessed,
      0,
    );
    const totalOrders = state.jobs.reduce(
      (sum, j) => sum + (j.metadata?.ordersScanned ?? 0),
      0,
    );
    return (
      <span className="text-xs text-muted-foreground">
        {state.mode === "full" ? "Full" : "Incremental"} sync —{" "}
        {state.jobs.length} store{state.jobs.length === 1 ? "" : "s"}
        {entity === "customers" && totalOrders > 0
          ? `, ${totalOrders.toLocaleString()} orders scanned`
          : ""}
        , {totalProcessed.toLocaleString()} {label}s · {state.elapsedSec}s elapsed
      </span>
    );
  }

  // done
  const totalCreated = state.jobs.reduce((s, j) => s + j.recordsCreated, 0);
  const totalUpdated = state.jobs.reduce((s, j) => s + j.recordsUpdated, 0);
  const totalFailed = state.jobs.reduce((s, j) => s + j.recordsFailed, 0);
  const anyFailed = state.jobs.some((j) => j.status === "failed");
  return (
    <div className="flex items-center gap-1 text-xs">
      {anyFailed ? (
        <XCircle className="h-3 w-3 text-destructive" />
      ) : (
        <CheckCircle2 className="h-3 w-3 text-success" />
      )}
      <span className={anyFailed ? "text-destructive" : "text-muted-foreground"}>
        Done · {totalCreated.toLocaleString()} created,{" "}
        {totalUpdated.toLocaleString()} updated
        {totalFailed > 0 && `, ${totalFailed.toLocaleString()} failed`} ·{" "}
        {Math.round(state.durationMs / 1000)}s
      </span>
    </div>
  );
}
