/**
 * DP-6B controlled rollback of a BigCommerce sale-price writeback.
 *
 * A rollback is a live price change, so this module is as dangerous as
 * writeback.ts and carries the same controls: all three flags, the
 * pricing.writeback_bigcommerce permission re-asserted inside the service, one
 * writeback log per explicit user action, and a mandatory store read before
 * anything is sent.
 *
 * The distinguishing rule is the mismatch check. Rollback restores a price
 * captured at DP-6 write time. If the live price has moved since, that was
 * someone else's decision, and DP-6B refuses rather than reverting it. There is
 * no override flag here — adding one is a product-owner decision, not a
 * convenience.
 *
 * READ-ONLY helpers live in rollback-read.ts (the DP-6A split), so no page
 * render loads this module. Only the rollback server action may import it.
 */
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import {
  buildSalePriceRequestPayload,
  readBigCommercePrice,
  resolveStoreCredentials,
  writeBigCommerceSalePrice,
} from "@/server/integrations/bigcommerce/price-writeback";
import { logger } from "@/server/logger";

import {
  canRollBackAfterRead,
  canRollBackBeforeRead,
  type RollbackTarget,
} from "./rollback-eligibility";
import { flagsBlockingWriteback } from "./writeback-read";
import { PricingValidationError } from "./validation";

const num = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const json = (value: unknown) => JSON.parse(JSON.stringify(value ?? null)) as never;

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

function auditContext(row: Loaded, extra: Record<string, unknown> = {}) {
  return {
    writebackLogId: row.id,
    recommendationId: row.recommendationId,
    storeId: row.storeId,
    sku: row.recommendation?.pricingRunItem?.sku ?? null,
    productId: row.productId,
    productVariantId: row.productVariantId,
    bigCommerceProductId: row.sourceProductId,
    bigCommerceVariantId: row.sourceVariantId,
    originalOldSalePrice: num(row.oldSalePrice),
    writtenSalePrice: num(row.newSalePrice),
    ...extra,
  };
}

async function auditRefusal(args: {
  actorUserId: string;
  row: Loaded;
  reason: string;
  message: string;
  extra?: Record<string, unknown>;
}): Promise<void> {
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_rollback_refused",
    entityType: "PriceWritebackLog",
    entityId: args.row.id,
    beforeData: { status: args.row.status, rollbackAt: args.row.rollbackAt },
    afterData: {
      ...auditContext(args.row, args.extra ?? {}),
      refusedBecause: args.reason,
      message: args.message,
    },
  });
}

/** Merges a rollback attempt into the existing evidence without losing it. */
function mergeRollbackPayload(existing: unknown, attempt: Record<string, unknown>): unknown {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  const attempts = Array.isArray(base.rollbackAttempts) ? base.rollbackAttempts : [];
  // Appended rather than replaced: a refused or failed attempt is part of the
  // record, and the DP-6 pre-write evidence must survive untouched.
  return { ...base, rollbackAttempts: [...attempts, attempt] };
}

export type RollbackResult = {
  writebackLogId: string;
  status: "rolled_back" | "failed";
  restoredSalePrice: number;
  message: string;
};

/**
 * Rolls one successful writeback back to its recorded prior sale price.
 *
 * `actorPermissions` is passed in so the permission is enforced at the action
 * boundary AND re-asserted here: this function must not be callable with a
 * price and no proof of authority.
 */
export async function rollBackWriteback(args: {
  actorUserId: string;
  actorPermissions: readonly string[];
  writebackLogId: string;
  now?: Date;
}): Promise<RollbackResult> {
  const now = args.now ?? new Date();
  const row = await loadLog(args.writebackLogId);

  // ---- Gate 1: permission -------------------------------------------------
  if (!args.actorPermissions.includes("pricing.writeback_bigcommerce")) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      reason: "missing_permission",
      message: "Caller lacks pricing.writeback_bigcommerce.",
    });
    throw new PricingValidationError(
      "You do not have permission to change BigCommerce prices. Rolling back is a price change too.",
    );
  }

  // ---- Gate 2: all three flags -------------------------------------------
  const off = await flagsBlockingWriteback();
  if (off.length > 0) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      reason: "feature_disabled",
      message: "Disabled flags: " + off.join(", "),
    });
    throw new PricingValidationError(
      "Rollback is disabled. These flags must all be on: " +
        off.join(", ") +
        ". If the kill switch was tripped, that is why.",
    );
  }

  // ---- Gate 3: everything decidable without contacting the store ---------
  const verdict = canRollBackBeforeRead({
    log: {
      status: row.status,
      rollbackAt: row.rollbackAt,
      rollbackPayload: row.rollbackPayload,
      sourceSystem: row.sourceSystem,
      sourceProductId: row.sourceProductId,
      sourceVariantId: row.sourceVariantId,
      oldSalePrice: num(row.oldSalePrice),
      newSalePrice: num(row.newSalePrice),
    },
    recommendation: row.recommendation ? { status: row.recommendation.status } : null,
  });
  if (!verdict.allowed) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      reason: verdict.reason,
      message: verdict.message,
    });
    throw new PricingValidationError(verdict.message);
  }
  const target: RollbackTarget = verdict.target;
  const restoreTo = verdict.salePrice;

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_rollback_requested",
    entityType: "PriceWritebackLog",
    entityId: row.id,
    beforeData: { status: row.status },
    afterData: auditContext(row, { intendedRollbackSalePrice: restoreTo, target }),
  });

  // ---- Gate 4: credentials for THIS store --------------------------------
  const credentialOutcome = await resolveStoreCredentials(row.storeId);
  if (!credentialOutcome.ok) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      reason: "missing_credentials",
      message: credentialOutcome.reason,
    });
    throw new PricingValidationError(credentialOutcome.reason);
  }
  const credentials = credentialOutcome.credentials;

  // ---- Gate 5: pre-rollback read -----------------------------------------
  const before = await readBigCommercePrice({ credentials, target });
  if (!before.ok) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      reason: "pre_rollback_read_failed",
      message: before.message,
    });
    throw new PricingValidationError(
      "Could not read the current BigCommerce price, so it cannot be confirmed that this " +
        "writeback is still the live value. Refusing to roll back. " +
        before.message,
    );
  }
  const liveSalePrice = before.snapshot.salePrice;

  // ---- Gate 6: the live price must still be what DP-6 wrote --------------
  const matchVerdict = canRollBackAfterRead({
    log: {
      status: row.status,
      rollbackAt: row.rollbackAt,
      rollbackPayload: row.rollbackPayload,
      sourceSystem: row.sourceSystem,
      sourceProductId: row.sourceProductId,
      sourceVariantId: row.sourceVariantId,
      oldSalePrice: num(row.oldSalePrice),
      newSalePrice: num(row.newSalePrice),
    },
    liveSalePrice,
  });
  if (!matchVerdict.allowed) {
    await prisma.priceWritebackLog.update({
      where: { id: row.id },
      data: {
        rollbackPayload: json(
          mergeRollbackPayload(row.rollbackPayload, {
            attemptedAt: now.toISOString(),
            actorUserId: args.actorUserId,
            outcome: "refused",
            reason: matchVerdict.reason,
            liveSalePriceBeforeRollback: liveSalePrice,
            writtenSalePrice: num(row.newSalePrice),
            intendedRollbackSalePrice: restoreTo,
          }),
        ),
      },
    });
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      reason: matchVerdict.reason,
      message: matchVerdict.message,
      extra: { liveSalePriceBeforeRollback: liveSalePrice },
    });
    throw new PricingValidationError(matchVerdict.message);
  }

  // Evidence of the attempt is recorded BEFORE the request, mirroring DP-6:
  // if the process dies mid-call, the record shows a rollback may have landed.
  const requestPayload = buildSalePriceRequestPayload({ target, salePrice: restoreTo });
  await prisma.priceWritebackLog.update({
    where: { id: row.id },
    data: {
      rollbackPayload: json(
        mergeRollbackPayload(row.rollbackPayload, {
          attemptedAt: now.toISOString(),
          actorUserId: args.actorUserId,
          outcome: "in_flight",
          target,
          liveSalePriceBeforeRollback: liveSalePrice,
          writtenSalePrice: num(row.newSalePrice),
          intendedRollbackSalePrice: restoreTo,
          requestPayload,
        }),
      ),
    },
  });

  // ---- The call ----------------------------------------------------------
  const outcome = await writeBigCommerceSalePrice({
    credentials,
    target,
    salePrice: restoreTo,
  });

  const attemptBase = {
    attemptedAt: now.toISOString(),
    actorUserId: args.actorUserId,
    target,
    liveSalePriceBeforeRollback: liveSalePrice,
    writtenSalePrice: num(row.newSalePrice),
    intendedRollbackSalePrice: restoreTo,
    requestPayload,
  };

  if (!outcome.ok) {
    // The log stays `succeeded`. The DP-6 write really did happen and is still
    // the live state; only the attempt to undo it failed. Marking the log
    // rolled_back would claim a store change that never occurred.
    await prisma.priceWritebackLog.update({
      where: { id: row.id },
      data: {
        rollbackPayload: json(
          mergeRollbackPayload(row.rollbackPayload, {
            ...attemptBase,
            outcome: "failed",
            errorMessage: outcome.message,
            responsePayload: outcome.response ?? { status: outcome.status },
          }),
        ),
      },
    });
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "pricing.writeback_rollback_failed",
      entityType: "PriceWritebackLog",
      entityId: row.id,
      beforeData: { status: row.status, rollbackAt: row.rollbackAt },
      afterData: {
        ...auditContext(row, {
          liveSalePriceBeforeRollback: liveSalePrice,
          intendedRollbackSalePrice: restoreTo,
        }),
        writebackStatus: row.status,
        errorMessage: outcome.message,
        responsePayload: outcome.response ?? null,
      },
    });
    logger.error(
      { writebackLogId: row.id, storeId: row.storeId, message: outcome.message },
      "pricing writeback rollback failed",
    );

    return {
      writebackLogId: row.id,
      status: "failed",
      restoredSalePrice: restoreTo,
      message: outcome.message,
    };
  }

  const rolledBackAt = new Date();
  await prisma.priceWritebackLog.update({
    where: { id: row.id },
    data: {
      status: "rolled_back",
      rollbackAt: rolledBackAt,
      rollbackPayload: json(
        mergeRollbackPayload(row.rollbackPayload, {
          ...attemptBase,
          outcome: "rolled_back",
          rolledBackAt: rolledBackAt.toISOString(),
          responsePayload: outcome.response,
          salePriceReportedByStore: outcome.salePriceAfter,
        }),
      ),
    },
  });

  // PriceRecommendation and PricingRunItem deliberately keep `written_back`.
  // The writeback IS historical fact — it happened — and the log's rolled_back
  // status is where the current state lives. Inventing a recommendation status
  // would need an enum migration for something the log already expresses.
  // The local ProductVariant price is likewise untouched; BigCommerce owns it
  // and the next sync brings the value back.
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_rollback_succeeded",
    entityType: "PriceWritebackLog",
    entityId: row.id,
    beforeData: { status: row.status, rollbackAt: row.rollbackAt },
    afterData: {
      ...auditContext(row, {
        liveSalePriceBeforeRollback: liveSalePrice,
        rollbackSalePrice: restoreTo,
      }),
      writebackStatus: "rolled_back",
      rollbackAt: rolledBackAt,
      salePriceReportedByStore: outcome.salePriceAfter,
      responsePayload: outcome.response ?? null,
      note: "Store sale price restored. Recommendation stays written_back; the log records the rollback.",
    },
  });

  return {
    writebackLogId: row.id,
    status: "rolled_back",
    restoredSalePrice: restoreTo,
    message:
      "Sale price restored to $" +
      restoreTo.toFixed(2) +
      " in BigCommerce. The local catalogue value updates on the next product sync.",
  };
}
