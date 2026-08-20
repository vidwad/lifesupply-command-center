"use client";

/**
 * Per-project actions on the Product Studio list.
 *
 * Delete uses a two-step inline confirm rather than a modal: the destructive
 * action is irreversible, so a stray click must not be enough, but a full
 * dialog is heavier than this row warrants. The confirm step names what will be
 * removed so the operator is not confirming a blank question.
 */
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteProjectAction } from "./actions";
import { StudioActionForm } from "./studio-action-form";

function ConfirmButton({ label }: { label: string }): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="destructive" disabled={pending}>
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}

export function ProjectActions({
  projectId,
  assetCount,
}: {
  projectId: string;
  assetCount: number;
}): React.JSX.Element {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
      {/* Placeholder. Rendered disabled rather than as a button that silently
          does nothing, so the control communicates "planned" instead of
          appearing broken. */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled
        title="Not yet available — promoting a project to the catalog is not built"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approve for catalog
      </Button>
      <span className="text-xs text-muted-foreground">Coming soon</span>

      <div className="ml-auto flex items-center gap-2">
        {confirming ? (
          <>
            <span className="text-xs text-muted-foreground">
              Delete project and {assetCount} image{assetCount === 1 ? "" : "s"}?
            </span>
            <StudioActionForm action={deleteProjectAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <ConfirmButton label="Confirm" />
            </StudioActionForm>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
