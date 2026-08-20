"use client";

/**
 * Live workflow progress for a Product Studio project.
 *
 * Research and image generation run on the background worker, so the server
 * component that renders this page has no way to push updates. Rather than
 * telling the operator to reload by hand, this component polls with
 * `router.refresh()` while any step is still running and stops as soon as the
 * workflow reaches a resting state (nothing running).
 *
 * Polling — not SSE — is deliberate: the app has no realtime transport, these
 * jobs take minutes rather than seconds, and a refresh is a single cached RSC
 * request. Backing off after a few minutes keeps a forgotten open tab from
 * polling a long-failed job forever.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Circle, Loader2 } from "lucide-react";

export type WorkflowStepState = "pending" | "running" | "done" | "failed";

export type WorkflowStep = {
  key: string;
  label: string;
  state: WorkflowStepState;
  detail?: string;
};

const BASE_POLL_MS = 4_000;
/** After this long still running, slow down rather than hammering the server. */
const BACKOFF_AFTER_MS = 3 * 60_000;
const BACKOFF_POLL_MS = 15_000;

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/**
 * Mounted only while work is running, so its state starts fresh on every run
 * and never needs resetting from an effect.
 */
function ElapsedTimer(): React.JSX.Element {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1_000);
    return () => clearInterval(id);
  }, []);

  return <span> · {formatElapsed(elapsed)}</span>;
}

export function WorkflowProgress({ steps }: { steps: WorkflowStep[] }): React.JSX.Element {
  const router = useRouter();
  const active = steps.some((step) => step.state === "running");
  const failed = steps.some((step) => step.state === "failed");
  const done = steps.filter((step) => step.state === "done").length;
  const percent = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (): void => {
      const running = Date.now() - startedAt;
      const delay = running > BACKOFF_AFTER_MS ? BACKOFF_POLL_MS : BASE_POLL_MS;
      timer = setTimeout(() => {
        if (cancelled) return;
        // Re-renders the server component with fresh database state. If a step
        // finished, `active` flips false on the next render and polling stops.
        router.refresh();
        schedule();
      }, delay);
    };
    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, router]);

  return (
    <div className="space-y-3" data-testid="workflow-progress">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">
          {failed ? "Stopped" : active ? "Working…" : done === steps.length ? "Complete" : "Ready"}
        </span>
        <span className="text-muted-foreground">
          {done} of {steps.length}
          {active ? <ElapsedTimer /> : null}
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Product Studio workflow progress"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            failed ? "bg-destructive" : "bg-primary"
          } ${active ? "animate-pulse" : ""}`}
          style={{ width: `${Math.max(percent, active ? 4 : 0)}%` }}
        />
      </div>

      <ol className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 shrink-0">
              {step.state === "done" ? (
                <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
              ) : step.state === "running" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
              ) : step.state === "failed" ? (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden />
              )}
            </span>
            <span className="flex-1">
              <span
                className={
                  step.state === "pending" ? "text-muted-foreground" : "font-medium text-foreground"
                }
              >
                {step.label}
              </span>
              {step.detail ? (
                <span className="block text-muted-foreground">{step.detail}</span>
              ) : null}
            </span>
            <span className="sr-only">{step.state}</span>
          </li>
        ))}
      </ol>

      {active ? (
        <p className="text-xs text-muted-foreground">
          Running on the background worker. This page updates itself — no need to reload.
        </p>
      ) : null}
    </div>
  );
}
