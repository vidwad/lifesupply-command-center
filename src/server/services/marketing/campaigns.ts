/**
 * Reactivation campaign drafting + approval-gated Mailchimp export.
 *
 * Lifecycle:
 *   1. AI drafts a campaign — copy + subject + audience snapshot. Persisted
 *      as a Campaign row in `draft` status with `bodyDraft`, `audienceSnapshot`,
 *      and a pointer to the AiOutput row that produced it.
 *   2. Marketer reviews + edits, then calls `requestCampaignApproval` which
 *      raises an `Approval` row of type "campaign". This is the existing
 *      approval flow — the campaign moves to `scheduled` status when approved
 *      and back to `draft` when rejected.
 *   3. Once approved, `exportCampaignToMailchimp` is gated on the
 *      `mailchimp.send` FeatureFlag. Today the export is a stub that records
 *      an audit row + flips the campaign's mailchimpExportStatus, so the
 *      end-to-end approval+release flow is observable before the live
 *      Mailchimp API is wired.
 */

import { type Prisma, type CampaignStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { aiCall } from "@/server/services/ai/call";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureOn, requireFeature } from "@/server/services/feature-flags";

import { listReactivationCandidates, type ReactivationBucket } from "./reactivation";

export class CampaignTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampaignTransitionError";
  }
}

const DRAFT_INCLUDE = {
  aiOutput: { select: { id: true, modelName: true, warnings: true, assumptions: true } },
  metrics: { orderBy: { measuredAt: "desc" }, take: 1 },
} satisfies Prisma.CampaignInclude;

export type CampaignDraftRow = Prisma.CampaignGetPayload<{ include: typeof DRAFT_INCLUDE }>;

export async function listCampaignDrafts(filters: {
  status?: CampaignStatus;
  limit?: number;
} = {}): Promise<CampaignDraftRow[]> {
  return prisma.campaign.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    include: DRAFT_INCLUDE,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: filters.limit ?? 50,
  });
}

export async function getCampaign(id: string) {
  return prisma.campaign.findUnique({ where: { id }, include: DRAFT_INCLUDE });
}

// ---------------------------------------------------------------------------
// AI draft generator
// ---------------------------------------------------------------------------

export type DraftCampaignInput = {
  name: string;
  subject?: string | null;
  /** Free-text brief from the marketer. Used to bias the AI prompt. */
  brief: string;
  /** Reactivation bucket the audience is drawn from. */
  bucket: ReactivationBucket;
  /** Cap audience size to keep first sends conservative. */
  maxRecipients?: number;
};

export async function draftReactivationCampaign(
  input: DraftCampaignInput,
  actor: { id: string },
): Promise<string> {
  if (!input.name.trim()) throw new Error("Campaign name is required.");
  if (!input.brief.trim()) throw new Error("Campaign brief is required.");

  const cap = Math.min(Math.max(input.maxRecipients ?? 200, 1), 5_000);
  const { rows, summary } = await listReactivationCandidates({
    bucket: input.bucket,
    limit: cap,
  });

  if (rows.length === 0) {
    throw new Error(`No reactivation candidates in the "${input.bucket}" bucket.`);
  }

  const audienceLines = rows.slice(0, 10).map((r, i) =>
    `${i + 1}. ${r.name}${r.email ? ` <${r.email}>` : ""} — ${r.bucket} score ${r.reactivationScore}, last order ${r.daysSinceLastOrder ?? "?"} days ago, LTV $${r.lifetimeValue.toFixed(0)}`,
  );

  const context = [
    `Campaign brief from the marketer:\n${input.brief.trim()}`,
    "",
    `Audience bucket: ${input.bucket}`,
    `Total recipients in this draft: ${rows.length} (capped at ${cap})`,
    `Total active candidates across all buckets: ${summary.total}`,
    `Customers excluded due to consent (subscribed: yes / unsubscribed: no): ${summary.excludedDueToConsent}`,
    "",
    "Sample of the top 10 recipients (for tone calibration only — do not name them in the message):",
    ...audienceLines,
  ].join("\n");

  const result = await aiCall("campaign_draft", {
    context,
    bucket: input.bucket,
  });

  // Snapshot the audience IDs so the approver sees exactly who would receive
  // the message even if reactivation scores shift before approval.
  const audienceSnapshot = rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    score: r.reactivationScore,
  }));

  // Persist the AiOutput first (required for FK).
  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId: actor.id,
      modelProvider: result.modelProvider,
      modelName: result.modelName,
      module: "campaign_draft",
      prompt: result.template.userPrompt,
      output: result.output,
      sourceReferences: {
        bucket: input.bucket,
        recipientCount: rows.length,
        topRecipientIds: rows.slice(0, 10).map((r) => r.id),
      },
      tokenUsage: result.tokenUsage,
      status: "generated",
      assumptions: [],
      warnings: rows.length === cap ? ["Audience hit the recipient cap — widen filters or raise the cap if you expected more."] : [],
      confidence: null,
      promptTemplateId: result.template.templateId,
      promptTemplateKey: result.template.templateKey,
      promptTemplateVersion: result.template.templateVersion,
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      name: input.name.trim(),
      campaignType: "email",
      subject: input.subject?.trim() || `LifeSupply — ${input.name.trim()}`,
      bodyDraft: result.output,
      audienceSummary: `Reactivation · ${input.bucket} · ${rows.length} recipients`,
      audienceSnapshot: audienceSnapshot as unknown as Prisma.InputJsonValue,
      aiOutputId: aiOutput.id,
      status: "draft",
      createdById: actor.id,
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "campaign.drafted",
    entityType: "campaign",
    entityId: campaign.id,
    afterData: {
      bucket: input.bucket,
      recipientCount: rows.length,
      aiOutputId: aiOutput.id,
      promptTemplateKey: result.template.templateKey,
      promptTemplateVersion: result.template.templateVersion,
    },
  });

  return campaign.id;
}

// ---------------------------------------------------------------------------
// Approval workflow — uses the existing `Approval` model with type "campaign"
// ---------------------------------------------------------------------------

export async function requestCampaignApproval(args: {
  campaignId: string;
  notes?: string | null;
  actor: { id: string };
}) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: args.campaignId },
    select: { id: true, name: true, status: true, audienceSummary: true, bodyDraft: true },
  });
  if (campaign.status !== "draft") {
    throw new CampaignTransitionError(
      `Approval can only be requested for drafts (current: "${campaign.status}").`,
    );
  }
  if (!campaign.bodyDraft || !campaign.bodyDraft.trim()) {
    throw new CampaignTransitionError("Campaign has no body — generate or write copy first.");
  }
  const existing = await prisma.approval.findFirst({
    where: {
      approvalType: "campaign",
      relatedEntityType: "Campaign",
      relatedEntityId: campaign.id,
      status: "pending",
    },
  });
  if (existing) {
    throw new CampaignTransitionError("An approval request for this campaign is already pending.");
  }

  const approval = await prisma.approval.create({
    data: {
      approvalType: "campaign",
      relatedEntityType: "Campaign",
      relatedEntityId: campaign.id,
      requestSummary: [
        `Approve campaign: ${campaign.name}`,
        campaign.audienceSummary ? `Audience: ${campaign.audienceSummary}` : null,
        args.notes ? `\n${args.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      requestedById: args.actor.id,
      status: "pending",
    },
  });

  await writeAudit({
    actorUserId: args.actor.id,
    action: "campaign.approval_requested",
    entityType: "campaign",
    entityId: campaign.id,
    afterData: { approvalId: approval.id },
  });

  return approval;
}

// ---------------------------------------------------------------------------
// Mailchimp export — live when credentials exist, stub otherwise.
// Gated on `mailchimp.send` flag + approval in either case.
// ---------------------------------------------------------------------------

export class MailchimpExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailchimpExportError";
  }
}

export async function exportCampaignToMailchimp(args: {
  campaignId: string;
  actor: { id: string };
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.MAILCHIMP_SEND);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: args.campaignId },
    select: {
      id: true,
      name: true,
      subject: true,
      status: true,
      bodyDraft: true,
      audienceSnapshot: true,
      mailchimpExportStatus: true,
      approvedById: true,
      approvedAt: true,
    },
  });

  // The campaign must already be approved through the standard Approval
  // flow. Approving the Approval row promotes the campaign to "scheduled"
  // (see approvals service), which is the only state we accept here.
  if (campaign.status !== "scheduled") {
    throw new MailchimpExportError(
      `Only campaigns in "scheduled" state can be exported (current: "${campaign.status}"). Get the campaign approved first.`,
    );
  }
  if (!campaign.approvedById || !campaign.approvedAt) {
    throw new MailchimpExportError("Campaign is missing approval metadata — refusing to export.");
  }
  if (campaign.mailchimpExportStatus === "queued" || campaign.mailchimpExportStatus === "sent") {
    throw new MailchimpExportError(
      `Campaign export is already ${campaign.mailchimpExportStatus}.`,
    );
  }

  // Decide live-or-stub at runtime. When all five Mailchimp credential
  // fields are present we hit the real API; otherwise we record a stub
  // export so the UX can still be exercised without credentials.
  const { getMailchimpClient } = await import(
    "@/server/integrations/mailchimp/client"
  );
  const configured = await getMailchimpClient();
  const audience = Array.isArray(campaign.audienceSnapshot)
    ? (campaign.audienceSnapshot as Array<{ id: string; email: string | null; name: string }>)
    : [];

  if (!configured) {
    // ---- Stub path ----
    const stubExternalId = `stub-${Date.now()}`;
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        mailchimpExportStatus: "queued",
        mailchimpExportedAt: new Date(),
        mailchimpExternalId: stubExternalId,
        mailchimpExportError: null,
      },
    });
    await writeAudit({
      actorUserId: args.actor.id,
      action: "campaign.mailchimp_export_queued",
      entityType: "campaign",
      entityId: campaign.id,
      afterData: {
        stub: true,
        reason: "no mailchimp credentials configured",
        mailchimpExternalId: stubExternalId,
        audienceCount: audience.length,
      },
    });
    return;
  }

  // ---- Live path ----
  const { client, config } = configured;
  const recipientEmails = audience
    .map((a) => a.email)
    .filter((e): e is string => typeof e === "string" && e.includes("@"));

  if (recipientEmails.length === 0) {
    throw new MailchimpExportError(
      "Audience snapshot has no valid email addresses — refusing to send.",
    );
  }

  try {
    // 1. Create a static segment scoped to the snapshot recipients.
    const segmentName = `cmd-center-${campaign.id.slice(-8)}-${Date.now()}`;
    // Mailchimp's typed client is loose; cast to unknown then to the
    // narrow shape we use to avoid an `any` leak.
    const segments = client.lists as unknown as {
      createSegment: (
        listId: string,
        body: { name: string; static_segment: string[] },
      ) => Promise<{ id: number }>;
    };
    const segment = await segments.createSegment(config.audienceListId, {
      name: segmentName,
      static_segment: recipientEmails,
    });

    // 2. Create the campaign tied to that segment.
    const campaignsApi = client.campaigns as unknown as {
      create: (body: {
        type: string;
        recipients: { list_id: string; segment_opts: { saved_segment_id: number } };
        settings: {
          subject_line: string;
          title: string;
          from_name: string;
          reply_to: string;
        };
      }) => Promise<{ id: string }>;
      setContent: (
        id: string,
        body: { plain_text: string; html?: string },
      ) => Promise<unknown>;
    };

    const created = await campaignsApi.create({
      type: "regular",
      recipients: {
        list_id: config.audienceListId,
        segment_opts: { saved_segment_id: segment.id },
      },
      settings: {
        subject_line: campaign.subject ?? campaign.name,
        title: campaign.name,
        from_name: config.fromName,
        reply_to: config.fromEmail,
      },
    });

    // 3. Push the body. Mailchimp builds an HTML version from plain_text
    // when html is omitted; safer than us assembling HTML server-side.
    await campaignsApi.setContent(created.id, {
      plain_text: campaign.bodyDraft ?? "",
    });

    // The campaign is created in DRAFT inside Mailchimp. Sending requires
    // a separate `campaigns.send(id)` call which we deliberately do NOT
    // make here — the operator schedules + sends from inside Mailchimp
    // after a final review. Per CLAUDE.md §13 we never auto-send.

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        mailchimpExportStatus: "queued",
        mailchimpExportedAt: new Date(),
        mailchimpExternalId: created.id,
        mailchimpExportError: null,
      },
    });
    await writeAudit({
      actorUserId: args.actor.id,
      action: "campaign.mailchimp_export_queued",
      entityType: "campaign",
      entityId: campaign.id,
      afterData: {
        stub: false,
        mailchimpExternalId: created.id,
        mailchimpSegmentId: segment.id,
        audienceCount: recipientEmails.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Mailchimp error";
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        mailchimpExportStatus: "failed",
        mailchimpExportedAt: new Date(),
        mailchimpExportError: message,
      },
    });
    await writeAudit({
      actorUserId: args.actor.id,
      action: "campaign.mailchimp_export_failed",
      entityType: "campaign",
      entityId: campaign.id,
      afterData: { error: message, audienceCount: recipientEmails.length },
    });
    throw new MailchimpExportError(`Mailchimp rejected the export: ${message}`);
  }
}

/** Read whether send is permitted right now without throwing. UI uses this to enable the button. */
export async function isMailchimpSendEnabled(): Promise<boolean> {
  return isFeatureOn(FEATURE_FLAGS.MAILCHIMP_SEND);
}
