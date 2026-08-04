/**
 * Consent posture reporting (Phase 4). Read-only aggregates so operators can
 * review the consent/suppression breakdown before planning campaigns.
 */
import { prisma } from "@/server/db/client";

export type ConsentSummary = {
  customersTotal: number;
  byStatus: { status: string; count: number }[];
  byBasis: { basis: string; count: number }[];
  suppressed: { reason: string; count: number }[];
  mailchimpContacts: number;
  lastMailchimpSyncAt: string | null;
};

export async function getConsentSummary(): Promise<ConsentSummary> {
  const [customersTotal, byStatus, byBasis, suppressed, mailchimpContacts, lastSync] =
    await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.customer.groupBy({
        by: ["consentStatus"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.customer.groupBy({
        by: ["consentBasis"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.customer.groupBy({
        by: ["suppressionReason"],
        where: { deletedAt: null, suppressionReason: { not: null } },
        _count: { _all: true },
      }),
      prisma.marketingContact.count({ where: { sourceSystem: "mailchimp" } }),
      prisma.integrationConnection.findFirst({
        where: { integrationType: "mailchimp" },
        select: { lastSuccessfulSyncAt: true },
      }),
    ]);

  const sortDesc = <T extends { count: number }>(rows: T[]) =>
    rows.sort((a, b) => b.count - a.count);

  return {
    customersTotal,
    byStatus: sortDesc(byStatus.map((r) => ({ status: r.consentStatus, count: r._count._all }))),
    byBasis: sortDesc(byBasis.map((r) => ({ basis: r.consentBasis, count: r._count._all }))),
    suppressed: sortDesc(
      suppressed.map((r) => ({ reason: r.suppressionReason ?? "unknown", count: r._count._all })),
    ),
    mailchimpContacts,
    lastMailchimpSyncAt: lastSync?.lastSuccessfulSyncAt?.toISOString() ?? null,
  };
}
