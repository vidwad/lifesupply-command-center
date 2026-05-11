import { type Prisma, SyncStatus, type IntegrationType } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

import { parseCsv, pick, pickDate, pickNumber } from "./csv";

export type ImportStatus = "completed" | "completed_with_warnings" | "failed";

export type ImportSummary = {
  syncLogId: string;
  status: ImportStatus;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  warnings: string[];
};

const SOURCE_SYSTEM = "bigcommerce";

function mapStatus(s: ImportStatus): SyncStatus {
  switch (s) {
    case "completed":
      return SyncStatus.success;
    case "completed_with_warnings":
      return SyncStatus.partial;
    case "failed":
      return SyncStatus.failed;
  }
}

async function ensureConnection(integrationType: IntegrationType) {
  return prisma.integrationConnection.upsert({
    where: { integrationType_name: { integrationType, name: "default" } },
    create: {
      integrationType,
      name: "default",
      status: "configured",
    },
    update: {},
  });
}

async function startRun(args: {
  integrationType: IntegrationType;
  syncType: string;
  triggeredById: string;
  metadata?: Prisma.JsonValue;
}) {
  const connection = await ensureConnection(args.integrationType);
  return prisma.integrationSyncLog.create({
    data: {
      integrationConnectionId: connection.id,
      syncType: args.syncType,
      status: "running",
      startedAt: new Date(),
      triggeredById: args.triggeredById,
      metadata: args.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

async function finishRun(
  syncLogId: string,
  status: ImportStatus,
  counts: {
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsFailed: number;
    errorSummary?: string | null;
  },
) {
  await prisma.integrationSyncLog.update({
    where: { id: syncLogId },
    data: {
      status: mapStatus(status),
      completedAt: new Date(),
      recordsProcessed: counts.recordsProcessed,
      recordsCreated: counts.recordsCreated,
      recordsUpdated: counts.recordsUpdated,
      recordsFailed: counts.recordsFailed,
      errorSummary: counts.errorSummary ?? null,
    },
  });
}

// -----------------------------------------------------------------------------
// Customers import
// -----------------------------------------------------------------------------

export async function importBigCommerceCustomers(args: {
  csvText: string;
  storeId: string;
  actor: { id: string };
}): Promise<ImportSummary> {
  const { rows, warnings } = parseCsv(args.csvText);
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: args.storeId },
    select: { id: true, divisionId: true },
  });

  const run = await startRun({
    integrationType: "bigcommerce",
    syncType: "customers",
    triggeredById: args.actor.id,
    metadata: { storeId: args.storeId, mode: "csv_upload" },
  });

  let created = 0;
  let updated = 0;
  let failed = 0;
  const errorWarnings: string[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const externalId = pick(row, ["customer_id", "id", "Customer ID"]);
      const email = pick(row, ["email", "Email"])?.toLowerCase() ?? null;
      if (!externalId && !email) {
        failed++;
        errorWarnings.push(`Row ${index + 2}: missing both customer_id and email`);
        continue;
      }

      const data = {
        storeId: store.id,
        divisionId: store.divisionId,
        sourceSystem: SOURCE_SYSTEM,
        sourceId: externalId,
        email,
        firstName: pick(row, ["first_name", "First Name"]),
        lastName: pick(row, ["last_name", "Last Name"]),
        companyName: pick(row, ["company", "Company"]),
        phone: pick(row, ["phone", "Phone"]),
        firstOrderAt: pickDate(row, ["first_order_at", "First Order Date"]),
        lastOrderAt: pickDate(row, ["last_order_at", "Last Order Date"]),
        orderCount: pickNumber(row, ["order_count", "Orders"]) ?? undefined,
        lifetimeValue: pickNumber(row, ["lifetime_value", "Total Spent"]),
      };

      const { lifetimeValue: ltvFromCsv, ...rest } = data;
      const updateData = ltvFromCsv == null ? rest : { ...rest, lifetimeValue: ltvFromCsv };
      const createData = { ...rest, lifetimeValue: ltvFromCsv ?? 0 };

      if (externalId) {
        const result = await prisma.customer.upsert({
          where: {
            sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: externalId },
          },
          create: createData,
          update: updateData,
        });
        if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
        else updated++;
      } else if (email) {
        const existing = await prisma.customer.findFirst({ where: { email } });
        if (existing) {
          await prisma.customer.update({ where: { id: existing.id }, data: updateData });
          updated++;
        } else {
          await prisma.customer.create({ data: createData });
          created++;
        }
      }
    } catch (err) {
      failed++;
      errorWarnings.push(
        `Row ${index + 2}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  const allWarnings = [...warnings, ...errorWarnings];
  const status =
    failed > 0
      ? rows.length === failed
        ? "failed"
        : "completed_with_warnings"
      : allWarnings.length > 0
        ? "completed_with_warnings"
        : "completed";

  await finishRun(run.id, status, {
    recordsProcessed: rows.length,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    errorSummary: allWarnings.slice(0, 10).join("\n") || null,
  });

  await writeAudit({
    actorUserId: args.actor.id,
    action: "import.bigcommerce.customers",
    entityType: "integration_sync_log",
    entityId: run.id,
    afterData: { created, updated, failed, processed: rows.length },
  });

  return {
    syncLogId: run.id,
    status,
    recordsProcessed: rows.length,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    warnings: allWarnings,
  };
}

// -----------------------------------------------------------------------------
// Products import
// -----------------------------------------------------------------------------

export async function importBigCommerceProducts(args: {
  csvText: string;
  storeId: string;
  actor: { id: string };
}): Promise<ImportSummary> {
  const { rows, warnings } = parseCsv(args.csvText);
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: args.storeId },
    select: { id: true, divisionId: true },
  });

  const run = await startRun({
    integrationType: "bigcommerce",
    syncType: "products",
    triggeredById: args.actor.id,
    metadata: { storeId: args.storeId, mode: "csv_upload" },
  });

  let created = 0;
  let updated = 0;
  let failed = 0;
  const errorWarnings: string[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const externalId = pick(row, ["product_id", "id", "Product ID"]);
      const sku = pick(row, ["sku", "SKU"]);
      const name = pick(row, ["name", "product_name", "Product Name"]);
      if (!name) {
        failed++;
        errorWarnings.push(`Row ${index + 2}: missing product name`);
        continue;
      }

      const data = {
        storeId: store.id,
        divisionId: store.divisionId,
        sourceSystem: SOURCE_SYSTEM,
        sourceId: externalId,
        name,
        sku,
        brand: pick(row, ["brand", "Brand"]),
        description: pick(row, ["description", "Description"]),
        url: pick(row, ["url", "URL"]),
      };

      if (externalId) {
        const result = await prisma.product.upsert({
          where: {
            sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: externalId },
          },
          create: data,
          update: data,
        });
        if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
        else updated++;
      } else if (sku) {
        const existing = await prisma.product.findFirst({
          where: { storeId: store.id, sku },
        });
        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await prisma.product.create({ data });
          created++;
        }
      } else {
        failed++;
        errorWarnings.push(`Row ${index + 2}: needs at least one of product_id or sku`);
      }
    } catch (err) {
      failed++;
      errorWarnings.push(
        `Row ${index + 2}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  const allWarnings = [...warnings, ...errorWarnings];
  const status =
    failed > 0
      ? rows.length === failed
        ? "failed"
        : "completed_with_warnings"
      : allWarnings.length > 0
        ? "completed_with_warnings"
        : "completed";

  await finishRun(run.id, status, {
    recordsProcessed: rows.length,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    errorSummary: allWarnings.slice(0, 10).join("\n") || null,
  });

  await writeAudit({
    actorUserId: args.actor.id,
    action: "import.bigcommerce.products",
    entityType: "integration_sync_log",
    entityId: run.id,
    afterData: { created, updated, failed, processed: rows.length },
  });

  return {
    syncLogId: run.id,
    status,
    recordsProcessed: rows.length,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    warnings: allWarnings,
  };
}

// -----------------------------------------------------------------------------
// Orders import (header-only — items not handled in CSV path)
// -----------------------------------------------------------------------------

export async function importBigCommerceOrders(args: {
  csvText: string;
  storeId: string;
  actor: { id: string };
}): Promise<ImportSummary> {
  const { rows, warnings } = parseCsv(args.csvText);
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: args.storeId },
    select: { id: true, divisionId: true },
  });

  const run = await startRun({
    integrationType: "bigcommerce",
    syncType: "orders",
    triggeredById: args.actor.id,
    metadata: { storeId: args.storeId, mode: "csv_upload" },
  });

  let created = 0;
  let updated = 0;
  let failed = 0;
  const errorWarnings: string[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const externalId = pick(row, ["order_id", "id", "Order ID"]);
      const orderNumber = pick(row, ["order_number", "Order Number", "Order #"]) ?? externalId;
      const orderDate = pickDate(row, ["order_date", "Date Created", "Order Date"]);
      if (!orderNumber || !orderDate) {
        failed++;
        errorWarnings.push(`Row ${index + 2}: missing order_number or order_date`);
        continue;
      }

      const data = {
        storeId: store.id,
        divisionId: store.divisionId,
        sourceSystem: SOURCE_SYSTEM,
        sourceId: externalId,
        orderNumber,
        orderDate,
        subtotal: pickNumber(row, ["subtotal", "Subtotal"]) ?? 0,
        discountTotal: pickNumber(row, ["discount_total", "Discount"]) ?? 0,
        shippingTotal: pickNumber(row, ["shipping_total", "Shipping"]) ?? 0,
        taxTotal: pickNumber(row, ["tax_total", "Tax"]) ?? 0,
        grandTotal: pickNumber(row, ["grand_total", "Total"]) ?? 0,
        currency: pick(row, ["currency", "Currency"]) ?? "CAD",
      };

      if (externalId) {
        const result = await prisma.order.upsert({
          where: {
            sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: externalId },
          },
          create: data,
          update: data,
        });
        if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
        else updated++;
      } else {
        const existing = await prisma.order.findFirst({
          where: { storeId: store.id, orderNumber },
        });
        if (existing) {
          await prisma.order.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await prisma.order.create({ data });
          created++;
        }
      }
    } catch (err) {
      failed++;
      errorWarnings.push(
        `Row ${index + 2}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  const allWarnings = [...warnings, ...errorWarnings];
  const status =
    failed > 0
      ? rows.length === failed
        ? "failed"
        : "completed_with_warnings"
      : allWarnings.length > 0
        ? "completed_with_warnings"
        : "completed";

  await finishRun(run.id, status, {
    recordsProcessed: rows.length,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    errorSummary: allWarnings.slice(0, 10).join("\n") || null,
  });

  await writeAudit({
    actorUserId: args.actor.id,
    action: "import.bigcommerce.orders",
    entityType: "integration_sync_log",
    entityId: run.id,
    afterData: { created, updated, failed, processed: rows.length },
  });

  return {
    syncLogId: run.id,
    status,
    recordsProcessed: rows.length,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsFailed: failed,
    warnings: allWarnings,
  };
}
