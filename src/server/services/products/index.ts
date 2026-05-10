import type { Prisma, ProductStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type ListProductsFilters = {
  storeId?: string;
  categoryId?: string;
  status?: ProductStatus;
  imageStatus?: "missing" | "needs_review";
  search?: string;
};

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));
const numOrNull = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

export async function listProducts(filters: ListProductsFilters = {}) {
  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (filters.storeId) where.storeId = filters.storeId;
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

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: 100,
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
    const cost = primary?.costPrice
      ? Number(primary.costPrice)
      : p.supplierProducts[0]
        ? Number(p.supplierProducts[0].cost)
        : null;
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
