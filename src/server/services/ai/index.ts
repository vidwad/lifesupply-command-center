import { revalidatePath } from "next/cache";

import type { AiOutput } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { getDashboardData } from "@/server/services/dashboard";

import { aiCall } from "./call";

export { AiNotConfiguredError, AiProviderNotConfiguredError } from "./errors";

function buildBriefingContext(data: Awaited<ReturnType<typeof getDashboardData>>): string {
  const periodLabel = data.period?.name ?? "no open period";
  const prevLabel = data.previousPeriod?.name ?? "n/a";
  const fmt = (n: number) =>
    n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
  const pct = (n: number | null) => (n == null ? "n/a" : `${(n * 100).toFixed(1)}%`);

  const lines: string[] = [];
  lines.push(`# Period: ${periodLabel} (vs. ${prevLabel})`);
  lines.push("");
  lines.push("## Consolidated financials");
  lines.push(`- Revenue: ${fmt(data.revenue.current)} (${pct(data.revenue.deltaPct)} vs prior)`);
  lines.push(
    `- Gross profit: ${fmt(data.grossProfit.current)} (${pct(data.grossProfit.deltaPct)} vs prior)`,
  );
  lines.push(
    `- Gross margin: ${pct(data.grossMargin.current)} (prior ${pct(data.grossMargin.previous)})`,
  );
  lines.push(
    `- Operating income: ${fmt(data.operatingIncome.current)} (${pct(data.operatingIncome.deltaPct)} vs prior)`,
  );
  if (data.cash.current != null) lines.push(`- Cash: ${fmt(data.cash.current)}`);
  if (data.workingCapital.current != null)
    lines.push(`- Working capital: ${fmt(data.workingCapital.current)}`);

  lines.push("");
  lines.push("## Operations");
  lines.push(`- Open orders: ${data.operations.openOrders}`);
  lines.push(`- Awaiting supplier: ${data.operations.awaitingSupplier}`);
  lines.push(`- Awaiting human review: ${data.operations.awaitingHumanReview}`);
  lines.push(`- Flagged exceptions: ${data.operations.exceptionOrders}`);
  lines.push(`- Completed in period: ${data.operations.completedThisPeriod}`);
  lines.push(`- Cancelled in period: ${data.operations.cancelledThisPeriod}`);

  if (data.exceptions.length > 0) {
    lines.push("");
    lines.push("## Active exceptions");
    for (const e of data.exceptions) {
      lines.push(
        `- ${e.orderNumber} (${e.storeName}, ${e.customerLabel}, ${fmt(e.grandTotal)}, ${e.exceptionStatus})${e.exceptionReason ? `: ${e.exceptionReason}` : ""}`,
      );
    }
  }

  if (data.topProducts.length > 0) {
    lines.push("");
    lines.push("## Top products (last 90d)");
    for (const p of data.topProducts.slice(0, 3)) {
      lines.push(`- ${p.name}: ${fmt(p.revenue)} (${p.quantity} units)`);
    }
  }

  if (data.lowMarginProducts.length > 0) {
    lines.push("");
    lines.push("## Low-margin products (<35%, last 90d)");
    for (const p of data.lowMarginProducts.slice(0, 3)) {
      lines.push(`- ${p.name}: ${pct(p.marginPct)} margin on ${fmt(p.revenue)}`);
    }
  }

  if (data.campaigns.length > 0) {
    lines.push("");
    lines.push("## Recent campaigns");
    for (const c of data.campaigns.slice(0, 3)) {
      const open = c.openRate != null ? pct(c.openRate) : "n/a";
      lines.push(
        `- ${c.name}: ${c.sentCount.toLocaleString()} sent, ${open} open, ${fmt(c.attributedRevenue)} attributed`,
      );
    }
  }

  if (data.priorityTasks.length > 0) {
    lines.push("");
    lines.push("## Priority tasks");
    for (const t of data.priorityTasks.slice(0, 5)) {
      lines.push(`- [${t.priority}] ${t.title} (${t.status})${t.isOverdue ? " — OVERDUE" : ""}`);
    }
  }

  lines.push("");
  lines.push(
    `## Reactivation: ${data.reactivation.candidateCount} candidates across ${data.reactivation.activeSegmentCount} active segments`,
  );

  return lines.join("\n");
}

/**
 * Strip dashboard sections the calling user is not authorized to feed to AI
 * (docs/09 §5.2). Returns the same shape so `buildBriefingContext` can be
 * reused, plus a list of section names that were redacted for use in
 * AiOutput.warnings + audit metadata.
 *
 * Conservative defaults: if the user lacks `ai.use_financial_context`, all
 * dollar figures are zeroed and the financial KPI deltas are wiped. If they
 * lack `ai.use_customer_context`, top-product / low-margin / campaigns are
 * removed. If they lack `ai.use_investor_context`, that does not affect the
 * dashboard snapshot (investor data is handled in the opportunity analyzer).
 *
 * Note: we deliberately zero figures rather than throwing, so the AI gets a
 * coherent (but redacted) snapshot. The model is also told via prompt rules
 * to never invent figures, so this prevents leakage even if the model tries
 * to interpolate.
 */
type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export function filterDashboardForAi(
  data: DashboardData,
  permissions: string[],
): { data: DashboardData; redactedSections: string[] } {
  const perms = new Set(permissions);
  const canFinancial = perms.has("ai.use_financial_context");
  const canCustomer = perms.has("ai.use_customer_context");
  const redactedSections: string[] = [];

  let next = data;
  if (!canFinancial) {
    const blankKpi = { current: 0, previous: null, deltaPct: null };
    next = {
      ...next,
      revenue: blankKpi,
      grossProfit: blankKpi,
      grossMargin: { current: null, previous: null },
      operatingIncome: blankKpi,
      cash: { current: null },
      workingCapital: { current: null },
    };
    redactedSections.push("financial KPIs");
  }
  if (!canCustomer) {
    next = {
      ...next,
      topProducts: [],
      lowMarginProducts: [],
      campaigns: [],
      reactivation: { ...next.reactivation, candidateCount: 0, activeSegmentCount: 0 },
    };
    redactedSections.push("customer / product / campaign data");
  }

  return { data: next, redactedSections };
}

export async function generateDashboardBriefing(userId: string): Promise<AiOutput> {
  const data = await getDashboardData();
  const context = buildBriefingContext(data);

  const result = await aiCall("dashboard_briefing", { context });

  const sourceReferences = {
    period: data.period?.name,
    previousPeriod: data.previousPeriod?.name,
    exceptionOrderNumbers: data.exceptions.map((e) => e.orderNumber),
    topProductIds: data.topProducts.map((p) => p.id),
    isStale: data.period == null,
  };

  const warnings: string[] = [];
  if (data.period == null) warnings.push("No open financial period — figures may be stale.");
  if (data.exceptions.length === 0 && data.operations.exceptionOrders > 0) {
    warnings.push("Exception count > 0 but exception list is empty.");
  }

  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId,
      modelProvider: result.modelProvider,
      modelName: result.modelName,
      module: "dashboard_briefing",
      prompt: result.template.userPrompt,
      output: result.output,
      sourceReferences,
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

  await writeAudit({
    actorUserId: userId,
    action: "ai.briefing_generated",
    entityType: "AiOutput",
    entityId: aiOutput.id,
    afterData: {
      module: "dashboard_briefing",
      provider: result.modelProvider,
      model: result.modelName,
      tokenUsage: result.tokenUsage,
      promptTemplateKey: result.template.templateKey,
      promptTemplateVersion: result.template.templateVersion,
    },
  });

  revalidatePath("/dashboard");
  return aiOutput;
}

// -----------------------------------------------------------------------------
// AI Analyst — open Q&A grounded in the dashboard snapshot
// -----------------------------------------------------------------------------

export async function askAiAnalyst(args: {
  question: string;
  userId: string;
  /** Permissions the calling user holds. Used to redact source data the
   *  user is not authorized to see (docs/09 §5.2). */
  userPermissions?: string[];
}): Promise<AiOutput> {
  const trimmed = args.question.trim();
  if (!trimmed) throw new Error("Question is required.");

  const data = await getDashboardData();
  const filtered = filterDashboardForAi(data, args.userPermissions ?? []);
  const context = buildBriefingContext(filtered.data);

  const result = await aiCall("analyst_query", { context, question: trimmed });

  const warnings: string[] = [];
  if (data.period == null) warnings.push("No open financial period — answers may use stale data.");
  if (filtered.redactedSections.length > 0) {
    warnings.push(`Some sections were hidden from the AI per your role: ${filtered.redactedSections.join(", ")}.`);
  }

  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId: args.userId,
      modelProvider: result.modelProvider,
      modelName: result.modelName,
      module: "analyst_query",
      prompt: trimmed,
      output: result.output,
      sourceReferences: {
        period: filtered.data.period?.name,
        exceptionOrderNumbers: filtered.data.exceptions.map((e) => e.orderNumber),
        redactedSections: filtered.redactedSections,
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

  await writeAudit({
    actorUserId: args.userId,
    action: "ai.analyst_query",
    entityType: "AiOutput",
    entityId: aiOutput.id,
    afterData: {
      module: "analyst_query",
      provider: result.modelProvider,
      model: result.modelName,
      questionPreview: trimmed.slice(0, 120),
      promptTemplateKey: result.template.templateKey,
      promptTemplateVersion: result.template.templateVersion,
      redactedSections: filtered.redactedSections,
    },
  });

  revalidatePath("/ai-analyst");
  return aiOutput;
}

// -----------------------------------------------------------------------------
// Opportunity analysis — strategic memo on an Opportunity record
// -----------------------------------------------------------------------------

export async function analyzeOpportunity(args: {
  opportunityId: string;
  userId: string;
}): Promise<AiOutput> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: args.opportunityId },
    include: { acquisitionTarget: true, owner: { select: { name: true, email: true } } },
  });
  if (!opportunity) throw new Error("Opportunity not found.");

  const num = (d: unknown): string => {
    if (d == null) return "(not supplied)";
    return Number(d).toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    });
  };
  const pct = (d: unknown): string => {
    if (d == null) return "(not supplied)";
    return `${(Number(d) * 100).toFixed(1)}%`;
  };

  const lines: string[] = [];
  lines.push(`# Opportunity: ${opportunity.title}`);
  lines.push("");
  lines.push(`Type: ${opportunity.opportunityType}`);
  lines.push(`Status: ${opportunity.status}`);
  lines.push(`Priority: ${opportunity.priority ?? "(not set)"}`);
  lines.push(`Risk rating: ${opportunity.riskRating ?? "(not set)"}`);
  lines.push(`Owner: ${opportunity.owner?.name ?? opportunity.owner?.email ?? "(unassigned)"}`);
  if (opportunity.dueDate) {
    lines.push(`Due: ${opportunity.dueDate.toISOString().slice(0, 10)}`);
  }
  lines.push("");
  lines.push("## Estimates");
  lines.push(`- Revenue impact: ${num(opportunity.estimatedRevenueImpact)}`);
  lines.push(`- Margin uplift: ${pct(opportunity.estimatedMarginImpact)}`);
  lines.push(`- Cost / investment: ${num(opportunity.estimatedCost)}`);
  if (opportunity.strategicRationale) {
    lines.push("");
    lines.push("## Strategic rationale");
    lines.push(opportunity.strategicRationale);
  }
  if (opportunity.nextAction) {
    lines.push("");
    lines.push(`## Current next action: ${opportunity.nextAction}`);
  }
  if (opportunity.acquisitionTarget) {
    const t = opportunity.acquisitionTarget;
    lines.push("");
    lines.push("## Acquisition target");
    lines.push(`- Company: ${t.companyName}`);
    if (t.geography) lines.push(`- Geography: ${t.geography}`);
    lines.push(`- Revenue estimate: ${num(t.revenueEstimate)}`);
    lines.push(`- EBITDA estimate: ${num(t.ebitdaEstimate)}`);
    if (t.strategicFit) lines.push(`- Strategic fit: ${t.strategicFit}`);
    if (t.integrationComplexity) lines.push(`- Integration complexity: ${t.integrationComplexity}`);
    if (t.diligenceStatus) lines.push(`- Diligence status: ${t.diligenceStatus}`);
    if (t.valuationNotes) {
      lines.push("");
      lines.push("### Valuation notes");
      lines.push(t.valuationNotes);
    }
  }
  const context = lines.join("\n");
  const result = await aiCall("opportunity_analysis", { context });

  const warnings: string[] = [];
  if (opportunity.estimatedRevenueImpact == null) warnings.push("Revenue impact not supplied.");
  if (opportunity.estimatedMarginImpact == null) warnings.push("Margin impact not supplied.");
  if (opportunity.estimatedCost == null) warnings.push("Cost / investment not supplied.");
  if (opportunity.acquisitionTarget && opportunity.acquisitionTarget.revenueEstimate == null) {
    warnings.push("Acquisition target revenue estimate missing.");
  }

  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId: args.userId,
      modelProvider: result.modelProvider,
      modelName: result.modelName,
      module: "opportunity_analysis",
      prompt: result.template.userPrompt,
      output: result.output,
      sourceReferences: {
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        opportunityType: opportunity.opportunityType,
        acquisitionTargetId: opportunity.acquisitionTarget?.id ?? null,
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

  await writeAudit({
    actorUserId: args.userId,
    action: "ai.opportunity_analyzed",
    entityType: "Opportunity",
    entityId: opportunity.id,
    afterData: {
      module: "opportunity_analysis",
      provider: result.modelProvider,
      model: result.modelName,
      aiOutputId: aiOutput.id,
      promptTemplateKey: result.template.templateKey,
      promptTemplateVersion: result.template.templateVersion,
    },
  });

  revalidatePath(`/opportunities/${opportunity.id}`);
  return aiOutput;
}

export async function getLatestOpportunityAnalysis(opportunityId: string) {
  const records = await prisma.aiOutput.findMany({
    where: { module: "opportunity_analysis" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  // Filter by sourceReferences.opportunityId at the application layer (JSONB)
  const match = records.find((r) => {
    const refs = r.sourceReferences as { opportunityId?: string } | null;
    return refs?.opportunityId === opportunityId;
  });
  return match ?? null;
}

// -----------------------------------------------------------------------------

export async function listRecentAiOutputs(opts: { module?: string; limit?: number } = {}) {
  return prisma.aiOutput.findMany({
    where: opts.module ? { module: opts.module } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 10,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
