import type { Prisma, ProductStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type ListProductsFilters = {
  storeId?: string;
  /** Scopes to one operating division, mirroring the shell's Division selector. */
  divisionId?: string;
  categoryId?: string;
  status?: ProductStatus;
  imageStatus?: "missing" | "needs_review";
  search?: string;
  /** 1-based. Out-of-range values are clamped by the caller, not here. */
  page?: number;
};

/** Matches CUSTOMERS_PAGE_SIZE so the list pages behave alike. */
export const PRODUCTS_PAGE_SIZE = 50;

/**
 * Filter clause shared by listProducts and countProducts.
 *
 * Extracted deliberately: the two must agree exactly, or the pagination
 * footer computes its page count from a different population than the rows
 * it is paging through.
 */
function productWhere(filters: ListProductsFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.divisionId) where.divisionId = filters.divisionId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;
  if (filters.imageStatus === "missing") where.imageStatus = "missing";
  if (filters.imageStatus === "needs_review") where.imageStatus = "needs_review";
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

/** Total matching the same filters as listProducts — drives the header count and paging. */
export async function countProducts(filters: ListProductsFilters = {}): Promise<number> {
  return prisma.product.count({ where: productWhere(filters) });
}

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

/**
 * A cost only counts if it is strictly positive.
 *
 * Guards two distinct traps: a Prisma `Decimal` is an object and therefore
 * always truthy — `Decimal(0)` included — and a raw 0 is a real number that
 * would produce a 100% margin if treated as a known cost.
 */
const positiveOrNull = (d: Prisma.Decimal | null | undefined): number | null => {
  if (d == null) return null;
  const n = Number(d);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const numOrNull = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

export async function listProducts(filters: ListProductsFilters = {}) {
  const where = productWhere(filters);
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const products = await prisma.product.findMany({
    where,
    // `id` breaks ties so paging is stable: without it, two products sharing a
    // name can swap between pages and one is silently never shown.
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }, { id: "asc" }],
    skip: (page - 1) * PRODUCTS_PAGE_SIZE,
    take: PRODUCTS_PAGE_SIZE,
    include: {
      store: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      variants: {
        select: { id: true, sku: true, price: true, costPrice: true, stockLevel: true },
      },
      supplierProducts: {
        where: { isPreferred: true },
        select: { id: true, cost: true, supplier: { select: { name: true, code: true } } },
        take: 1,
      },
    },
  });

  return products.map((p) => {
    // Aggregate price/cost from first variant (primary)
    const primary = p.variants[0];
    const price = primary ? num(primary.price) : 0;
    // A zero cost means "not known", never "free". BigCommerce leaves
    // cost_price at 0 when it is unpopulated — true of 50,024 of 50,053
    // variants in production — and the previous truthiness check treated a
    // Prisma Decimal(0), which is a truthy object, as a real cost of $0.00.
    // Every such product then reported a 100% margin (docs/35 F-16).
    //
    // This matches how the rest of the system already reads cost: `positive()`
    // in the pricing engine requires > 0, and the pricing upload parser
    // "treats a zero cost as absent, never as a zero floor".
    const cost =
      positiveOrNull(primary?.costPrice) ?? positiveOrNull(p.supplierProducts[0]?.cost) ?? null;
    const margin = cost != null && price > 0 ? (price - cost) / price : null;
    const stock = p.variants.reduce((sum, v) => sum + (v.stockLevel ?? 0), 0);

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      brand: p.brand,
      status: p.status,
      imageStatus: p.imageStatus,
      descriptionStatus: p.descriptionStatus,
      isFeatured: p.isFeatured,
      isRockstarCandidate: p.isRockstarCandidate,
      store: p.store,
      category: p.category,
      variantCount: p.variants.length,
      primarySupplier: p.supplierProducts[0]?.supplier ?? null,
      price,
      cost,
      margin,
      stock,
    };
  });
}

export type ProductListRow = Awaited<ReturnType<typeof listProducts>>[number];

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      store: true,
      division: true,
      category: true,
      variants: { orderBy: { sku: "asc" } },
      supplierProducts: {
        include: { supplier: true },
        orderBy: [{ isPreferred: "desc" }, { cost: "asc" }],
      },
    },
  });
  if (!product) return null;

  // Sales metrics — last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const salesAgg = await prisma.orderItem.aggregate({
    where: {
      productId: id,
      order: { orderDate: { gte: ninetyDaysAgo }, status: { not: "cancelled" } },
    },
    _sum: { lineSubtotal: true, quantity: true, estimatedGrossProfit: true },
    _count: { _all: true },
  });

  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      price: num(v.price),
      salePrice: numOrNull(v.salePrice),
      costPrice: numOrNull(v.costPrice),
    })),
    supplierProducts: product.supplierProducts.map((sp) => ({
      ...sp,
      cost: num(sp.cost),
    })),
    sales90d: {
      revenue: num(salesAgg._sum.lineSubtotal),
      quantity: salesAgg._sum.quantity ?? 0,
      grossProfit: num(salesAgg._sum.estimatedGrossProfit),
      orderLines: salesAgg._count._all,
    },
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductById>>>;
