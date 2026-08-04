"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  archiveScenarioAction,
  requestForecastApprovalAction,
  type ForecastActionState,
} from "../actions";

export function ScenarioControls({ scenarioId, status }: { scenarioId: string; status: string }) {
  const [approvalState, approvalAction, approvalPending] = useActionState<
    ForecastActionState,
    FormData
  >(requestForecastApprovalAction, undefined);
  const [archiveState, archiveAction, archivePending] = useActionState<
    ForecastActionState,
    FormData
  >(archiveScenarioAction, undefined);

  return (
    <div className="space-y-2">
      {status === "draft" && (
        <form action={approvalAction}>
          <input type="hidden" name="scenarioId" value={scenarioId} />
          <Button type="submit" size="sm" disabled={approvalPending}>
            {approvalPending ? "Requesting…" : "Request approval"}
          </Button>
        </form>
      )}
      <form action={archiveAction}>
        <input type="hidden" name="scenarioId" value={scenarioId} />
        <Button type="submit" size="sm" variant="outline" disabled={archivePending}>
          {archivePending ? "Archiving…" : "Archive"}
        </Button>
      </form>
      {(approvalState?.error ?? archiveState?.error) && (
        <p className="text-xs text-destructive">{approvalState?.error ?? archiveState?.error}</p>
      )}
      {(approvalState?.ok ?? archiveState?.ok) && (
        <p className="text-xs text-success">{approvalState?.ok ?? archiveState?.ok}</p>
      )}
    </div>
  );
}
