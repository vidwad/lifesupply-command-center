"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { inngest } from "@/server/inngest/client";
import { DELAY_SWEEP_EVENT } from "@/server/inngest/functions/operations/delay-sweep";
import { requirePermission } from "@/server/permissions";

export type SweepActionState = { error?: string; ok?: string } | undefined;

/** Dispatch the delayed-order sweep to the worker on demand. */
export async function runDelaySweepAction(
  _prev: SweepActionState,
  _formData: FormData,
): Promise<SweepActionState> {
  const actor = await requirePermission(PERMISSIONS.ORDERS_MANAGE_EXCEPTIONS);
  try {
    await inngest.send({ name: DELAY_SWEEP_EVENT, data: { triggeredById: actor.id } });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `Could not dispatch the sweep: ${err.message}`
          : "Could not dispatch the sweep.",
    };
  }
  revalidatePath("/operations");
  return { ok: "Sweep dispatched to the worker. Exceptions will appear as it completes." };
}
