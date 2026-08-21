/**
 * DP-2 Product List Builder — draft pricing runs.
 *
 * Creates PricingRun and PricingRunItem rows only. Nothing here contacts a
 * competitor website, creates an observation or recommendation, or touches
 * BigCommerce; those arrive in later DP phases behind their own flags.
 *
 * Every mutation re-checks pricing.intelligence so a direct call fails closed,
 * and writes an audit entry. pricing.writebacks is deliberately not referenced.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { requireFeature } from "@/server/services/feature-flags";

import {
  buildItems,
  rankCandidates,
  summarise,
  type BuiltItem,
  type CandidateItem,
  type RankingBasis,
} from "./list-builder";
import { previewUpload, type UploadRow } from "./upload-parser";
import { PricingValidationError } from "./validation";

const num = (value: unknown): number | null =>
  value == null ? null : Number.isFinite(Number(value)) ? Number(value) : null;

/** Multiplier from the most specific enabled rule for the store, else global. */
export async function resolveMinCostMultiplier(storeId: string): Promise<number> {
  const rule =
    (await prisma.pricingRule.findFirst({
      where: { enabled: true, storeId },
      orderBy: { updatedAt: "desc" },
    })) ??
    (await prisma.pricingRule.findFirst({
      where: { enabled: true, storeId: null },
      orderBy: { updatedAt: "desc" },
    }));
  if (!rule) {
    throw new PricingValidationError(
      "No enabled pricing rule found. Seed the default global rule or create one before building a list.",
    );
  }
  return Number(rule.minCostMultiplier);
}

export async function resolveDailyBatchSize(storeId: string): Promise<number> {
  const rule =
    (await prisma.pricingRule.findFirst({ where: { enabled: true, storeId } })) ??
    (await prisma.pricingRule.findFirst({ where: { enabled: true, storeId: null } }));
  return rule?.dailyBatchSize ?? 300;
}

/**
 * Candidate products from already-synced order history.
 *
 * Grouped by productVariantId where present, then productId, then SKU — the
 * fallback chain in the PRD. Cost comes from the variant when known, otherwise
 * the most recent unit cost seen on an order line; the source is recorded
 * either way so a later phase can tell a catalogue cost from an inferred one.
 */
export async function selectTopProducts(args: {
  storeId: string;
  since: Date;
  basis: RankingBasis;
  targetCount: number;
}): Promise<CandidateItem[]> {
  const lines = await prisma.orderItem.findMany({
    where: { order: { storeId: args.storeId, orderDate: { gte: args.since } } },
    // Newest first so the first costed line encountered per bucket IS the most
    // recent one. Without this ordering the "most recent unit cost" fallback
    // took whatever row the database happened to return.
    orderBy: { order: { orderDate: "desc" } },
    select: {
      id: true,
      productId: true,
      productVariantId: true,
      sku: true,
      productName: true,
      quantity: true,
      lineSubtotal: true,
      unitCost: true,
      estimatedGrossProfit: true,
      order: { select: { orderDate: true } },
      productVariant: {
        select: { id: true, sku: true, price: true, salePrice: true, costPrice: true },
      },
    },
  });

  type Bucket = CandidateItem & {
    latestUnitCost: number | null;
    latestCostOrderItemId: string | null;
    latestCostOrderDate: Date | null;
  };
  const buckets = new Map<string, Bucket>();

  for (const line of lines) {
    const key = line.productVariantId ?? line.productId ?? line.sku.trim().toLowerCase();
    if (!key) continue;
    const existing = buckets.get(key);
    const revenue = Number(line.lineSubtotal);
    const profit = num(line.estimatedGrossProfit);

    if (existing) {
      existing.quantitySold += line.quantity;
      existing.revenue += revenue;
      if (profit != null) {
        existing.estimatedGrossProfit = (existing.estimatedGrossProfit ?? 0) + profit;
      }
      // Lines arrive newest-first, so the first costed one wins and later
      // (older) lines must not overwrite it.
      if (existing.latestUnitCost == null) {
        const cost = num(line.unitCost);
        if (cost != null && cost > 0) {
          existing.latestUnitCost = cost;
          existing.latestCostOrderItemId = line.id;
          existing.latestCostOrderDate = line.order?.orderDate ?? null;
        }
      }
      continue;
    }

    const variant = line.productVariant;
    const variantCost = num(variant?.costPrice);
    buckets.set(key, {
      sku: variant?.sku ?? line.sku,
      productId: line.productId,
      productVariantId: line.productVariantId,
      productName: line.productName,
      currentRegularPrice: num(variant?.price),
      currentSalePrice: num(variant?.salePrice),
      costPrice: variantCost,
      costSource: variantCost != null ? "variant" : "none",
      quantitySold: line.quantity,
      revenue,
      estimatedGrossProfit: profit,
      latestUnitCost:
        num(line.unitCost) != null && Number(line.unitCost) > 0 ? num(line.unitCost) : null,
      latestCostOrderItemId:
        num(line.unitCost) != null && Number(line.unitCost) > 0 ? line.id : null,
      latestCostOrderDate:
        num(line.unitCost) != null && Number(line.unitCost) > 0
          ? (line.order?.orderDate ?? null)
          : null,
    });
  }

  const candidates: CandidateItem[] = [...buckets.values()].map((bucket) => {
    const { latestUnitCost, latestCostOrderItemId, latestCostOrderDate, ...rest } = bucket;
    if (rest.costPrice == null && latestUnitCost != null && latestUnitCost > 0) {
      return {
        ...rest,
        costPrice: latestUnitCost,
        costSource: "order_history",
        // Recorded so a later phase — or an auditor — can see exactly which
        // order line an inferred cost came from, and how stale it is.
        costSourceRef: {
          orderItemId: latestCostOrderItemId,
          orderDate: latestCostOrderDate ? latestCostOrderDate.toISOString() : null,
        },
      };
    }
    return rest;
  });

  return rankCandidates(candidates, args.basis, args.targetCount);
}

/** Candidates from an uploaded file, matched to catalogue rows by SKU. */
export async function candidatesFromUpload(args: {
  rows: readonly UploadRow[];
}): Promise<CandidateItem[]> {
  const skus = args.rows.map((row) => row.sku).filter((sku): sku is string => Boolean(sku));
  const variants = skus.length
    ? await prisma.productVariant.findMany({
        where: { sku: { in: skus } },
        select: {
          id: true,
          productId: true,
          sku: true,
          price: true,
          salePrice: true,
          costPrice: true,
        },
      })
    : [];
  const bySku = new Map(variants.map((variant) => [variant.sku.trim().toLowerCase(), variant]));

  return args.rows.map((row) => {
    const sku = row.sku ?? "";
    const match = bySku.get(sku.trim().toLowerCase());
    // Uploaded cost wins over the catalogue: the operator is asserting a cost
    // they hold, often fresher than the last sync.
    const costPrice = row.costPrice ?? num(match?.costPrice);
    return {
      sku,
      productId: match?.productId ?? row.productId ?? null,
      productVariantId: match?.id ?? row.variantId ?? null,
      productName: row.productName,
      currentRegularPrice: row.currentRegularPrice ?? num(match?.price),
      currentSalePrice: row.currentSalePrice ?? num(match?.salePrice),
      costPrice,
      costSource: row.costPrice != null ? "upload" : costPrice != null ? "variant" : "none",
      quantitySold: 0,
      revenue: 0,
      estimatedGrossProfit: null,
      uploadMeta: {
        uploadRow: row.line,
        competitorUrl: row.competitorUrl,
        supplierSku: row.supplierSku,
        notes: row.notes,
        store: row.store,
        // Only recorded when the SKU did not match a catalogue variant; a
        // matched row already has the real ids in its own columns.
        uploadedProductId: match ? null : row.productId,
        uploadedVariantId: match ? null : row.variantId,
        parseErrors: row.errors.length ? row.errors : undefined,
      },
    } satisfies CandidateItem;
  });
}

export type CreateRunArgs = {
  actorUserId: string;
  storeId: string;
  sourceType: "upload" | "top_products";
  rankingBasis?: RankingBasis | null;
  lookbackWindow?: string | null;
  targetCount?: number | null;
  dailyBatchSize: number;
  items: readonly BuiltItem[];
};

/** Persists a draft run and its items in one transaction, then audits it. */
export async function createDraftPricingRun(args: CreateRunArgs): Promise<string> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  if (args.items.length === 0) {
    throw new PricingValidationError("Nothing to add — the selection produced no rows.");
  }

  const summary = summarise(args.items);
  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.pricingRun.create({
      data: {
        storeId: args.storeId,
        sourceType: args.sourceType,
        rankingBasis: args.rankingBasis ?? null,
        lookbackWindow: args.lookbackWindow ?? null,
        targetCount: args.targetCount ?? null,
        dailyBatchSize: args.dailyBatchSize,
        status: "draft",
        createdById: args.actorUserId,
        metadata: summary,
      },
    });
    await tx.pricingRunItem.createMany({
      data: args.items.map((item) => ({
        pricingRunId: created.id,
        storeId: args.storeId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        sku: item.sku,
        productName: item.productName,
        currentRegularPrice: item.currentRegularPrice,
        currentSalePrice: item.currentSalePrice,
        currentEffectivePrice: item.currentEffectivePrice,
        costPrice: item.costPrice,
        costSource: item.costSource,
        floorPrice: item.floorPrice,
        status: item.status,
        blockedReason: item.blockedReason,
        // Everything the source carried that has no column of its own. Kept so
        // the run is reproducible and a later phase does not need the original
        // file to know which competitor URL or supplier SKU a row came from.
        metadata:
          item.costSourceRef || item.uploadMeta
            ? { costSourceRef: item.costSourceRef ?? null, upload: item.uploadMeta ?? null }
            : undefined,
      })),
    });
    return created;
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.run_created",
    entityType: "PricingRun",
    entityId: run.id,
    afterData: {
      storeId: args.storeId,
      sourceType: args.sourceType,
      rankingBasis: args.rankingBasis ?? null,
      targetCount: args.targetCount ?? null,
      dailyBatchSize: args.dailyBatchSize,
      ...summary,
    },
  });
  return run.id;
}

export async function recordUploadProcessed(args: {
  actorUserId: string;
  fileName: string;
  rows: readonly UploadRow[];
  accepted: boolean;
  reason?: string;
}): Promise<void> {
  const preview = previewUpload(args.rows);
  await writeAudit({
    actorUserId: args.actorUserId,
    action: args.accepted ? "pricing.upload_processed" : "pricing.upload_rejected",
    entityType: "PricingRun",
    entityId: args.fileName,
    afterData: { fileName: args.fileName, reason: args.reason ?? null, ...preview },
  });
}

export async function cancelDraftPricingRun(args: {
  actorUserId: string;
  runId: string;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);
  const run = await prisma.pricingRun.findUniqueOrThrow({ where: { id: args.runId } });
  if (run.status !== "draft") {
    throw new PricingValidationError("Only a draft run can be cancelled.");
  }
  await prisma.pricingRun.update({ where: { id: run.id }, data: { status: "cancelled" } });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "pricing.run_cancelled",
    entityType: "PricingRun",
    entityId: run.id,
    beforeData: { status: run.status },
    afterData: { status: "cancelled" },
  });
}

export async function listPricingRuns() {
  return prisma.pricingRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      store: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { items: true } },
    },
  });
}

export async function getPricingRun(id: string) {
  return prisma.pricingRun.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        orderBy: [{ status: "asc" }, { sku: "asc" }],
        take: 2000,
        include: {
          // Newest first so the run page shows the latest attempt per item.
          observations: {
            orderBy: { checkedAt: "desc" },
            take: 5,
            include: { competitor: { select: { id: true, name: true } } },
          },
        },
      },
      _count: { select: { items: true } },
    },
  });
}

export { buildItems, summarise };
