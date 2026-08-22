"use server";

/**
 * DP-6C reconciliation action.
 *
 * The only action on the operations page, and it is READ-ONLY against the
 * store: it reads one product's live sale price and records what it saw. It
 * changes no price, and this file deliberately does not import the writeback
 * or rollback services — an operator on a reporting page must not be one
 * mis-click from a price change.
 */
import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { PricingValidationError } from "@/server/services/pricing";
import { reconcileOneWriteback } from "@/server/services/pricing/reconciliation-service";

export type OperationsActionState = { error?: string; ok?: string } | undefined;

export async function reconcileWritebackAction(
  _previous: OperationsActionState,
  formData: FormData,
): Promise<OperationsActionState> {
  // Reading a live price needs the same pricing-domain permission as changing
  // one. Anyone who may write a price may certainly read it, so this adds no
  // privilege while keeping the check inside the pricing permission set.
  const user = await requirePermission(PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE);
  const writebackLogId = String(formData.get("writebackLogId") ?? "");

  try {
    const result = await reconcileOneWriteback({
      actorUserId: user.id,
      actorPermissions: user.permissions,
      writebackLogId,
    });
    revalidatePath("/products/pricing/operations");
    return {
      ok:
        result.status.replaceAll("_", " ") +
        " — " +
        result.reason +
        (result.requiredAction ? " Action: " + result.requiredAction : ""),
    };
  } catch (error) {
    if (error instanceof PricingValidationError) return { error: error.message };
    throw error instanceof Error ? error : new Error("Could not reconcile this writeback.");
  }
}
