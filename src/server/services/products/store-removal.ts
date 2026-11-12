/**
 * Retiring catalogue products the store no longer lists (2026-11-11).
 *
 * THE ONLY MODULE THAT SETS `deletedAt` ON A PRODUCT. A retired product keeps
 * its row, its variants, its order lines, its publish logs and its Product
 * Studio projects; it leaves the products list, the population counts, the
 * link search and every publish target. Nothing is ever hard-deleted: order
 * history and publish evidence point at the row, and a listing BigCommerce
 * deletes never comes back under the same id, so there is nothing to restore
 * it for. The next full catalogue walk that does return the id clears the
 * mark (the mapper's update sets `deletedAt` back to null), so the mark can
 * never outlive the evidence for it.
 *
 * Three callers, all with the store's own word for it:
 *   - the publish service, when its pre-write read of the listing gets a 404
 *     from BigCommerce (`noticedBy: "publish_read_404"`);
 *   - the full catalogue sync, for every live product a complete walk did not
 *     return (`noticedBy: "full_catalog_sync"`), under the guards in
 *     catalog-retirement.ts;
 *   - the operator's script `pnpm catalog:retire-removed`, which re-reads each
 *     product a publish was refused for and retires the ones the store still
 *     answers 404 to (`noticedBy: "listing_check_404"`).
 *
 * Every retirement is audited as `product.retired_from_store`, one row per
 * product up to a cap and a summary row beyond it.
 */
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { logger } from "@/server/logger";

import { invalidateProductPopulation } from "./index";

export type RetirementNotice = "publish_read_404" | "full_catalog_sync" | "listing_check_404";

/** Per-product audit rows are written up to this many; the rest share one summary row. */
export const RETIREMENT_AUDIT_ROW_CAP = 100;

export type RetirementResult = {
  /** Products that were live and are now retired. */
  retired: { id: string; sourceId: string | null; sku: string | null; name: string }[];
  /** Ids that were already retired or do not exist; nothing was changed for them. */
  skipped: number;
};

export async function retireProductsRemovedFromStore(args: {
  productIds: readonly string[];
  noticedBy: RetirementNotice;
  /** The person whose action surfaced the removal, when one did. */
  actorUserId?: string | null;
  /** Where the evidence lives: the sync log or the Product Studio project. */
  evidence: { syncLogId?: string; projectId?: string; storeId?: string; message?: string };
}): Promise<RetirementResult> {
  const ids = [...new Set(args.productIds)];
  if (ids.length === 0) return { retired: [], skipped: 0 };

  const live = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, sourceId: true, sku: true, name: true, storeId: true },
  });
  if (live.length === 0) return { retired: [], skipped: ids.length };

  const retiredAt = new Date();
  await prisma.product.updateMany({
    where: { id: { in: live.map((product) => product.id) }, deletedAt: null },
    data: { deletedAt: retiredAt },
  });
  invalidateProductPopulation();

  const common = {
    noticedBy: args.noticedBy,
    retiredAt: retiredAt.toISOString(),
    ...args.evidence,
  };
  const detailed = live.slice(0, RETIREMENT_AUDIT_ROW_CAP);
  for (const product of detailed) {
    await writeAudit({
      actorUserId: args.actorUserId ?? null,
      action: "product.retired_from_store",
      entityType: "Product",
      entityId: product.id,
      beforeData: { deletedAt: null },
      afterData: {
        ...common,
        storeId: product.storeId ?? args.evidence.storeId ?? null,
        bigCommerceProductId: product.sourceId,
        sku: product.sku,
        name: product.name,
      },
    });
  }
  const rest = live.slice(RETIREMENT_AUDIT_ROW_CAP);
  if (rest.length > 0) {
    await writeAudit({
      actorUserId: args.actorUserId ?? null,
      action: "product.retired_from_store",
      entityType: "Store",
      entityId: args.evidence.storeId ?? rest[0]!.storeId ?? "unknown",
      afterData: {
        ...common,
        summaryOf: rest.length,
        products: rest.map((product) => ({
          id: product.id,
          bigCommerceProductId: product.sourceId,
          sku: product.sku,
        })),
      },
    });
  }
  logger.info(
    { retired: live.length, skipped: ids.length - live.length, noticedBy: args.noticedBy },
    "products retired: the store no longer lists them",
  );
  return {
    retired: live.map(({ storeId: _storeId, ...product }) => product),
    skipped: ids.length - live.length,
  };
}
