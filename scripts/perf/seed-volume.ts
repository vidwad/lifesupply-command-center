/**
 * Representative-volume seeder (Phase 11E — rows 11E-01/11E-02/11E-03).
 *
 * Generates synthetic-but-realistic data volumes so pagination, filters,
 * and dashboard/report performance can be measured against something like
 * production scale BEFORE production data exists. Run against LOCAL or
 * STAGING databases only.
 *
 * Safety:
 *   - Refuses to run when DEPLOY_ENV=production.
 *   - Everything it creates is tagged sourceSystem "perf_seed" with
 *     deterministic sourceIds, so re-runs upsert instead of duplicating and
 *     `pnpm perf:seed --clean` can remove every synthetic row exactly.
 *   - Touches only Command Center tables. Never contacts a source system.
 *
 * Usage:
 *   pnpm perf:seed                  # default scale (see SCALE below)
 *   pnpm perf:seed --scale=0.1     # 10% smoke run
 *   pnpm perf:seed --clean          # delete all perf_seed rows
 *
 * Deterministic PRNG (no faker dependency): same scale → same data.
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCE = "perf_seed";

/** Default row targets — sized to docs/24 §2 representative volumes. */
const SCALE = {
  customersPerStore: 10_000,
  productsPerStore: 2_000,
  ordersPerStore: 25_000,
  maxItemsPerOrder: 4,
  tasks: 2_000,
  exceptions: 1_500,
  auditLogs: 20_000,
};

const STORES = [
  { code: "PERF-A", name: "Perf Store A (LifeSupply-like)" },
  { code: "PERF-B", name: "Perf Store B (Wellmart-like)" },
  { code: "PERF-C", name: "Perf Store C (US-like)" },
];

// Mulberry32 — small deterministic PRNG, good enough for data shaping.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Alex",
  "Sam",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Jamie",
  "Drew",
  "Quinn",
];
const LAST = [
  "Smith",
  "Chen",
  "Patel",
  "Garcia",
  "Kim",
  "Tremblay",
  "Singh",
  "Brown",
  "Roy",
  "Nguyen",
];
const ORDER_STATUSES = [
  "completed",
  "shipped",
  "delivered",
  "processing",
  "received",
  "cancelled",
  "refunded",
] as const;
const day = 24 * 60 * 60 * 1000;

function pick<T>(r: () => number, arr: readonly T[]): T {
  const item = arr[Math.floor(r() * arr.length)];
  if (item === undefined) throw new Error("pick() from empty array");
  return item;
}

function parseArgs(): { scale: number; clean: boolean } {
  let scale = 1;
  let clean = false;
  for (const arg of process.argv.slice(2)) {
    if (arg === "--clean") clean = true;
    const m = /^--scale=([\d.]+)$/.exec(arg);
    if (m) scale = Number(m[1]);
  }
  return { scale, clean };
}

async function clean(): Promise<void> {
  // Order matters for FKs; orders cascade to items/shipments.
  const orders = await prisma.order.deleteMany({ where: { sourceSystem: SOURCE } });
  const products = await prisma.product.deleteMany({ where: { sourceSystem: SOURCE } });
  const customers = await prisma.customer.deleteMany({ where: { sourceSystem: SOURCE } });
  const tasks = await prisma.task.deleteMany({ where: { sourceType: SOURCE } });
  const exceptions = await prisma.exception.deleteMany({ where: { source: SOURCE } });
  const audits = await prisma.auditLog.deleteMany({
    where: { action: { startsWith: "perf_seed." } },
  });
  const stores = await prisma.store.deleteMany({ where: { sourceSystem: SOURCE } });
  const division = await prisma.division.deleteMany({ where: { code: "PERF" } });
  console.log(
    `cleaned: ${orders.count} orders, ${products.count} products, ${customers.count} customers, ` +
      `${tasks.count} tasks, ${exceptions.count} exceptions, ${audits.count} audit rows, ` +
      `${stores.count} stores, ${division.count} division`,
  );
}

async function main(): Promise<void> {
  if (process.env.DEPLOY_ENV === "production") {
    throw new Error("Refusing to seed synthetic volume into DEPLOY_ENV=production.");
  }
  const { scale, clean: doClean } = parseArgs();
  if (doClean) {
    await clean();
    return;
  }

  const n = (base: number) => Math.max(1, Math.round(base * scale));
  const started = Date.now();
  console.log(`seeding at scale ${scale} into ${process.env.DEPLOY_ENV ?? "local"}…`);

  const division = await prisma.division.upsert({
    where: { code: "PERF" },
    update: {},
    create: { code: "PERF", name: "Performance Test Division", type: "operating", isActive: false },
  });

  for (const [storeIdx, def] of STORES.entries()) {
    const r = rng(1000 + storeIdx);
    const store = await prisma.store.upsert({
      where: { sourceSystem_externalStoreId: { sourceSystem: SOURCE, externalStoreId: def.code } },
      update: {},
      create: {
        divisionId: division.id,
        name: def.name,
        platform: "manual",
        sourceSystem: SOURCE,
        externalStoreId: def.code,
        status: "inactive",
      },
    });

    // --- Products (createMany, deterministic sourceIds, skipDuplicates) ---
    const productCount = n(SCALE.productsPerStore);
    const productRows: Prisma.ProductCreateManyInput[] = [];
    for (let i = 0; i < productCount; i++) {
      productRows.push({
        storeId: store.id,
        divisionId: division.id,
        sourceSystem: SOURCE,
        sourceId: `${def.code}-P${i}`,
        name: `Perf Product ${def.code}-${i}`,
        sku: `${def.code}-SKU-${i}`,
        status: "active",
      });
    }
    await prisma.product.createMany({ data: productRows, skipDuplicates: true });
    const products = await prisma.product.findMany({
      where: { sourceSystem: SOURCE, storeId: store.id },
      select: { id: true, sku: true, name: true },
    });

    // --- Customers ---
    const customerCount = n(SCALE.customersPerStore);
    const customerRows: Prisma.CustomerCreateManyInput[] = [];
    for (let i = 0; i < customerCount; i++) {
      const first = pick(r, FIRST);
      const last = pick(r, LAST);
      const lastOrderDaysAgo = Math.floor(r() * 900);
      customerRows.push({
        storeId: store.id,
        divisionId: division.id,
        sourceSystem: SOURCE,
        sourceId: `${def.code}-C${i}`,
        email: `perf-${def.code.toLowerCase()}-${i}@example.invalid`,
        firstName: first,
        lastName: last,
        customerType: r() < 0.2 ? "b2b" : "retail",
        consentStatus: r() < 0.6 ? "subscribed" : r() < 0.5 ? "unknown" : "unsubscribed",
        lifetimeValue: new Prisma.Decimal((r() * 8000).toFixed(2)),
        orderCount: Math.floor(r() * 30),
        lastOrderAt: new Date(started - lastOrderDaysAgo * day),
      });
    }
    await prisma.customer.createMany({ data: customerRows, skipDuplicates: true });
    const customers = await prisma.customer.findMany({
      where: { sourceSystem: SOURCE, storeId: store.id },
      select: { id: true },
    });

    // --- Orders + items (chunked; items reference real products) ---
    const orderCount = n(SCALE.ordersPerStore);
    const CHUNK = 1_000;
    for (let start = 0; start < orderCount; start += CHUNK) {
      const end = Math.min(start + CHUNK, orderCount);
      const orderRows: Prisma.OrderCreateManyInput[] = [];
      for (let i = start; i < end; i++) {
        const total = r() * 900 + 20;
        orderRows.push({
          storeId: store.id,
          divisionId: division.id,
          customerId: pick(r, customers).id,
          sourceSystem: SOURCE,
          sourceId: `${def.code}-O${i}`,
          orderNumber: `${def.code}-${100000 + i}`,
          status: pick(r, ORDER_STATUSES),
          paymentStatus: r() < 0.9 ? "paid" : "refunded",
          orderDate: new Date(started - Math.floor(r() * 730) * day),
          subtotal: new Prisma.Decimal(total.toFixed(2)),
          grandTotal: new Prisma.Decimal((total * 1.13).toFixed(2)),
          taxTotal: new Prisma.Decimal((total * 0.13).toFixed(2)),
        });
      }
      await prisma.order.createMany({ data: orderRows, skipDuplicates: true });

      const created = await prisma.order.findMany({
        where: {
          sourceSystem: SOURCE,
          storeId: store.id,
          sourceId: { in: orderRows.map((o) => o.sourceId!) },
        },
        select: { id: true, sourceId: true },
      });
      const itemRows: Prisma.OrderItemCreateManyInput[] = [];
      for (const order of created) {
        const items = 1 + Math.floor(r() * SCALE.maxItemsPerOrder);
        for (let j = 0; j < items; j++) {
          const product = pick(r, products);
          const qty = 1 + Math.floor(r() * 3);
          const price = r() * 200 + 5;
          itemRows.push({
            orderId: order.id,
            productId: product.id,
            sourceSystem: SOURCE,
            sourceId: `${order.sourceId}-I${j}`,
            sku: product.sku ?? "PERF-SKU",
            productName: product.name,
            quantity: qty,
            unitPrice: new Prisma.Decimal(price.toFixed(2)),
            lineSubtotal: new Prisma.Decimal((price * qty).toFixed(2)),
            lineTotal: new Prisma.Decimal((price * qty * 1.13).toFixed(2)),
          });
        }
      }
      await prisma.orderItem.createMany({ data: itemRows, skipDuplicates: true });
      console.log(`  ${def.code}: orders ${end}/${orderCount}`);
    }
  }

  // --- Tasks, exceptions, audit logs (store-independent) ---
  const r = rng(9999);
  const taskRows: Prisma.TaskCreateManyInput[] = [];
  for (let i = 0; i < n(SCALE.tasks); i++) {
    taskRows.push({
      title: `Perf task ${i}`,
      status: pick(r, ["open", "in_progress", "completed"] as const),
      priority: pick(r, ["low", "medium", "high"] as const),
      sourceType: SOURCE,
      sourceId: `T${i}`,
    });
  }
  await prisma.task.createMany({ data: taskRows });

  const exceptionRows: Prisma.ExceptionCreateManyInput[] = [];
  for (let i = 0; i < n(SCALE.exceptions); i++) {
    exceptionRows.push({
      exceptionType: pick(r, ["order_delay", "integration_sync", "product_low_margin"] as const),
      severity: pick(r, ["low", "medium", "high"] as const),
      status: pick(r, ["open", "resolved"] as const),
      title: `Perf exception ${i}`,
      source: SOURCE,
      recurringKey: `perf:${i}`,
    });
  }
  await prisma.exception.createMany({ data: exceptionRows, skipDuplicates: true });

  const auditRows: Prisma.AuditLogCreateManyInput[] = [];
  for (let i = 0; i < n(SCALE.auditLogs); i++) {
    auditRows.push({
      action: `perf_seed.event_${i % 20}`,
      entityType: "perf",
      entityId: `E${i}`,
      createdAt: new Date(started - Math.floor(r() * 300) * day),
    });
  }
  await prisma.auditLog.createMany({ data: auditRows });

  console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
