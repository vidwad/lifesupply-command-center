/** Badge variants and labels for runs and their items, shared by the three pages. */
export const RUN_STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "destructive" | "secondary" | "outline" | "default"
> = {
  queued: "outline",
  running: "secondary",
  succeeded: "success",
  needs_attention: "warning",
  failed: "destructive",
  cancelled: "outline",
};

export const RUN_STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Completed",
  needs_attention: "Needs attention",
  failed: "Failed",
  cancelled: "Stopped",
};

export const ITEM_STAGE_VARIANT: Record<
  string,
  "warning" | "success" | "destructive" | "secondary" | "outline" | "default"
> = {
  pending: "outline",
  claimed: "secondary",
  researching: "secondary",
  generating: "secondary",
  reviewing: "secondary",
  publishing: "secondary",
  done: "success",
  attention: "warning",
  failed: "destructive",
  skipped: "outline",
  cancelled: "outline",
};

export const ITEM_STAGE_LABEL: Record<string, string> = {
  pending: "Waiting",
  claimed: "Starting",
  researching: "Researching",
  generating: "Generating image",
  reviewing: "Reviewing",
  publishing: "Publishing",
  done: "Completed",
  attention: "Needs attention",
  failed: "Failed",
  skipped: "Skipped",
  cancelled: "Not processed",
};
