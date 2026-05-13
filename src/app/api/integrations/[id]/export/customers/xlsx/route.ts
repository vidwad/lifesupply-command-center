/**
 * Live BigCommerce customer export → XLSX.
 *
 * Pulls customers + last-order-per-customer directly from BigCommerce for the
 * given integration connection (no DB sync required) and streams the workbook
 * back as an attachment. Audit-logged. Admin-gated.
 *
 * Usage (signed in as admin, in browser):
 *   /api/integrations/<connectionId>/export/customers/xlsx
 */

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { exportBigCommerceCustomersByConnection } from "@/server/integrations/bigcommerce/customer-export";
import { buildXlsxWorkbook, xlsxResponse } from "@/server/services/exports/xlsx";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// BC pagination + XLSX build can run for a minute or two on large stores.
export const maxDuration = 300;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission(PERMISSIONS.CUSTOMERS_EXPORT);
  const { id } = await ctx.params;

  const conn = await prisma.integrationConnection.findUnique({
    where: { id },
    select: { id: true, name: true, integrationType: true },
  });
  if (!conn) {
    return Response.json({ error: "Integration not found" }, { status: 404 });
  }
  if (conn.integrationType !== "bigcommerce") {
    return Response.json(
      { error: `Customer export is only supported for BigCommerce (got "${conn.integrationType}").` },
      { status: 400 },
    );
  }

  const result = await exportBigCommerceCustomersByConnection(conn.name);
  if (!result.ok) {
    return Response.json(
      { error: result.message, status: result.status },
      { status: typeof result.status === "number" ? result.status : 422 },
    );
  }

  const buffer = await buildXlsxWorkbook({
    sheetName: "Customers",
    columns: [
      { header: "Source", key: "source", width: 12, get: (r) => r.source },
      { header: "Customer ID", key: "customerId", width: 12, get: (r) => r.customerId },
      { header: "Email", key: "email", width: 32, get: (r) => r.email },
      { header: "First Name", key: "firstName", width: 16, get: (r) => r.firstName },
      { header: "Last Name", key: "lastName", width: 16, get: (r) => r.lastName },
      { header: "Company", key: "company", width: 24, get: (r) => r.company },
      { header: "Phone", key: "phone", width: 16, get: (r) => r.phone },
      {
        header: "Last Order Date",
        key: "lastOrderDate",
        width: 18,
        get: (r) => (r.lastOrderDate ? r.lastOrderDate.slice(0, 10) : null),
      },
      {
        header: "Last Order Total",
        key: "lastOrderTotal",
        width: 16,
        numFmt: "$#,##0.00",
        get: (r) => r.lastOrderTotal,
      },
      { header: "Last Order ID", key: "lastOrderId", width: 14, get: (r) => r.lastOrderId },
      { header: "Total Orders", key: "totalOrders", width: 12, get: (r) => r.totalOrders },
      {
        header: "Customer Group ID",
        key: "customerGroupId",
        width: 14,
        get: (r) => r.customerGroupId,
      },
      {
        header: "Registered",
        key: "registeredAt",
        width: 18,
        get: (r) => (r.registeredAt ? r.registeredAt.slice(0, 10) : null),
      },
    ],
    rows: result.rows,
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "export.bigcommerce_customers.xlsx",
    entityType: "integration_connection",
    entityId: conn.id,
    afterData: {
      connectionName: conn.name,
      customers: result.stats.customers,
      guests: result.stats.guests,
      orders: result.stats.orders,
      guestOrders: result.stats.guestOrders,
      rows: result.rows.length,
      durationMs: result.stats.durationMs,
      truncated: result.stats.truncated,
      bytes: buffer.length,
    },
  });

  const filename = `bc-customers-${slugify(conn.name)}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return xlsxResponse(filename, buffer);
}
