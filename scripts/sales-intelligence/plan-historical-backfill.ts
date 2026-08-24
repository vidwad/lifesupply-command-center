/**
 * Historical sales backfill PLANNER — inspects, reports, and changes nothing.
 *
 * WHAT IT DOES. Reads the current database, works out where sales history is
 * missing, and prints what a backfill would have to fetch and from where. It
 * is the "what would this cost and is it even the right source" step that
 * should precede any decision to run a 90,000-order import.
 *
 * WHAT IT DOES NOT DO. It performs no writes, calls no external API, dispatches
 * no sync, and enables no flag. There is no `--apply`, because this script has
 * nothing to apply — the actual backfill is the existing BigCommerce order sync,
 * triggered deliberately by a person. `plan-historical-backfill.test.ts`
 * asserts the absence of every write and outbound path.
 *
 *   pnpm sales:backfill:plan
 *   pnpm sales:backfill:plan --store <storeId>
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** BigCommerce line items are fetched per order: /v2/orders/{id}/products. */
const API_CALLS_PER_ORDER = 1;
/** Conservative sustained rate for the v2 API on an Enterprise plan. */
const ASSUMED_CALLS_PER_SECOND = 4;

type Gap = {
  storeId: string;
  storeName: string;
  orders: number;
  ordersWithItems: number;
  ordersMissingItems: number;
  oldestOrder: Date | null;
  newestOrder: Date | null;
  oldestOrderWithItems: Date | null;
};

const fmtDate = (d: Date | null): string => (d ? d.toISOString().slice(0, 10) : "—");
const pct = (n: number, d: number): string => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—");

function fmtDuration(seconds: number): string {
  if (seconds < 90) return `${Math.ceil(seconds)}s`;
  if (seconds < 5400) return `${(seconds / 60).toFixed(0)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

async function buildGaps(storeFilter?: string): Promise<Gap[]> {
  const stores = await prisma.store.findMany({
    where: storeFilter ? { id: storeFilter } : {},
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const gaps: Gap[] = [];
  for (const store of stores) {
    const where = { storeId: store.id };
    const [orders, ordersWithItems, oldest, newest, oldestWithItems] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, items: { some: {} } } }),
      prisma.order.findFirst({
        where,
        orderBy: { orderDate: "asc" },
        select: { orderDate: true },
      }),
      prisma.order.findFirst({
        where,
        orderBy: { orderDate: "desc" },
        select: { orderDate: true },
      }),
      prisma.order.findFirst({
        where: { ...where, items: { some: {} } },
        orderBy: { orderDate: "asc" },
        select: { orderDate: true },
      }),
    ]);
    if (orders === 0) continue;
    gaps.push({
      storeId: store.id,
      storeName: store.name,
      orders,
      ordersWithItems,
      ordersMissingItems: orders - ordersWithItems,
      oldestOrder: oldest?.orderDate ?? null,
      newestOrder: newest?.orderDate ?? null,
      oldestOrderWithItems: oldestWithItems?.orderDate ?? null,
    });
  }
  return gaps;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const storeIdx = args.indexOf("--store");
  const storeFilter = storeIdx >= 0 ? args[storeIdx + 1] : undefined;

  console.log("");
  console.log("Historical sales backfill — PLAN ONLY. Nothing is written or fetched.");
  console.log("─".repeat(78));

  const gaps = await buildGaps(storeFilter);
  if (gaps.length === 0) {
    console.log("No store has any orders. Run an order sync before planning a backfill.");
    return;
  }

  // ---- 1. Where the gaps are -------------------------------------------
  console.log("\n1. LINE-ITEM COVERAGE BY STORE");
  console.log(
    `   ${"store".padEnd(26)} ${"orders".padStart(8)} ${"w/ items".padStart(9)} ${"coverage".padStart(9)}  order date range`,
  );
  let totalMissing = 0;
  for (const g of gaps) {
    totalMissing += g.ordersMissingItems;
    console.log(
      `   ${g.storeName.slice(0, 26).padEnd(26)} ${String(g.orders).padStart(8)} ` +
        `${String(g.ordersWithItems).padStart(9)} ${pct(g.ordersWithItems, g.orders).padStart(9)}  ` +
        `${fmtDate(g.oldestOrder)} .. ${fmtDate(g.newestOrder)}`,
    );
    if (g.ordersWithItems > 0 && g.oldestOrderWithItems) {
      console.log(
        `   ${" ".repeat(26)} line items only exist from ${fmtDate(g.oldestOrderWithItems)} onwards`,
      );
    }
  }

  // ---- 2. Attribution quality ------------------------------------------
  const itemWhere = storeFilter ? { order: { storeId: storeFilter } } : {};
  const [items, withProduct, withVariant, withCost] = await Promise.all([
    prisma.orderItem.count({ where: itemWhere }),
    prisma.orderItem.count({ where: { ...itemWhere, productId: { not: null } } }),
    prisma.orderItem.count({ where: { ...itemWhere, productVariantId: { not: null } } }),
    prisma.orderItem.count({ where: { ...itemWhere, unitCost: { gt: 0 } } }),
  ]);

  console.log("\n2. QUALITY OF THE LINE ITEMS THAT DO EXIST");
  console.log(`   line items                 : ${items.toLocaleString()}`);
  console.log(
    `   matched to a product       : ${withProduct.toLocaleString()} (${pct(withProduct, items)})`,
  );
  console.log(
    `   matched to a variant       : ${withVariant.toLocaleString()} (${pct(withVariant, items)})`,
  );
  console.log(
    `   with a usable cost (> 0)   : ${withCost.toLocaleString()} (${pct(withCost, items)})`,
  );

  // ---- 3. Why attribution failed, and whether a re-sync fixes it --------
  const mappedProducts = await prisma.product.count({
    where: { sourceSystem: "bigcommerce", sourceId: { not: null } },
  });
  console.log("\n3. WHY ATTRIBUTION FAILED");
  console.log(
    `   BigCommerce-mapped products now in the catalogue: ${mappedProducts.toLocaleString()}`,
  );
  if (items > 0 && withProduct / items < 0.5 && mappedProducts > 0) {
    console.log(
      "   Line items are matched to products at sync time, from the products present\n" +
        "   in the catalogue at that moment. The catalogue was imported AFTER these\n" +
        "   items were synced, so most could not be matched and were stored unattributed.\n" +
        "   => Re-running the order sync should now attribute them. This is cheaper and\n" +
        "      safer than any new importer, and should be tried before building one.",
    );
  } else if (mappedProducts === 0) {
    console.log(
      "   No BigCommerce-mapped products exist, so no line item can be attributed.\n" +
        "   => Run a full product sync FIRST. Backfilling orders before the catalogue\n" +
        "      exists reproduces exactly the unattributed data seen above.",
    );
  }

  // ---- 4. What a backfill would cost -----------------------------------
  const calls = totalMissing * API_CALLS_PER_ORDER;
  console.log("\n4. WHAT A LINE-ITEM BACKFILL WOULD INVOLVE");
  console.log(`   orders missing line items  : ${totalMissing.toLocaleString()}`);
  console.log(
    `   BigCommerce API calls      : ~${calls.toLocaleString()} (one /v2/orders/{id}/products per order)`,
  );
  console.log(
    `   estimated wall clock       : ~${fmtDuration(calls / ASSUMED_CALLS_PER_SECOND)} at ${ASSUMED_CALLS_PER_SECOND} calls/sec`,
  );

  // ---- 5. Source recommendation ----------------------------------------
  console.log("\n5. WHICH SOURCE CAN SUPPLY THE MISSING DATA");
  console.log(
    "   CSV order import      : NOT SUFFICIENT. importBigCommerceOrders() writes order\n" +
      "                           headers only — it contains no OrderItem write path at all.\n" +
      "                           A CSV route would need a new line-item importer built.",
  );
  console.log(
    "   BigCommerce order sync: SUFFICIENT. syncOrderItemsForOrder() already fetches\n" +
      "                           /v2/orders/{id}/products and upserts OrderItem rows,\n" +
      "                           including product/variant mapping and cost enrichment.\n" +
      "                           => Preferred source. No new code required.",
  );

  // ---- 6. Cost caveat --------------------------------------------------
  const variantsCosted = await prisma.productVariant.count({ where: { costPrice: { gt: 0 } } });
  const variantsTotal = await prisma.productVariant.count();
  console.log("\n6. COST DATA — THE LIMIT A BACKFILL CANNOT LIFT");
  console.log(
    `   variants with a cost       : ${variantsCosted.toLocaleString()} of ${variantsTotal.toLocaleString()} (${pct(variantsCosted, variantsTotal)})`,
  );
  console.log(
    "   Backfilling orders recovers units and revenue. It does NOT recover cost:\n" +
      "   BigCommerce carries almost no cost_price, so gross profit and margin stay\n" +
      "   unknown for nearly every product however many orders are imported.\n" +
      "   Margin analysis needs a cost source, which is a separate decision.",
  );

  console.log("\n" + "─".repeat(78));
  console.log("Plan only. Nothing was written, no API was called, no flag was changed.");
  console.log("To act on this, a person runs the existing order sync deliberately.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
