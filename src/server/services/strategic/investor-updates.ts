/**
 * Investor update lifecycle:
 *   draft → under_review → approved → released → archived
 *
 * - draftInvestorUpdate(): pulls financial-period figures + a snapshot of the
 *   investor distribution list, hands them to the AI, persists InvestorUpdate
 *   in `draft` status with the AI body + distribution snapshot.
 * - requestInvestorUpdateApproval(): raises an Approval row of type
 *   "investor_material" — the existing approval flow handles the decision.
 * - releaseInvestorUpdate(): only valid after approval AND when the
 *   `investor.distribution` FeatureFlag is on. Today this is a stub: it
 *   stamps releasedAt and audit-logs intent. Wire actual email/data-room
 *   delivery in a separate ticket.
 *
 * Per CLAUDE.md §13 + §15, AI never auto-releases. Approval + flag are
 * required even after the AI draft is approved.
 */

import { type Prisma, type InvestorUpdateStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { aiCall } from "@/server/services/ai/call";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureOn, requireFeature } from "@/server/services/feature-flags";

export class InvestorUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvestorUpdateError";
  }
}

const INCLUDE = {
  financialPeriod: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
  preparedBy: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  aiOutput: { select: { id: true, modelName: true, warnings: true, assumptions: true } },
} satisfies Prisma.InvestorUpdateInclude;

export type InvestorUpdateRow = Prisma.InvestorUpdateGetPayload<{ include: typeof INCLUDE }>;

export async function listInvestorUpdates(filters: {
  status?: InvestorUpdateStatus;
  limit?: number;
} = {}): Promise<InvestorUpdateRow[]> {
  return prisma.investorUpdate.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    include: INCLUDE,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: filters.limit ?? 50,
  });
}

export async function getInvestorUpdate(id: string): Promise<InvestorUpdateRow | null> {
  return prisma.investorUpdate.findUnique({ where: { id }, include: INCLUDE });
}

// ---------------------------------------------------------------------------
// AI draft generator
// ---------------------------------------------------------------------------

export type DraftInvestorUpdateInput = {
  title: string;
  /** Free-form brief: what to cover, tone, anything the AI should emphasize. */
  brief: string;
  /** FinancialPeriod id to use. The period name + figures + status drive the body. */
  financialPeriodId: string;
};

export async function draftInvestorUpdate(
  input: DraftInvestorUpdateInput,
  actor: { id: string },
): Promise<string> {
  if (!input.title.trim()) throw new InvestorUpdateError("Title is required.");
  if (!input.brief.trim()) throw new InvestorUpdateError("Brief is required.");

  const period = await prisma.financialPeriod.findUniqueOrThrow({
    where: { id: input.financialPeriodId },
  });
  const summaries = await prisma.financialSummary.findMany({
    where: { financialPeriodId: input.financialPeriodId },
    include: { division: { select: { name: true, code: true } } },
  });

  // Snapshot the investor distribution list so the approver sees who would
  // receive this even if the investor list shifts later.
  const investors = await prisma.investor.findMany({
    where: { deletedAt: null, status: { in: ["engaged", "committed", "closed"] } },
    select: { id: true, name: true, email: true, organization: true, status: true },
    orderBy: { name: "asc" },
  });

  const fmt = (n: Prisma.Decimal | null | undefined): string => {
    if (n == null) return "(not supplied)";
    return Number(n).toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    });
  };
  const pct = (n: Prisma.Decimal | null | undefined): string => {
    if (n == null) return "(not supplied)";
    return `${(Number(n) * 100).toFixed(1)}%`;
  };

  const lines: string[] = [];
  lines.push(`# Period: ${period.name} (${period.status})`);
  lines.push(`Period dates: ${period.startDate.toISOString().slice(0, 10)} – ${period.endDate.toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push("## Financial summary by division");
  for (const s of summaries) {
    lines.push(`### ${s.division?.name ?? "Consolidated"}`);
    lines.push(`- Revenue: ${fmt(s.revenue)}`);
    lines.push(`- Gross profit: ${fmt(s.grossProfit)}  (margin ${pct(s.grossMargin)})`);
    lines.push(`- Operating income: ${fmt(s.operatingIncome)}`);
    lines.push(`- EBITDA: ${fmt(s.ebitda)}  (adjusted ${fmt(s.adjustedEbitda)})`);
    if (s.cash != null) lines.push(`- Cash: ${fmt(s.cash)}`);
    if (s.workingCapital != null) lines.push(`- Working capital: ${fmt(s.workingCapital)}`);
    lines.push(`- Approval status: ${s.approvalStatus}`);
    lines.push("");
  }
  lines.push("## Distribution");
  lines.push(
    `Recipient count at draft time: ${investors.length} (${investors.filter((i) => i.status === "engaged").length} engaged, ${investors.filter((i) => i.status === "committed").length} committed, ${investors.filter((i) => i.status === "closed").length} closed)`,
  );
  lines.push("");
  lines.push("## Brief from the preparer");
  lines.push(input.brief.trim());

  const context = lines.join("\n");
  const result = await aiCall("investor_update", { context });

  const distributionSnapshot = investors.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    organization: i.organization,
    status: i.status,
  }));

  // Surface explicit warnings so the approver sees them in the UI.
  const warnings: string[] = [];
  if (period.status !== "approved") {
    warnings.push(`Financial period "${period.name}" is "${period.status}" — figures are not yet approved.`);
  }
  const unapprovedSummaries = summaries.filter((s) => s.approvalStatus !== "approved");
  if (unapprovedSummaries.length > 0) {
    warnings.push(
      `${unapprovedSummaries.length} division summary row${unapprovedSummaries.length === 1 ? "" : "s"} not yet approved.`,
    );
  }
  if (investors.length === 0) {
    warnings.push("No investors are in engaged/committed/closed status — distribution list is empty.");
  }

  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId: actor.id,
      modelProvider: result.modelProvider,
      modelName: result.modelName,
      module: "investor_update",
      prompt: result.template.userPrompt,
      output: result.output,
      sourceReferences: {
        financialPeriodId: period.id,
        financialPeriodName: period.name,
        divisionsCount: summaries.length,
        recipientsCount: investors.length,
      },
      tokenUsage: result.tokenUsage,
      status: "generated",
      assumptions: [],
      warnings,
      confidence: null,
      promptTemplateId: result.template.templateId,
      promptTemplateKey: result.template.templateKey,
      promptTemplateVersion: result.template.templateVersion,
    },
  });

  // Pull a few highlight bullets from the AI body for the list view.
  const highlights = extractHighlights(result.output);

  const update = await prisma.investorUpdate.create({
    data: {
      title: input.title.trim(),
      periodLabel: period.name,
      financialPeriodId: period.id,
      status: "draft",
      bodyDraft: result.output,
      highlights,
      distributionSnapshot: distributionSnapshot as unknown as Prisma.InputJsonValue,
      aiOutputId: aiOutput.id,
      preparedById: actor.id,
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "investor_update.drafted",
    entityType: "investor_update",
    entityId: update.id,
    afterData: {
      financialPeriodId: period.id,
      recipients: investors.length,
      promptTemplateKey: result.template.templateKey,
      promptTemplateVersion: result.template.templateVersion,
    },
  });

  return update.id;
}

/**
 * Pull up to 5 short bullets from FINANCIAL HIGHLIGHTS for the list view.
 * Best-effort — falls back to the first 5 non-empty lines of the body.
 */
function extractHighlights(body: string): string[] {
  const sectionRe = /FINANCIAL HIGHLIGHTS\n([\s\S]*?)(?:\n[A-Z ]+\n|$)/;
  const match = body.match(sectionRe);
  const block = match?.[1] ?? body;
  const bullets = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-") || l.startsWith("•"))
    .map((l) => l.replace(/^[-•]\s*/, ""))
    .slice(0, 5);
  if (bullets.length > 0) return bullets;
  return body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Approval workflow
// ---------------------------------------------------------------------------

export async function requestInvestorUpdateApproval(args: {
  investorUpdateId: string;
  notes?: string | null;
  actor: { id: string };
}) {
  const update = await prisma.investorUpdate.findUniqueOrThrow({
    where: { id: args.investorUpdateId },
    select: { id: true, title: true, status: true, bodyDraft: true },
  });
  if (update.status !== "draft") {
    throw new InvestorUpdateError(
      `Approval can only be requested for drafts (current: "${update.status}").`,
    );
  }
  if (!update.bodyDraft || !update.bodyDraft.trim()) {
    throw new InvestorUpdateError("Update has no body — generate or write content first.");
  }
  const existing = await prisma.approval.findFirst({
    where: {
      approvalType: "investor_material",
      relatedEntityType: "InvestorUpdate",
      relatedEntityId: update.id,
      status: "pending",
    },
  });
  if (existing) {
    throw new InvestorUpdateError("An approval request is already pending.");
  }
  const approval = await prisma.approval.create({
    data: {
      approvalType: "investor_material",
      relatedEntityType: "InvestorUpdate",
      relatedEntityId: update.id,
      requestSummary: args.notes
        ? `Approve investor update: ${update.title}\n\n${args.notes}`
        : `Approve investor update: ${update.title}`,
      requestedById: args.actor.id,
      status: "pending",
    },
  });
  // Mark as under_review so the list view reflects it.
  await prisma.investorUpdate.update({
    where: { id: update.id },
    data: { status: "under_review" },
  });

  await writeAudit({
    actorUserId: args.actor.id,
    action: "investor_update.approval_requested",
    entityType: "investor_update",
    entityId: update.id,
    afterData: { approvalId: approval.id },
  });

  return approval;
}

// ---------------------------------------------------------------------------
// Release — final approval-gated, FeatureFlag-gated step
// ---------------------------------------------------------------------------

export async function releaseInvestorUpdate(args: {
  investorUpdateId: string;
  actor: { id: string };
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.INVESTOR_DISTRIBUTION);

  const update = await prisma.investorUpdate.findUniqueOrThrow({
    where: { id: args.investorUpdateId },
    select: {
      id: true,
      title: true,
      status: true,
      approvedById: true,
      approvedAt: true,
      distributionSnapshot: true,
    },
  });
  if (update.status !== "approved") {
    throw new InvestorUpdateError(
      `Only approved updates can be released (current: "${update.status}").`,
    );
  }
  if (!update.approvedById || !update.approvedAt) {
    throw new InvestorUpdateError("Update is missing approval metadata — refusing to release.");
  }

  // Stub: today we record release intent + audit. Actual email / data-room
  // delivery lands in a follow-up ticket.
  await prisma.investorUpdate.update({
    where: { id: update.id },
    data: { status: "released", releasedAt: new Date() },
  });

  const recipients = Array.isArray(update.distributionSnapshot)
    ? update.distributionSnapshot.length
    : null;

  await writeAudit({
    actorUserId: args.actor.id,
    action: "investor_update.released",
    entityType: "investor_update",
    entityId: update.id,
    afterData: { stub: true, recipients },
  });
}

export async function isInvestorDistributionEnabled(): Promise<boolean> {
  return isFeatureOn(FEATURE_FLAGS.INVESTOR_DISTRIBUTION);
}
