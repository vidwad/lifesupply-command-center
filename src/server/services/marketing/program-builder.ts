/**
 * LifeSupply Campaign Builder (Phase 5 — docs/19).
 *
 * Builds the Customer Reactivation & Replenishment program as a STRUCTURED
 * campaign record:
 *
 *   parent Campaign (campaignType "reactivation_program")
 *     ├─ plan Json — objective, data source + cleanup review, consent
 *     │   eligibility review, streams, product/offer strategy, sequences,
 *     │   calendar, high-value task refs
 *     ├─ consumer track Campaign ("email") — recent/warm/deep-lapsed consumers
 *     ├─ B2B track Campaign ("email") — separated B2B/institutional sequence
 *     └─ high-value outreach Tasks — personal workflow, never generic blasts
 *
 * Every email track carries its own audience + eligibility snapshot, so the
 * existing approval gate (Phase 4: no approval without a snapshot) and the
 * flag-gated draft-only Mailchimp export apply unchanged. Dormant customers
 * are never emailed — they are recorded in the plan as suppression/research.
 */
import type { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

import {
  ALL_STREAM_KEYS,
  assignStream,
  sequenceToBodyOutline,
  STREAM_DEFINITIONS,
  type CampaignStreamKey,
  type SequenceStep,
} from "./campaign-streams";
import {
  ELIGIBILITY_POLICY_VERSION,
  evaluateMarketingEligibility,
  type EligibilityCode,
} from "./marketing-eligibility";

const AUDIENCE_SCAN_CAP = 5_000;
const HIGH_VALUE_TASK_CAP = 25;

export type StreamAudienceMember = {
  id: string;
  email: string | null;
  name: string;
  customerType: string;
  lifetimeValue: number;
  daysSinceLastOrder: number | null;
  eligibilityCode: EligibilityCode;
};

export type StreamAudiences = {
  byStream: Record<CampaignStreamKey, StreamAudienceMember[]>;
  excludedByCode: Partial<Record<EligibilityCode, number>>;
  scanned: number;
};

/**
 * Assemble the per-stream audiences: every contactable, non-hard-suppressed
 * customer is eligibility-checked (casl-v1) and stream-assigned. Ineligible
 * customers land in excludedByCode; dormant_research collects the no-email
 * stream regardless of eligibility (they are counted, never contacted).
 */
export async function buildStreamAudiences(): Promise<StreamAudiences> {
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      email: { not: null },
      consentStatus: { notIn: ["unsubscribed", "cleaned", "complained"] as never },
    },
    orderBy: [{ lifetimeValue: "desc" }, { lastOrderAt: "asc" }],
    take: AUDIENCE_SCAN_CAP,
  });

  const byStream = Object.fromEntries(ALL_STREAM_KEYS.map((k) => [k, []])) as unknown as Record<
    CampaignStreamKey,
    StreamAudienceMember[]
  >;
  const excludedByCode: Partial<Record<EligibilityCode, number>> = {};
  const now = Date.now();

  for (const c of customers) {
    const days = c.lastOrderAt
      ? Math.floor((now - c.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const stream = assignStream({
      customerType: c.customerType,
      lifetimeValue: Number(c.lifetimeValue),
      daysSinceLastOrder: days,
    });

    const verdict = evaluateMarketingEligibility({
      email: c.email,
      consentStatus: c.consentStatus,
      consentBasis: c.consentBasis,
      consentObtainedAt: c.consentObtainedAt,
      consentExpiresAt: c.consentExpiresAt,
      suppressionReason: c.suppressionReason,
      lastOrderAt: c.lastOrderAt,
      deletedAt: c.deletedAt,
    });

    // Dormant/research members are tracked whether or not they are eligible —
    // they will never be emailed. Every other stream requires eligibility.
    if (stream !== "dormant_research" && !verdict.eligible) {
      excludedByCode[verdict.code] = (excludedByCode[verdict.code] ?? 0) + 1;
      continue;
    }

    const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
    byStream[stream].push({
      id: c.id,
      email: c.email,
      name: c.companyName || fullName || c.email || "(unnamed)",
      customerType: c.customerType,
      lifetimeValue: Number(c.lifetimeValue),
      daysSinceLastOrder: days,
      eligibilityCode: verdict.code,
    });
  }

  return { byStream, excludedByCode, scanned: customers.length };
}

// ---------------------------------------------------------------------------
// Program creation
// ---------------------------------------------------------------------------

export type BuildProgramInput = {
  name: string;
  objective: string;
  streams: CampaignStreamKey[];
  productFocus: string;
  categories: string;
  offerStrategy: string;
  offerCode?: string | null;
  consumerSequence: SequenceStep[];
  b2bSequence: SequenceStep[];
  startDate?: string | null;
  maxPerStream: number;
  createHighValueTasks: boolean;
};

export class ProgramBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProgramBuilderError";
  }
}

function eligibilitySnapshotFor(members: StreamAudienceMember[], extra?: object) {
  const byCode: Partial<Record<EligibilityCode, number>> = {};
  for (const m of members) byCode[m.eligibilityCode] = (byCode[m.eligibilityCode] ?? 0) + 1;
  return {
    policy: ELIGIBILITY_POLICY_VERSION,
    evaluatedAt: new Date().toISOString(),
    total: members.length,
    eligible: members.length,
    ineligible: 0,
    byCode,
    ...extra,
  };
}

function audienceSnapshotFor(members: StreamAudienceMember[]) {
  return members.map((m) => ({
    id: m.id,
    email: m.email,
    name: m.name,
    score: 0,
    eligibilityCode: m.eligibilityCode,
  }));
}

export async function buildReactivationProgram(
  input: BuildProgramInput,
  actor: { id: string },
): Promise<string> {
  if (!input.name.trim()) throw new ProgramBuilderError("Program name is required.");
  if (!input.objective.trim()) throw new ProgramBuilderError("Campaign objective is required.");
  if (input.streams.length === 0)
    throw new ProgramBuilderError("Select at least one audience stream.");

  const maxPerStream = Math.min(Math.max(input.maxPerStream || 500, 1), 5_000);
  const audiences = await buildStreamAudiences();

  const selected = new Set(input.streams);
  const pick = (key: CampaignStreamKey) =>
    selected.has(key) ? audiences.byStream[key].slice(0, maxPerStream) : [];

  const consumerMembers = [
    ...pick("recent_buyers"),
    ...pick("warm_lapsing"),
    ...pick("deep_lapsed"),
  ];
  const b2bMembers = pick("b2b_institutional");
  const highValueMembers = pick("high_value");
  const dormantCount = audiences.byStream.dormant_research.length;

  if (consumerMembers.length === 0 && b2bMembers.length === 0 && highValueMembers.length === 0) {
    throw new ProgramBuilderError(
      "The selected streams contain no eligible customers. Run the Mailchimp consent sync and BigCommerce syncs, then retry.",
    );
  }

  const streamCounts = Object.fromEntries(
    ALL_STREAM_KEYS.map((k) => [
      k,
      { available: audiences.byStream[k].length, included: pick(k).length },
    ]),
  );

  // ---- Parent program record ----
  const plan = {
    version: "v1",
    objective: input.objective.trim(),
    dataSource: {
      description: "Command Center customers (BigCommerce sync + Mailchimp consent sync)",
      scanned: audiences.scanned,
      policy: ELIGIBILITY_POLICY_VERSION,
    },
    cleanup: {
      excludedByCode: audiences.excludedByCode,
      note: "Hard-suppressed customers (unsubscribed / cleaned / complained) are excluded at query level and never scanned into audiences.",
    },
    eligibilityReview: {
      policy: ELIGIBILITY_POLICY_VERSION,
      deepLapsedRequiresReview: selected.has("deep_lapsed"),
    },
    streams: {
      selected: input.streams,
      counts: streamCounts,
      dormantResearchCount: dormantCount,
    },
    products: { focus: input.productFocus.trim(), categories: input.categories.trim() },
    offer: { strategy: input.offerStrategy.trim(), code: input.offerCode?.trim() || null },
    consumerSequence: input.consumerSequence,
    b2bSequence: input.b2bSequence,
    calendar: { startDate: input.startDate || null },
    highValue: {
      candidates: highValueMembers.length,
      taskIds: [] as string[],
      tasksCreated: 0,
    },
    trackCampaignIds: [] as string[],
  };

  const allEmailMembers = [...consumerMembers, ...b2bMembers];
  const parent = await prisma.campaign.create({
    data: {
      name: input.name.trim(),
      campaignType: "reactivation_program",
      status: "draft",
      audienceSummary: `Program · ${allEmailMembers.length} email recipients · ${highValueMembers.length} high-value outreach · ${dormantCount} dormant (research only)`,
      audienceSnapshot: audienceSnapshotFor(allEmailMembers) as unknown as Prisma.InputJsonValue,
      eligibilitySnapshot: eligibilitySnapshotFor(allEmailMembers, {
        excludedFromPool: audiences.excludedByCode,
      }) as unknown as Prisma.InputJsonValue,
      plan: plan as unknown as Prisma.InputJsonValue,
      createdById: actor.id,
    },
  });

  // ---- Email track campaigns (separated consumer / B2B workflows) ----
  const trackIds: string[] = [];
  const mkTrack = async (
    label: string,
    members: StreamAudienceMember[],
    sequence: SequenceStep[],
    requiresReview: boolean,
  ) => {
    if (members.length === 0) return;
    const track = await prisma.campaign.create({
      data: {
        name: `${input.name.trim()} — ${label}`,
        campaignType: "email",
        status: "draft",
        subject: sequence[0]?.subject ?? `LifeSupply — ${input.name.trim()}`,
        bodyDraft: sequenceToBodyOutline(sequence, {
          offerStrategy: input.offerStrategy,
          productFocus: input.productFocus,
        }),
        audienceSummary: `${label} · ${members.length} recipients${requiresReview ? " · includes deep-lapsed (consent review required)" : ""}`,
        audienceSnapshot: audienceSnapshotFor(members) as unknown as Prisma.InputJsonValue,
        eligibilitySnapshot: eligibilitySnapshotFor(members, {
          requiresConsentReview: requiresReview,
        }) as unknown as Prisma.InputJsonValue,
        parentCampaignId: parent.id,
        createdById: actor.id,
      },
    });
    trackIds.push(track.id);
  };

  await mkTrack(
    "Consumer track",
    consumerMembers,
    input.consumerSequence,
    selected.has("deep_lapsed"),
  );
  await mkTrack("B2B track", b2bMembers, input.b2bSequence, false);

  // ---- High-value outreach tasks — personal workflow, never a blast ----
  const taskIds: string[] = [];
  if (input.createHighValueTasks && highValueMembers.length > 0) {
    for (const member of highValueMembers.slice(0, HIGH_VALUE_TASK_CAP)) {
      const task = await prisma.task.create({
        data: {
          title: `High-value outreach: ${member.name}`,
          description:
            `Personal reactivation outreach for ${member.name}` +
            `${member.email ? ` <${member.email}>` : ""} — lifetime value ` +
            `$${member.lifetimeValue.toLocaleString()}. Program: ${input.name.trim()}. ` +
            `Offer: ${input.offerStrategy.trim() || "(see program)"}. Do not include in bulk sends.`,
          priority: "high",
          status: "open",
          sourceType: "workflow",
          sourceId: parent.id,
          createdById: actor.id,
          // relatedEntityId intentionally NOT set — it carries a hard FK to
          // orders; customer/campaign references live in metadata instead.
          metadata: {
            programCampaignId: parent.id,
            customerId: member.id,
            customerEmail: member.email,
            lifetimeValue: member.lifetimeValue,
          },
        },
      });
      taskIds.push(task.id);
    }
  }

  // ---- Backfill plan refs ----
  plan.trackCampaignIds = trackIds;
  plan.highValue.taskIds = taskIds;
  plan.highValue.tasksCreated = taskIds.length;
  await prisma.campaign.update({
    where: { id: parent.id },
    data: { plan: plan as unknown as Prisma.InputJsonValue },
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "campaign.program_built",
    entityType: "campaign",
    entityId: parent.id,
    afterData: {
      streams: input.streams,
      emailRecipients: allEmailMembers.length,
      consumerRecipients: consumerMembers.length,
      b2bRecipients: b2bMembers.length,
      highValueTasks: taskIds.length,
      dormantResearchCount: dormantCount,
      trackCampaignIds: trackIds,
      policy: ELIGIBILITY_POLICY_VERSION,
    },
  });

  return parent.id;
}

/** Stream preview for the builder page: definitions + live counts. */
export async function previewStreams() {
  const audiences = await buildStreamAudiences();
  return {
    streams: ALL_STREAM_KEYS.map((key) => ({
      ...STREAM_DEFINITIONS[key],
      available: audiences.byStream[key].length,
    })),
    excludedByCode: audiences.excludedByCode,
    scanned: audiences.scanned,
  };
}
