import { type Prisma, ProductStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<string>(Object.values(ProductStatus));

export async function GET(req: Request) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_EXPORT);
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status = statusParam && VALID_STATUSES.has(statusParam) ? (statusParam as ProductStatus) : undefined;
  const storeId = searchParams.get("store") ?? undefined;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(storeId ? { storeId } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      store: { select: { name: true } },
      category: { select: { name: true } },
      variants: {
        select: { sku: true, price: true, costPrice: true, stockLevel: true, status: true },
      },
      supplierProducts: {
        select: { supplier: { select: { code: true, name: true } }, supplierSku: true, cost: true },
      },
    },
    take: 10000,
  });

  const csv = toCsv({
    headers: [
      { key: "id", label: "Product ID", get: (p) => p.id },
      { key: "sourceId", label: "Source ID", get: (p) => p.sourceId ?? "" },
      { key: "sku", label: "SKU", get: (p) => p.sku ?? "" },
      { key: "name", label: "Name", get: (p) => p.name },
      { key: "brand", label: "Brand", get: (p) => p.brand ?? "" },
      { key: "store", label: "Store", get: (p) => p.store?.name ?? "" },
      { key: "category", label: "Category", get: (p) => p.category?.name ?? "" },
      { key: "status", label: "Status", get: (p) => p.status },
      { key: "imageStatus", label: "Image", get: (p) => p.imageStatus },
      { key: "descriptionStatus", label: "Description", get: (p) => p.descriptionStatus },
      { key: "isFeatured", label: "Featured", get: (p) => p.isFeatured },
      {
        key: "variantCount",
        label: "Variants",
        get: (p) => p.variants.length,
      },
      {
        key: "minPrice",
        label: "Min Price",
        get: (p) =>
          p.variants.length === 0
            ? ""
            : Math.min(...p.variants.map((v) => Number(v.price))).toFixed(2),
      },
      {
        key: "minCost",
        label: "Min Cost",
        get: (p) => {
          const costs = p.variants
            .map((v) => v.costPrice)
            .filter((c): c is NonNullable<typeof c> => c != null)
            .map((c) => Number(c));
          return costs.length === 0 ? "" : Math.min(...costs).toFixed(2);
        },
      },
      {
        key: "supplier",
        label: "Suppliers",
        get: (p) => p.supplierProducts.map((sp) => sp.supplier.code).join("; "),
      },
    ],
    rows: products,
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "export.products.csv",
    entityType: "product",
    afterData: { rows: products.length, status, storeId },
  });

  return csvResponse(`products-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
