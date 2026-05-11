"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tone = "default" | "destructive";

type Props = {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  /** Optional reason field shown to the approver. Submitted as `reason`. */
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (formData: FormData) => Promise<void>;
};

/**
 * Reusable confirmation/approval dialog. Wraps a trigger with a Radix dialog
 * that posts to the supplied server action when confirmed. Per docs/08 §5
 * this is the primary UI for "X requires approval" flows that don't deserve
 * a full page.
 */
export function ApprovalDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  requireReason,
  reasonLabel = "Reason / notes",
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="contents"
        aria-label={title}
      >
        {trigger}
      </button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          action={(formData) =>
            startTransition(async () => {
              await onConfirm(formData);
              setOpen(false);
            })
          }
          className="space-y-4"
        >
          {requireReason && (
            <div className="space-y-1.5">
              <label
                htmlFor="approval-reason"
                className="text-sm font-medium leading-none"
              >
                {reasonLabel}
              </label>
              <textarea
                id="approval-reason"
                name="reason"
                rows={3}
                required
                className="flex w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={tone === "destructive" ? "destructive" : "default"}
              disabled={pending}
            >
              {pending ? "Working…" : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
