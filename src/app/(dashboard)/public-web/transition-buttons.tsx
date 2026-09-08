"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  transitionContentAction,
  transitionDocumentAction,
  type PublicWebActionState,
} from "./actions";

type Transition = "submit" | "reject" | "approve" | "publish" | "unpublish" | "archive";

const LABELS: Record<Transition, string> = {
  submit: "Submit for review",
  reject: "Return to draft",
  approve: "Approve",
  publish: "Publish",
  unpublish: "Withdraw",
  archive: "Archive",
};

const DESTRUCTIVE: readonly Transition[] = ["unpublish", "archive"];

/**
 * Renders only the transitions the record's status allows and the viewer
 * may perform. Each button is its own form carrying the concurrency token;
 * the server re-checks status, permission, and token, so the buttons are a
 * convenience, not the control.
 */
export function TransitionButtons({
  kind,
  id,
  expectedUpdatedAt,
  available,
}: {
  kind: "content" | "document";
  id: string;
  expectedUpdatedAt: string;
  available: Transition[];
}) {
  const router = useRouter();
  const action = kind === "content" ? transitionContentAction : transitionDocumentAction;
  const [state, formAction, pending] = useActionState<PublicWebActionState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result && "ok" in result) router.refresh();
      return result;
    },
    undefined,
  );

  if (available.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {available.map((transition) => (
          <form key={transition} action={formAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="transition" value={transition} />
            <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />
            {DESTRUCTIVE.includes(transition) && (
              <input type="hidden" name="reason" value={`${LABELS[transition]} from the editor`} />
            )}
            <Button
              type="submit"
              size="sm"
              disabled={pending}
              variant={
                transition === "publish" || transition === "approve"
                  ? "default"
                  : DESTRUCTIVE.includes(transition)
                    ? "destructive"
                    : "outline"
              }
            >
              {LABELS[transition]}
            </Button>
          </form>
        ))}
      </div>
      {state && "error" in state && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="text-sm text-success" role="status">
          {state.ok}
        </p>
      )}
    </div>
  );
}
