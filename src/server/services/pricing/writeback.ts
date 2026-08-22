/**
 * DP-6 controlled BigCommerce sale-price writeback.
 *
 * THE ONLY MODULE IN THE APPLICATION THAT CHANGES A STOREFRONT PRICE.
 *
 * Every earlier Pricing Intelligence phase was read-only or internal. This one
 * is not, so the controls are stacked rather than chosen:
 *
 *   1. pricing.intelligence, pricing.writebacks, and external.writebacks must
 *      ALL be on. Requiring all three is also the kill-switch integration —
 *      tripping it turns the last two off, which stops writes here.
 *   2. The caller must hold pricing.writeback_bigcommerce. Approving a
 *      recommendation is explicitly not enough.
 *   3. The recommendation must be approved, unexpired, above floor, mapped to
 *      a BigCommerce record, and not already written.
 *   4. A PriceWritebackLog row exists BEFORE the request goes out, carrying the
 *      old price, so a crash mid-write still leaves rollback evidence.
 *   5. A pre-write read of the live price must succeed. Without it there is
 *      nothing to restore, and a writeback with no rollback story is a one-way
 *      change to a customer-facing price.
 *
 * One recommendation per explicit user action. There is no loop, no batch, no
 * scheduler, and no Inngest function in this file — deliberately, so no code
 * path can reprice a catalogue without a human pressing a button each time.
 *
 * Only `sale_price` is written. Regular price, cost, inventory, and content are
 * untouched, and the client module offers no method that could change them.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import {
  buildSalePriceRequestPayload,
  readBigCommercePrice,
  resolveStoreCredentials,
  writeBigCommerceSalePrice,
} from "@/server/integrations/bigcommerce/price-writeback";
import { logger } from "@/server/logger";
import { isFeatureOn } from "@/server/services/feature-flags";

import { PricingValidationError } from "./validation";
import {
  canWriteBack,
  describeMissingMapping,
  REQUIRED_WRITEBACK_FLAGS,
  resolveBigCommerceTarget,
  type ResolvedTarget,
  type WritebackVerdict,
} from "./writeback-eligibility";

const num = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const json = (value: unknown) => JSON.parse(JSON.stringify(value ?? null)) as never;

async function loadRecommendation(recommendationId: string) {
  const row = await prisma.priceRecommendation.findUnique({
    where: { id: recommendationId },
    include: {
      writebackLogs: { orderBy: { createdAt: "desc" }, select: { id: true, status: true } },
      pricingRunItem: {
        select: {
          id: true,
          sku: true,
          status: true,
          blockedReason: true,
          storeId: true,
          productId: true,
          productVariantId: true,
          product: { select: { id: true, sourceSystem: true, sourceId: true } },
          productVariant: { select: { id: true, sourceSystem: true, sourceId: true } },
        },
      },
    },
  });
  if (!row) throw new PricingValidationError("Recommendation not found.");
  return row;
}

type Loaded = Awaited<ReturnType<typeof loadRecommendation>>;

function auditContext(row: Loaded, target: ResolvedTarget | null) {
  const item = row.pricingRunItem;
  return {
    recommendationId: row.id,
    pricingRunItemId: row.pricingRunItemId,
    storeId: item?.storeId ?? null,
    sku: item?.sku ?? null,
    productId: item?.productId ?? null,
    productVariantId: item?.productVariantId ?? null,
    bigCommerceProductId: target?.productId ?? null,
    bigCommerceVariantId: target?.scope === "variant" ? target.variantId : null,
    oldRegularPrice: num(row.oldRegularPrice),
    oldSalePrice: num(row.oldSalePrice),
    newSalePrice: num(row.recommendedSalePrice),
    floorPrice: num(row.floorPrice),
    costPrice: num(row.costPrice),
  };
}

async function auditRefusal(args: {
  actorUserId: string;
  row: Loaded;
  target: ResolvedTarget | null;
  reason: string;
  message: string;
}): Promise<void> {
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_refused",
    entityType: "PriceRecommendation",
    entityId: args.row.id,
    beforeData: { status: args.row.status },
    afterData: {
      ...auditContext(args.row, args.target),
      refusedBecause: args.reason,
      message: args.message,
    },
  });
}

/**
 * Checks the three flags together and names the one that is off.
 *
 * Reported as a refusal rather than thrown as FeatureDisabledError so the
 * refusal lands in the audit log like every other one: an attempted price
 * change that was stopped is exactly what a reviewer wants to see.
 */
async function flagsBlocking(): Promise<string[]> {
  const off: string[] = [];
  for (const flag of REQUIRED_WRITEBACK_FLAGS) {
    if (!(await isFeatureOn(flag))) off.push(flag);
  }
  return off;
}

export type WritebackResult = {
  writebackLogId: string;
  status: "succeeded" | "failed";
  oldSalePrice: number | null;
  newSalePrice: number;
  message: string;
};

/**
 * Writes one approved recommendation's sale price to BigCommerce.
 *
 * `actorPermissions` is passed in rather than read here so the permission check
 * is enforced at the action boundary AND re-asserted at the service boundary:
 * this function must not be callable with a price and no proof of authority.
 */
export async function writeRecommendationToBigCommerce(args: {
  actorUserId: string;
  actorPermissions: readonly string[];
  recommendationId: string;
  now?: Date;
}): Promise<WritebackResult> {
  const now = args.now ?? new Date();
  const row = await loadRecommendation(args.recommendationId);
  const item = row.pricingRunItem;

  // ---- Gate 1: permission, re-asserted independently of the action layer ----
  if (!args.actorPermissions.includes("pricing.writeback_bigcommerce")) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: null,
      reason: "missing_permission",
      message: "Caller lacks pricing.writeback_bigcommerce.",
    });
    throw new PricingValidationError(
      "You do not have permission to write prices to BigCommerce. Approving a recommendation does not grant it.",
    );
  }

  // ---- Gate 2: all three flags -------------------------------------------
  const off = await flagsBlocking();
  if (off.length > 0) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: null,
      reason: "feature_disabled",
      message: "Disabled flags: " + off.join(", "),
    });
    throw new PricingValidationError(
      "Writeback is disabled. These flags must all be on: " +
        off.join(", ") +
        ". If the kill switch was tripped, that is why.",
    );
  }

  // ---- Gate 3: eligibility ------------------------------------------------
  const target = resolveBigCommerceTarget({
    product: item?.product ?? null,
    variant: item?.productVariant ?? null,
    variantScoped: item?.productVariantId != null,
  });
  const verdict: WritebackVerdict = canWriteBack({
    recommendation: {
      status: row.status,
      approvedById: row.approvedById,
      approvedAt: row.approvedAt,
      recommendedSalePrice: num(row.recommendedSalePrice),
      floorPrice: num(row.floorPrice),
      costPrice: num(row.costPrice),
      expiresAt: row.expiresAt,
    },
    item: item
      ? { status: item.status, blockedReason: item.blockedReason, storeId: item.storeId }
      : null,
    existingLogs: row.writebackLogs,
    target,
    missingMappingMessage: describeMissingMapping({
      product: item?.product ?? null,
      variant: item?.productVariant ?? null,
      variantScoped: item?.productVariantId != null,
    }),
    now,
  });
  if (!verdict.allowed) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target,
      reason: verdict.reason,
      message: verdict.message,
    });
    throw new PricingValidationError(verdict.message);
  }

  // Narrowed by canWriteBack; re-read for the type checker.
  const storeId = item!.storeId!;
  const newSalePrice = num(row.recommendedSalePrice)!;
  const resolvedTarget = target!;

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_requested",
    entityType: "PriceRecommendation",
    entityId: row.id,
    beforeData: { status: row.status },
    afterData: auditContext(row, resolvedTarget),
  });

  // ---- Gate 4: credentials for THIS store --------------------------------
  const credentialOutcome = await resolveStoreCredentials(storeId);
  if (!credentialOutcome.ok) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: resolvedTarget,
      reason: "missing_credentials",
      message: credentialOutcome.reason,
    });
    throw new PricingValidationError(credentialOutcome.reason);
  }
  const credentials = credentialOutcome.credentials;

  // ---- Gate 5: pre-write read, so rollback evidence exists ---------------
  const before = await readBigCommercePrice({ credentials, target: resolvedTarget });
  if (!before.ok) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: resolvedTarget,
      reason: "pre_write_read_failed",
      message: before.message,
    });
    throw new PricingValidationError(
      "Could not read the current BigCommerce price, so there would be nothing to roll back to. " +
        "Refusing to write. " +
        before.message,
    );
  }

  const requestPayload = buildSalePriceRequestPayload({
    target: resolvedTarget,
    salePrice: newSalePrice,
  });

  // The log row is written BEFORE the request leaves. If the process dies
  // mid-call, the queued row plus its rollback payload is the record that a
  // write may have landed — a log written afterwards would lose exactly that.
  const log = await prisma.priceWritebackLog.create({
    data: {
      recommendationId: row.id,
      storeId,
      productId: item!.productId,
      productVariantId: item!.productVariantId,
      sourceSystem: "bigcommerce",
      sourceProductId: resolvedTarget.productId,
      sourceVariantId: resolvedTarget.scope === "variant" ? resolvedTarget.variantId : null,
      // Local values are the fallback; the live read is the authority, since
      // the local mirror may lag the store.
      oldRegularPrice: before.snapshot.price ?? num(row.oldRegularPrice),
      oldSalePrice: before.snapshot.salePrice ?? num(row.oldSalePrice),
      newSalePrice,
      status: "queued",
      requestPayload: json(requestPayload),
      rollbackPayload: json({
        capturedAt: now.toISOString(),
        target: resolvedTarget,
        liveBefore: before.snapshot,
        localBefore: {
          oldRegularPrice: num(row.oldRegularPrice),
          oldSalePrice: num(row.oldSalePrice),
        },
      }),
      writtenById: args.actorUserId,
    },
    select: { id: true },
  });

  // ---- The call ----------------------------------------------------------
  const outcome = await writeBigCommerceSalePrice({
    credentials,
    target: resolvedTarget,
    salePrice: newSalePrice,
  });

  if (!outcome.ok) {
    await prisma.priceWritebackLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        errorMessage: outcome.message,
        responsePayload: json(outcome.response ?? { status: outcome.status }),
      },
    });

    // The recommendation stays `approved`, not `failed`. The recommendation is
    // still a sound proposal; what failed is one attempt to deliver it, and
    // that lives on the log. Marking the recommendation failed would destroy
    // the approval a human gave and force a re-approval for a network blip.
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "pricing.writeback_failed",
      entityType: "PriceRecommendation",
      entityId: row.id,
      beforeData: { status: row.status, writebackStatus: "queued" },
      afterData: {
        ...auditContext(row, resolvedTarget),
        writebackLogId: log.id,
        writebackStatus: "failed",
        recommendationStatus: row.status,
        errorMessage: outcome.message,
      },
    });
    logger.error(
      { recommendationId: row.id, writebackLogId: log.id, storeId, message: outcome.message },
      "pricing writeback failed",
    );

    return {
      writebackLogId: log.id,
      status: "failed",
      oldSalePrice: before.snapshot.salePrice,
      newSalePrice,
      message: outcome.message,
    };
  }

  const writtenAt = new Date();
  await prisma.priceWritebackLog.update({
    where: { id: log.id },
    data: {
      status: "succeeded",
      responsePayload: json(outcome.response),
      writtenAt,
    },
  });
  await prisma.priceRecommendation.update({
    where: { id: row.id },
    data: { status: "written_back" },
  });
  await prisma.pricingRunItem.update({
    where: { id: row.pricingRunItemId },
    data: { status: "written_back" },
  });

  // The local ProductVariant price is deliberately NOT updated here. This app
  // treats BigCommerce as the source of truth for catalogue prices and syncs
  // them inward; writing the local mirror from this side would create a second
  // writer for a field the sync owns, and mask a write that silently did not
  // take. The next product sync brings the value back.
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.writeback_succeeded",
    entityType: "PriceRecommendation",
    entityId: row.id,
    beforeData: { status: row.status, writebackStatus: "queued" },
    afterData: {
      ...auditContext(row, resolvedTarget),
      writebackLogId: log.id,
      writebackStatus: "succeeded",
      recommendationStatus: "written_back",
      salePriceReportedByStore: outcome.salePriceAfter,
      writtenAt,
    },
  });

  return {
    writebackLogId: log.id,
    status: "succeeded",
    oldSalePrice: before.snapshot.salePrice,
    newSalePrice,
    message:
      "Sale price written to BigCommerce. The local catalogue value updates on the next product sync.",
  };
}

/** Writeback history for one recommendation, for the detail page. */
export async function listWritebackLogs(recommendationId: string) {
  return prisma.priceWritebackLog.findMany({
    where: { recommendationId },
    orderBy: { createdAt: "desc" },
    include: { writtenBy: { select: { id: true, name: true, email: true } } },
  });
}

/** Whether writeback is currently possible at all, for UI explanation. */
export async function writebackFlagState(): Promise<{ enabled: boolean; disabledFlags: string[] }> {
  const disabledFlags = await flagsBlocking();
  return { enabled: disabledFlags.length === 0, disabledFlags };
}

export { FEATURE_FLAGS };
