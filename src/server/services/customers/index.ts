import type { CustomerType, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type ListCustomersFilters = {
  customerType?: CustomerType;
  storeId?: string;
  consent?: "subscribed" | "unsubscribed" | "transactional";
  search?: string;
};

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

export async function listCustomers(filters: ListCustomersFilters = {}) {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (filters.customerType) where.customerType = filters.customerType;
  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.consent) where.consentStatus = filters.consent;
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ lastOrderAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      store: { select: { id: true, name: true } },
    },
  });

  return customers.map((c) => ({
    id: c.id,
    displayName: customerDisplayName(c),
    companyName: c.companyName,
    email: c.email,
    customerType: c.customerType,
    consentStatus: c.consentStatus,
    lifetimeValue: num(c.lifetimeValue),
    orderCount: c.orderCount,
    lastOrderAt: c.lastOrderAt,
    reactivationScore: c.reactivationScore,
    store: c.store,
  }));
}

export type CustomerListRow = Awaited<ReturnType<typeof listCustomers>>[number];

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      store: true,
      division: true,
      segmentMembers: {
        include: { segment: { select: { id: true, name: true, segmentType: true } } },
      },
      marketingContacts: {
        select: {
          id: true,
          email: true,
          status: true,
          consentStatus: true,
          lastCampaignSentAt: true,
          lastOpenedAt: true,
          lastClickedAt: true,
          tags: true,
        },
      },
      orders: {
        orderBy: { orderDate: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          currency: true,
        },
      },
    },
  });

  if (!customer) return null;

  return {
    ...customer,
    displayName: customerDisplayName(customer),
    lifetimeValue: num(customer.lifetimeValue),
    orders: customer.orders.map((o) => ({
      ...o,
      grandTotal: num(o.grandTotal),
    })),
  };
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerById>>>;

export function customerDisplayName(c: {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
}): string {
  if (c.companyName) return c.companyName;
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  if (name) return name;
  return c.email ?? "Unknown";
}
