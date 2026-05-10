import { Prisma, type PrismaClient } from "@prisma/client";

const SEED_SOURCE = "seed";
const TAX_RATE = 0.13; // Canadian HST baseline

// -----------------------------------------------------------------------------
// Orders — docs/04 §5.8–5.9
//
// Each order references customers + variants by their seed sourceId / SKU.
// Totals (subtotal, tax, GP, margin) are computed from the variants' price
// and costPrice so the seed stays aligned with the catalog.
// -----------------------------------------------------------------------------

type LineSeed = { variantSku: string; quantity: number; supplierCode?: string };

type OrderSeed = {
  sourceId: string;
  storeKey: string;
  customerSourceId: string | null;
  orderNumber: string;
  orderDateDaysAgo: number;
  status: Parameters<PrismaClient["order"]["create"]>[0]["data"]["status"];
  paymentStatus: Parameters<PrismaClient["order"]["create"]>[0]["data"]["paymentStatus"];
  fulfillmentStatus: Parameters<PrismaClient["order"]["create"]>[0]["data"]["fulfillmentStatus"];
  supplierStatus?: Parameters<PrismaClient["order"]["create"]>[0]["data"]["supplierStatus"];
  exceptionStatus?: Parameters<PrismaClient["order"]["create"]>[0]["data"]["exceptionStatus"];
  exceptionReason?: string;
  shipping: number;
  currency?: string;
  items: LineSeed[];
};

const ORDERS: OrderSeed[] = [
  // LifeSupply.ca — B2B / clinic
  {
    sourceId: "o-LS-1029",
    storeKey: "lifesupply-ca",
    customerSourceId: "c-calgary-family",
    orderNumber: "LS-1029",
    orderDateDaysAgo: 6,
    status: "completed",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    shipping: 0,
    items: [
      { variantSku: "LS-GLV-NIT-100-M", quantity: 5 },
      { variantSku: "LS-MSK-3PLY-50-STD", quantity: 2 },
    ],
  },
  {
    sourceId: "o-LS-1030",
    storeKey: "lifesupply-ca",
    customerSourceId: "c-halton-health",
    orderNumber: "LS-1030",
    orderDateDaysAgo: 11,
    status: "completed",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    shipping: 0,
    items: [
      { variantSku: "LS-GWN-ISO-50-STD", quantity: 3 },
      { variantSku: "LS-MSK-N95-20-STD", quantity: 2 },
      { variantSku: "LS-DX-BPM-STD", quantity: 1 },
    ],
  },
  {
    sourceId: "o-LS-1031",
    storeKey: "lifesupply-ca",
    customerSourceId: "c-westside-dental",
    orderNumber: "LS-1031",
    orderDateDaysAgo: 38,
    status: "completed",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    shipping: 15,
    items: [
      { variantSku: "LS-GLV-NIT-100-S", quantity: 4 },
      { variantSku: "LS-MSK-3PLY-50-STD", quantity: 2 },
    ],
  },
  {
    sourceId: "o-LS-1032",
    storeKey: "lifesupply-ca",
    customerSourceId: "c-kingston-ltc",
    orderNumber: "LS-1032",
    orderDateDaysAgo: 3,
    status: "awaiting_supplier",
    paymentStatus: "paid",
    fulfillmentStatus: "unfulfilled",
    supplierStatus: "pending_assignment",
    exceptionStatus: "flagged",
    exceptionReason:
      "Primary supplier (MEDD01) reports low stock on Large nitrile gloves; reroute to BBM01 pending price confirmation.",
    shipping: 0,
    items: [{ variantSku: "LS-GLV-NIT-100-L", quantity: 10 }],
  },
  {
    sourceId: "o-LS-1033",
    storeKey: "lifesupply-ca",
    customerSourceId: "c-vancouver-wellness",
    orderNumber: "LS-1033",
    orderDateDaysAgo: 95,
    status: "completed",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    shipping: 25,
    items: [
      { variantSku: "LS-DX-PULSEOX-STD", quantity: 2 },
      { variantSku: "LS-DX-BPM-STD", quantity: 1 },
    ],
  },
  {
    sourceId: "o-LS-1034",
    storeKey: "lifesupply-ca",
    customerSourceId: "c-calgary-family",
    orderNumber: "LS-1034",
    orderDateDaysAgo: 1,
    status: "processing",
    paymentStatus: "paid",
    fulfillmentStatus: "unfulfilled",
    shipping: 0,
    items: [
      { variantSku: "LS-GLV-NIT-100-M", quantity: 6 },
      { variantSku: "LS-WC-HC-10-STD", quantity: 1 },
    ],
  },
  {
    sourceId: "o-LS-1035",
    storeKey: "lifesupply-ca",
    customerSourceId: "c-halton-health",
    orderNumber: "LS-1035",
    orderDateDaysAgo: 4,
    status: "awaiting_human_review",
    paymentStatus: "paid",
    fulfillmentStatus: "unfulfilled",
    supplierStatus: "awaiting_confirmation",
    exceptionStatus: "in_review",
    exceptionReason:
      "Supplier HSI01 cost on N95 increased from $22.50 to $24.10 — margin below threshold pending review.",
    shipping: 0,
    items: [
      { variantSku: "LS-GWN-ISO-50-STD", quantity: 5 },
      { variantSku: "LS-MSK-N95-20-STD", quantity: 8 },
    ],
  },

  // Wellmart.com — retail / dropship via BBM01
  {
    sourceId: "o-WM-2058",
    storeKey: "wellmartmedical-com",
    customerSourceId: "c-maria-rodriguez",
    orderNumber: "WM-2058",
    orderDateDaysAgo: 18,
    status: "completed",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    supplierStatus: "completed",
    shipping: 9.99,
    items: [
      { variantSku: "WM-DX-THERM-STD", quantity: 1, supplierCode: "BBM01" },
      { variantSku: "WM-DX-PULSEOX-STD", quantity: 1, supplierCode: "BBM01" },
    ],
  },
  {
    sourceId: "o-WM-2059",
    storeKey: "wellmartmedical-com",
    customerSourceId: "c-john-patel",
    orderNumber: "WM-2059",
    orderDateDaysAgo: 9,
    status: "shipped",
    paymentStatus: "paid",
    fulfillmentStatus: "partially_fulfilled",
    supplierStatus: "shipped",
    shipping: 9.99,
    items: [{ variantSku: "WM-GLV-NIT-100-M", quantity: 1, supplierCode: "BBM01" }],
  },
  {
    sourceId: "o-WM-2060",
    storeKey: "wellmartmedical-com",
    customerSourceId: "c-emily-wong",
    orderNumber: "WM-2060",
    orderDateDaysAgo: 4,
    status: "completed",
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    supplierStatus: "completed",
    shipping: 9.99,
    items: [
      { variantSku: "WM-DX-THERM-STD", quantity: 1, supplierCode: "BBM01" },
      { variantSku: "WM-WC-BND-200-STD", quantity: 1, supplierCode: "BBM01" },
    ],
  },
  {
    sourceId: "o-WM-2061",
    storeKey: "wellmartmedical-com",
    customerSourceId: "c-maria-rodriguez",
    orderNumber: "WM-2061",
    orderDateDaysAgo: 2,
    status: "awaiting_supplier",
    paymentStatus: "paid",
    fulfillmentStatus: "unfulfilled",
    supplierStatus: "pending_assignment",
    shipping: 9.99,
    items: [{ variantSku: "WM-DX-PULSEOX-STD", quantity: 2, supplierCode: "BBM01" }],
  },
  {
    sourceId: "o-WM-2062",
    storeKey: "wellmartmedical-com",
    customerSourceId: "c-john-patel",
    orderNumber: "WM-2062",
    orderDateDaysAgo: 7,
    status: "cancelled",
    paymentStatus: "refunded",
    fulfillmentStatus: "unfulfilled",
    supplierStatus: "not_required",
    shipping: 0,
    items: [{ variantSku: "WM-GLV-NIT-100-L", quantity: 3, supplierCode: "BBM01" }],
  },
];

// -----------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function seedTransactions(prisma: PrismaClient) {
  console.log("→ Orders & line items");
  let itemCount = 0;

  for (const o of ORDERS) {
    const store = await prisma.store.findUniqueOrThrow({
      where: {
        sourceSystem_externalStoreId: {
          sourceSystem: SEED_SOURCE,
          externalStoreId: o.storeKey,
        },
      },
    });
    const customer = o.customerSourceId
      ? await prisma.customer.findUnique({
          where: {
            sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: o.customerSourceId },
          },
        })
      : null;

    // Resolve all line items first to compute totals
    type ResolvedLine = {
      variant: Awaited<ReturnType<PrismaClient["productVariant"]["findUniqueOrThrow"]>>;
      product: Awaited<ReturnType<PrismaClient["product"]["findUniqueOrThrow"]>>;
      qty: number;
      supplierProductId: string | null;
      supplierId: string | null;
      unitCost: number;
    };

    const lines: ResolvedLine[] = [];
    for (const li of o.items) {
      const variant = await prisma.productVariant.findFirstOrThrow({
        where: { sku: li.variantSku },
        include: { product: true },
      });
      const product = variant.product;
      const unitCost = variant.costPrice
        ? Number(variant.costPrice)
        : (
              await prisma.supplierProduct.findFirst({
                where: { productId: product.id, isPreferred: true },
              })
            )?.cost
          ? Number(
              (
                await prisma.supplierProduct.findFirstOrThrow({
                  where: { productId: product.id, isPreferred: true },
                })
              ).cost,
            )
          : 0;

      let supplierId: string | null = null;
      let supplierProductId: string | null = null;
      if (li.supplierCode) {
        const supplier = await prisma.supplier.findUnique({ where: { code: li.supplierCode } });
        if (supplier) {
          supplierId = supplier.id;
          const sp = await prisma.supplierProduct.findFirst({
            where: { supplierId: supplier.id, productId: product.id },
          });
          supplierProductId = sp?.id ?? null;
        }
      }

      lines.push({ variant, product, qty: li.quantity, supplierProductId, supplierId, unitCost });
    }

    const subtotal = round2(lines.reduce((sum, l) => sum + Number(l.variant.price) * l.qty, 0));
    const taxTotal = round2(subtotal * TAX_RATE);
    const shippingTotal = round2(o.shipping);
    const grandTotal = round2(subtotal + shippingTotal + taxTotal);
    const totalCost = round2(lines.reduce((sum, l) => sum + l.unitCost * l.qty, 0));
    const grossProfit = round2(subtotal - totalCost);
    const grossMargin = subtotal > 0 ? grossProfit / subtotal : null;

    const orderData = {
      storeId: store.id,
      divisionId: store.divisionId,
      customerId: customer?.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      supplierStatus: o.supplierStatus ?? "not_required",
      exceptionStatus: o.exceptionStatus ?? "none",
      exceptionReason: o.exceptionReason,
      orderDate: daysAgo(o.orderDateDaysAgo),
      subtotal: new Prisma.Decimal(subtotal),
      shippingTotal: new Prisma.Decimal(shippingTotal),
      taxTotal: new Prisma.Decimal(taxTotal),
      grandTotal: new Prisma.Decimal(grandTotal),
      currency: o.currency ?? "CAD",
      estimatedGrossProfit: new Prisma.Decimal(grossProfit),
      estimatedGrossMargin: grossMargin != null ? new Prisma.Decimal(grossMargin.toFixed(4)) : null,
    };

    const order = await prisma.order.upsert({
      where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: o.sourceId } },
      create: { ...orderData, sourceSystem: SEED_SOURCE, sourceId: o.sourceId },
      update: orderData,
    });

    // Replace items wholesale for idempotency
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    for (const l of lines) {
      const lineSubtotal = round2(Number(l.variant.price) * l.qty);
      const lineTax = round2(lineSubtotal * TAX_RATE);
      const lineTotal = round2(lineSubtotal + lineTax);
      const lineGp = round2(lineSubtotal - l.unitCost * l.qty);
      const lineGm = lineSubtotal > 0 ? lineGp / lineSubtotal : null;

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: l.product.id,
          productVariantId: l.variant.id,
          sku: l.variant.sku,
          productName:
            l.product.name + (l.variant.optionSummary ? ` — ${l.variant.optionSummary}` : ""),
          quantity: l.qty,
          unitPrice: l.variant.price,
          unitCost: new Prisma.Decimal(l.unitCost),
          lineSubtotal: new Prisma.Decimal(lineSubtotal),
          lineTax: new Prisma.Decimal(lineTax),
          lineTotal: new Prisma.Decimal(lineTotal),
          estimatedGrossProfit: new Prisma.Decimal(lineGp),
          estimatedGrossMargin: lineGm != null ? new Prisma.Decimal(lineGm.toFixed(4)) : null,
          supplierId: l.supplierId,
          supplierProductId: l.supplierProductId,
        },
      });
      itemCount += 1;
    }
  }

  console.log(`  • ${ORDERS.length} orders, ${itemCount} line items`);
}
