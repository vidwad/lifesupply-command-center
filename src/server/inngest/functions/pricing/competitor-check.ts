/**
 * DP-3 read-only competitor price check (Inngest worker function).
 *
 * Processes one batch of a draft pricing run: resolves eligible items, fetches
 * each configured competitor product page read-only, extracts a price from
 * structured data, and writes a CompetitorPriceObservation.
 *
 * It creates observations and nothing else. No PriceRecommendation, no
 * approval, no BigCommerce call. Concurrency is capped at 1 per run so two
 * dispatches cannot double-spend a competitor's hourly rate limit.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { requireFeature } from "@/server/services/feature-flags";
import { fetchCompetitorPage } from "@/server/services/pricing/collector";
import { minRequestSpacingMs } from "@/server/services/pricing/eligibility";
import { extractCompetitorPrice } from "@/server/services/pricing/extraction";
import { planObservationBatch } from "@/server/services/pricing/observations";

export const COMPETITOR_CHECK_EVENT = "pricing/competitor-check.requested";

type CheckEvent = {
  pricingRunId: string;
  actorUserId: string;
  batchSize?: number | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const competitorPriceCheck = inngest.createFunction(
  {
    id: "pricing-competitor-check",
    name: "Pricing — Read-only competitor price check",
    triggers: [{ event: COMPETITOR_CHECK_EVENT }],
    // One batch per run at a time: parallel dispatches would each see the same
    // hourly counts and together exceed a competitor's rate limit.
    concurrency: { limit: 1, key: "event.data.pricingRunId" },
    retries: 1,
  },
  async ({ event }) => {
    const data = event.data as CheckEvent;
    await requireFeature(FEATURE_FLAGS.PRICING_INTELLIGENCE);

    const plan = await planObservationBatch({
      pricingRunId: data.pricingRunId,
      requestedBatchSize: data.batchSize,
    });

    const competitors = await prisma.pricingCompetitor.findMany({
      where: { id: { in: [...new Set(plan.targets.map((t) => t.competitorId))] } },
    });
    const byId = new Map(competitors.map((row) => [row.id, row]));
    const lastRequestAt = new Map<string, number>();

    let valid = 0;
    let lowConfidence = 0;
    let failed = 0;
    let unavailable = 0;

    for (const target of plan.targets) {
      const competitor = byId.get(target.competitorId);
      if (!competitor) continue;

      // Spacing derived from the competitor's own hourly limit, so a batch
      // cannot burst through it even though the count check passed up front.
      const spacing = minRequestSpacingMs(competitor.rateLimitPerHour);
      const last = lastRequestAt.get(competitor.id);
      if (last != null && spacing > 0) {
        const wait = spacing - (Date.now() - last);
        if (wait > 0) await sleep(Math.min(wait, 10_000));
      }
      lastRequestAt.set(competitor.id, Date.now());

      const checkedAt = new Date();
      const outcome = await fetchCompetitorPage(target.competitorUrl);

      if (!outcome.ok) {
        failed += 1;
        await prisma.competitorPriceObservation.create({
          data: {
            pricingRunItemId: target.itemId,
            competitorId: competitor.id,
            competitorUrl: target.competitorUrl,
            extractionMethod: "direct_url",
            status: "failed",
            checkedAt,
            errorMessage: outcome.reason,
            rawEvidenceText:
              "GET " +
              target.competitorUrl +
              " -> " +
              (outcome.httpStatus == null ? "no response" : String(outcome.httpStatus)),
            evidenceRef: target.competitorUrl,
          },
        });
        await prisma.pricingCompetitor.update({
          where: { id: competitor.id },
          data: { lastFailedCheckAt: checkedAt, failureCount: { increment: 1 } },
        });
        continue;
      }

      const extracted = extractCompetitorPrice({
        html: outcome.html,
        url: outcome.finalUrl,
        sku: target.sku,
        productName: target.productName,
        urlVerified: target.urlVerified,
        fallbackCurrency: competitor.currency,
      });

      if (extracted.status === "valid") valid += 1;
      else if (extracted.status === "low_confidence") lowConfidence += 1;
      else if (extracted.status === "unavailable") unavailable += 1;
      else failed += 1;

      const evidenceLines = [
        "GET " + outcome.finalUrl + " -> HTTP " + String(outcome.httpStatus),
        extracted.pageTitle ? "title: " + extracted.pageTitle : null,
        extracted.source !== "none" ? "source: " + extracted.source : null,
        extracted.evidenceText,
        ...extracted.notes,
      ].filter(Boolean) as string[];

      await prisma.competitorPriceObservation.create({
        data: {
          pricingRunItemId: target.itemId,
          competitorId: competitor.id,
          competitorUrl: outcome.finalUrl,
          observedRegularPrice: extracted.regularPrice,
          observedSalePrice: extracted.salePrice,
          observedEffectivePrice: extracted.effectivePrice,
          currency: extracted.currency,
          availability: extracted.availability,
          matchConfidence: extracted.confidence,
          extractionMethod: "direct_url",
          status: extracted.status,
          checkedAt,
          // A short sanitized snippet, never the page HTML: full pages are
          // heavy and carry content nobody approved storing.
          rawEvidenceText: evidenceLines.join("\n").slice(0, 2000),
          evidenceRef: outcome.finalUrl,
          errorMessage: extracted.status === "failed" ? extracted.notes.join(" ") : null,
        },
      });

      await prisma.pricingCompetitor.update({
        where: { id: competitor.id },
        data: { lastSuccessfulCheckAt: checkedAt, failureCount: 0 },
      });

      // Only a genuinely valid observation advances the item. Everything else
      // leaves it pending so a later batch can retry, while the evidence of why
      // this attempt failed is still recorded.
      await prisma.pricingRunItem.update({
        where: { id: target.itemId },
        data:
          extracted.status === "valid"
            ? { status: "checked", lastCheckedAt: checkedAt }
            : { lastCheckedAt: checkedAt },
      });
    }

    const summary = {
      batchSize: plan.batchSize,
      attempted: plan.targets.length,
      valid,
      lowConfidence,
      unavailable,
      failed,
      skipped: plan.skips.length,
    };

    await writeAudit({
      actorUserId: data.actorUserId,
      action: "pricing.observation_batch_completed",
      entityType: "PricingRun",
      entityId: data.pricingRunId,
      afterData: summary,
    });

    return summary;
  },
);
