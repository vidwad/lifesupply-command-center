"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  inquiryAssignSelfAction,
  inquiryHandOffAction,
  inquiryRetryDeliveryAction,
  inquiryStatusAction,
  type InquiryActionState,
} from "./actions";

type Status = "received" | "assigned" | "in_progress" | "closed" | "spam";

const LABELS: Record<Status, string> = {
  received: "Return to received",
  assigned: "Mark assigned",
  in_progress: "Mark in progress",
  closed: "Close",
  spam: "Mark spam",
};

export function InquiryControls({
  id,
  nextStatuses,
  hasTask,
  canRetryDelivery,
}: {
  id: string;
  nextStatuses: Status[];
  hasTask: boolean;
  canRetryDelivery: boolean;
}) {
  const router = useRouter();
  const wrap =
    (action: (prev: InquiryActionState, formData: FormData) => Promise<InquiryActionState>) =>
    async (prev: InquiryActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result && "ok" in result) router.refresh();
      return result;
    };
  const [statusState, statusAction, statusPending] = useActionState(
    wrap(inquiryStatusAction),
    undefined,
  );
  const [assignState, assignAction, assignPending] = useActionState(
    wrap(inquiryAssignSelfAction),
    undefined,
  );
  const [handOffState, handOffAction, handOffPending] = useActionState(
    wrap(inquiryHandOffAction),
    undefined,
  );
  const [retryState, retryAction, retryPending] = useActionState(
    wrap(inquiryRetryDeliveryAction),
    undefined,
  );
  const pending = statusPending || assignPending || handOffPending || retryPending;
  const messages = [statusState, assignState, handOffState, retryState].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form action={assignAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Assign to me
          </Button>
        </form>
        {!hasTask && (
          <form action={handOffAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" size="sm" disabled={pending}>
              Create task
            </Button>
          </form>
        )}
        {nextStatuses.map((status) => (
          <form key={status} action={statusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              size="sm"
              variant={status === "spam" ? "destructive" : "outline"}
              disabled={pending}
            >
              {LABELS[status]}
            </Button>
          </form>
        ))}
        {canRetryDelivery && (
          <form action={retryAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              Retry delivery
            </Button>
          </form>
        )}
      </div>
      {messages.map((state, index) =>
        state && "error" in state ? (
          <p key={index} className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : state && "ok" in state ? (
          <p key={index} className="text-sm text-success" role="status">
            {state.ok}
          </p>
        ) : null,
      )}
    </div>
  );
}
