import { ConsentStatus, CustomerType, type Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

const VALID_CONSENT = new Set<string>(Object.values(ConsentStatus));
const VALID_TYPES = new Set<string>(Object.values(CustomerType));

export async function GET(req: Request) {
  const actor = await requirePermission(PERMISSIONS.CUSTOMERS_EXPORT);
  const { searchParams } = new URL(req.url);
  const consentParam = searchParams.get("consent");
  const typeParam = searchParams.get("type");
  const consent = consentParam && VALID_CONSENT.has(consentParam) ? (consentParam as ConsentStatus) : undefined;
  const customerType = typeParam && VALID_TYPES.has(typeParam) ? (typeParam as CustomerType) : undefined;

  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(consent ? { consentStatus: consent } : {}),
    ...(customerType ? { customerType } : {}),
  };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { lastOrderAt: "desc" },
    include: {
      store: { select: { name: true } },
    },
    take: 10000,
  });

  const csv = toCsv({
    headers: [
      { key: "id", label: "Customer ID", get: (c) => c.id },
      { key: "sourceId", label: "Source ID", get: (c) => c.sourceId ?? "" },
      { key: "store", label: "Store", get: (c) => c.store?.name ?? "" },
      { key: "email", label: "Email", get: (c) => c.email ?? "" },
      { key: "firstName", label: "First Name", get: (c) => c.firstName ?? "" },
      { key: "lastName", label: "Last Name", get: (c) => c.lastName ?? "" },
      { key: "companyName", label: "Company", get: (c) => c.companyName ?? "" },
      { key: "phone", label: "Phone", get: (c) => c.phone ?? "" },
      { key: "customerType", label: "Type", get: (c) => c.customerType },
      { key: "consentStatus", label: "Consent", get: (c) => c.consentStatus },
      { key: "mailchimpStatus", label: "Mailchimp", get: (c) => c.mailchimpStatus ?? "" },
      { key: "orderCount", label: "Orders", get: (c) => c.orderCount },
      { key: "lifetimeValue", label: "Lifetime Value", get: (c) => c.lifetimeValue.toString() },
      {
        key: "firstOrderAt",
        label: "First Order",
        get: (c) => (c.firstOrderAt ? c.firstOrderAt.toISOString().slice(0, 10) : ""),
      },
      {
        key: "lastOrderAt",
        label: "Last Order",
        get: (c) => (c.lastOrderAt ? c.lastOrderAt.toISOString().slice(0, 10) : ""),
      },
      {
        key: "reactivationScore",
        label: "Reactivation Score",
        get: (c) => c.reactivationScore ?? "",
      },
    ],
    rows: customers,
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "export.customers.csv",
    entityType: "customer",
    afterData: { rows: customers.length, consent, customerType },
  });

  return csvResponse(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
