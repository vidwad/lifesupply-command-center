/**
 * DP-6C read-only reconciliation against BigCommerce.
 *
 * Reads one writeback log's live sale price and compares it with what the log
 * says the store should hold. It never writes: this module imports
 * `readBigCommercePrice` and `resolveStoreCredentials` and NOT
 * `writeBigCommerceSalePrice`, and a canary enforces exactly that.
 *
 * PERMISSION DECISION (documented in PRD 7.8). This requires
 * `pricing.writeback_bigcommerce` rather than the `admin.manage_integrations`
 * used by the older sync-wide reconciliation. Two reasons: it keeps a pricing
 * task inside the pricing permission set rather than demanding a global admin
 * grant, and anyone who may CHANGE a price may certainly read one, so it adds
 * no privilege. Viewing and exporting the resulting report need only
 * `pricing.view` / `pricing.export`.
 *
 * FLAG DECISION. No feature flag is required. The existing read-only
 * BigCommerce reconciliation is not flag-gated either, and the DP-2A posture
 * holds: flags gate creating and mutating, not looking. Tripping the kill
 * switch must stop price CHANGES; it must not blind an operator trying to find
 * out what the store currently holds — that is when they need to look most.
 *
 * One log per explicit action. There is no loop and no bulk entry point.
 */
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import {
  readBigCommercePrice,
  resolveStoreCredentials,
} from "@/server/integrations/bigcommerce/price-writeback";

import {
  reconcileWritebackLog,
  type ReconciliationOutcome,
  latestRollbackAttempt,
} from "./reconciliation";
import { resolveRollbackTarget, type WritebackLogLike } from "./rollback-eligibility";
import { PricingValidationError } from "./validation";

const num = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

async function loadLog(writebackLogId: string) {
  const row = await prisma.priceWritebackLog.findUnique({
    where: { id: writebackLogId },
    include: {
      recommendation: {
        select: {
          id: true,
          status: true,
          pricingRunItem: { select: { id: true, sku: true } },
        },
      },
    },
  });
  if (!row) throw new PricingValidationError("Writeback log not found.");
  return row;
}

type Loaded = Awaited<ReturnType<typeof loadLog>>;

function toLogLike(row: Loaded): WritebackLogLike {
  return {
    status: row.status,
    rollbackAt: row.rollbackAt,
    rollbackPayload: row.rollbackPayload,
    sourceSystem: row.sourceSystem,
    sourceProductId: row.sourceProductId,
    sourceVariantId: row.sourceVariantId,
    oldSalePrice: num(row.oldSalePrice),
    newSalePrice: num(row.newSalePrice),
  };
}

function auditContext(row: Loaded) {
  return {
    writebackLogId: row.id,
    recommendationId: row.recommendationId,
    storeId: row.storeId,
    sku: row.recommendation?.pricingRunItem?.sku ?? null,
    productId: row.productId,
    productVariantId: row.productVariantId,
    bigCommerceProductId: row.sourceProductId,
    bigCommerceVariantId: row.sourceVariantId,
    writebackStatus: row.status,
  };
}

export type ReconciliationResult = ReconciliationOutcome & {
  writebackLogId: string;
  latestRollbackAttempt: ReturnType<typeof latestRollbackAttempt>;
};

/**
 * Reconciles one writeback log against the live store.
 *
 * `actorPermissions` is passed in so the permission is enforced at the action
 * boundary AND re-asserted here, matching the write and rollback services.
 */
export async function reconcileOneWriteback(args: {
  actorUserId: string;
  actorPermissions: readonly string[];
  writebackLogId: string;
}): Promise<ReconciliationResult> {
  const row = await loadLog(args.writebackLogId);

  if (!args.actorPermissions.includes("pricing.writeback_bigcommerce")) {
    throw new PricingValidationError(
      "You do not have permission to read live BigCommerce prices for reconciliation.",
    );
  }

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_reconciliation_requested",
    entityType: "PriceWritebackLog",
    entityId: row.id,
    afterData: auditContext(row),
  });

  const logLike = toLogLike(row);
  const target = resolveRollbackTarget(logLike);
  if (target == null) {
    const message =
      "The writeback log records no usable BigCommerce target, so its live price cannot be read.";
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "pricing.writeback_reconciliation_failed",
      entityType: "PriceWritebackLog",
      entityId: row.id,
      afterData: { ...auditContext(row), reconciliationStatus: "failed", errorMessage: message },
    });
    throw new PricingValidationError(message);
  }

  const credentialOutcome = await resolveStoreCredentials(row.storeId);
  if (!credentialOutcome.ok) {
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "pricing.writeback_reconciliation_failed",
      entityType: "PriceWritebackLog",
      entityId: row.id,
      afterData: {
        ...auditContext(row),
        reconciliationStatus: "failed",
        errorMessage: credentialOutcome.reason,
      },
    });
    throw new PricingValidationError(credentialOutcome.reason);
  }

  // The ONLY outbound call in this module, and it is a GET.
  const live = await readBigCommercePrice({
    credentials: credentialOutcome.credentials,
    target,
  });
  if (!live.ok) {
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "pricing.writeback_reconciliation_failed",
      entityType: "PriceWritebackLog",
      entityId: row.id,
      afterData: {
        ...auditContext(row),
        reconciliationStatus: "failed",
        errorMessage: live.message,
      },
    });
    throw new PricingValidationError("Could not read the live BigCommerce price: " + live.message);
  }

  const outcome = reconcileWritebackLog({
    log: logLike,
    observedSalePrice: live.snapshot.salePrice,
  });

  // The audit entry IS the stored observation — see operations-read.ts. No
  // column is written and the log's rollback evidence is left untouched, so
  // reconciliation cannot corrupt what a future rollback depends on.
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_reconciliation_completed",
    entityType: "PriceWritebackLog",
    entityId: row.id,
    afterData: {
      ...auditContext(row),
      reconciliationStatus: outcome.status,
      expectedSalePrice: outcome.expectedSalePrice,
      observedSalePrice: outcome.observedSalePrice,
      reason: outcome.reason,
      requiredAction: outcome.requiredAction,
      note: "Read-only observation. No store price was changed.",
    },
  });

  return {
    ...outcome,
    writebackLogId: row.id,
    latestRollbackAttempt: latestRollbackAttempt(row.rollbackPayload),
  };
}
