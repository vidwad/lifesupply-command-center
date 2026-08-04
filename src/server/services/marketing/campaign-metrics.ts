/**
 * Manual campaign performance loading (Phase 5 — docs/19 acceptance:
 * "Performance metrics can be imported or manually loaded"). Mailchimp metric
 * read-sync can supersede this later; manual entry keeps performance tracking
 * usable from day one.
 */
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type RecordMetricsInput = {
  campaignId: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  conversionCount: number;
  attributedRevenue: number;
  unsubscribeCount: number;
  bounceCount: number;
  measuredAt?: Date;
};

function nonNegativeInt(v: number, label: string): number {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a non-negative number.`);
  return n;
}

export async function recordCampaignMetrics(
  input: RecordMetricsInput,
  actor: { id: string },
): Promise<string> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
    select: { id: true, name: true },
  });
  if (!campaign) throw new Error("Campaign not found.");

  const revenue = Number(input.attributedRevenue);
  if (!Number.isFinite(revenue) || revenue < 0) {
    throw new Error("Attributed revenue must be a non-negative number.");
  }

  const metrics = await prisma.campaignMetrics.create({
    data: {
      campaignId: campaign.id,
      sentCount: nonNegativeInt(input.sentCount, "Sent count"),
      openCount: nonNegativeInt(input.openCount, "Open count"),
      clickCount: nonNegativeInt(input.clickCount, "Click count"),
      conversionCount: nonNegativeInt(input.conversionCount, "Conversion count"),
      attributedRevenue: revenue,
      unsubscribeCount: nonNegativeInt(input.unsubscribeCount, "Unsubscribe count"),
      bounceCount: nonNegativeInt(input.bounceCount, "Bounce count"),
      measuredAt: input.measuredAt ?? new Date(),
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "campaign.metrics_recorded",
    entityType: "campaign",
    entityId: campaign.id,
    afterData: {
      metricsId: metrics.id,
      sentCount: metrics.sentCount,
      openCount: metrics.openCount,
      attributedRevenue: revenue,
      measuredAt: metrics.measuredAt.toISOString(),
    },
  });

  return metrics.id;
}
