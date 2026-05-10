import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

export async function getMarketingDashboard() {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90);

  // ---- campaigns + their latest metric snapshot
  const campaignRecords = await prisma.campaign.findMany({
    orderBy: [{ sentAt: "desc" }, { scheduledAt: "desc" }, { createdAt: "desc" }],
    take: 12,
    include: { metrics: { orderBy: { measuredAt: "desc" }, take: 1 } },
  });
  const campaigns = campaignRecords.map((c) => {
    const m = c.metrics[0];
    return {
      id: c.id,
      name: c.name,
      campaignType: c.campaignType,
      status: c.status,
      subject: c.subject,
      audienceSummary: c.audienceSummary,
      sentAt: c.sentAt?.toISOString() ?? null,
      scheduledAt: c.scheduledAt?.toISOString() ?? null,
      metrics: m
        ? {
            sentCount: m.sentCount,
            openCount: m.openCount,
            clickCount: m.clickCount,
            conversionCount: m.conversionCount,
            attributedRevenue: num(m.attributedRevenue),
            unsubscribeCount: m.unsubscribeCount,
            bounceCount: m.bounceCount,
            openRate: m.sentCount > 0 ? m.openCount / m.sentCount : null,
            clickRate: m.sentCount > 0 ? m.clickCount / m.sentCount : null,
            measuredAt: m.measuredAt.toISOString(),
          }
        : null,
    };
  });

  // ---- aggregate KPIs across recent sent campaigns
  const sent = campaigns.filter((c) => c.metrics);
  const totalSent = sent.reduce((s, c) => s + (c.metrics?.sentCount ?? 0), 0);
  const totalOpens = sent.reduce((s, c) => s + (c.metrics?.openCount ?? 0), 0);
  const totalClicks = sent.reduce((s, c) => s + (c.metrics?.clickCount ?? 0), 0);
  const totalConversions = sent.reduce((s, c) => s + (c.metrics?.conversionCount ?? 0), 0);
  const totalRevenue = sent.reduce((s, c) => s + (c.metrics?.attributedRevenue ?? 0), 0);
  const overallOpen = totalSent > 0 ? totalOpens / totalSent : null;
  const overallClick = totalSent > 0 ? totalClicks / totalSent : null;

  // ---- segments + member counts
  const segmentRecords = await prisma.customerSegment.findMany({
    where: { isActive: true },
    include: { _count: { select: { members: { where: { removedAt: null } } } } },
    orderBy: { name: "asc" },
  });
  const segments = segmentRecords.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    segmentType: s.segmentType,
    memberCount: s._count.members,
  }));

  // ---- reactivation candidates (top 10 by score)
  const reactivationCandidates = await prisma.customer.findMany({
    where: {
      consentStatus: "subscribed",
      lastOrderAt: { lt: ninetyDaysAgo },
      reactivationScore: { gte: 50 },
      deletedAt: null,
    },
    orderBy: { reactivationScore: "desc" },
    take: 10,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      companyName: true,
      email: true,
      lifetimeValue: true,
      lastOrderAt: true,
      reactivationScore: true,
      store: { select: { name: true } },
    },
  });
  const reactivation = reactivationCandidates.map((c) => ({
    id: c.id,
    name:
      c.companyName ?? [c.firstName, c.lastName].filter(Boolean).join(" ") ?? c.email ?? "Unknown",
    email: c.email,
    lifetimeValue: num(c.lifetimeValue),
    lastOrderAt: c.lastOrderAt?.toISOString() ?? null,
    reactivationScore: c.reactivationScore,
    storeName: c.store?.name ?? null,
  }));

  // ---- consent breakdown
  const consentGroups = await prisma.customer.groupBy({
    by: ["consentStatus"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const consent: Record<string, number> = {};
  for (const g of consentGroups) {
    consent[g.consentStatus] = g._count._all;
  }

  return {
    overall: {
      totalSent,
      totalOpens,
      totalClicks,
      totalConversions,
      attributedRevenue: totalRevenue,
      openRate: overallOpen,
      clickRate: overallClick,
      sentCampaignCount: sent.length,
    },
    campaigns,
    segments,
    reactivation,
    consent,
  };
}

export type MarketingDashboard = Awaited<ReturnType<typeof getMarketingDashboard>>;
