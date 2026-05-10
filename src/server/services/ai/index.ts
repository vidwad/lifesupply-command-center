import { revalidatePath } from "next/cache";

import type { AiOutput } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { ANTHROPIC_MODEL, getAnthropicClient } from "@/server/integrations/anthropic/client";
import { getDashboardData } from "@/server/services/dashboard";

// -----------------------------------------------------------------------------
// Daily management briefing
// -----------------------------------------------------------------------------

const BRIEFING_SYSTEM_PROMPT = `You are the LifeSupply Command Center management analyst.

You write concise daily briefings for the owner of a Canadian medical-supply business
operating LifeSupply.ca (B2B/clinic), Wellmart Medical (retail), and U.S. operations.

Voice: professional, direct, owner-to-owner. No marketing fluff. Surface what
matters and what management should do about it.

Format the output as plain text with these EXACT sections, in this order:

OBSERVATIONS
- 3-5 short bullets summarizing today's operating + financial position.

EXCEPTIONS
- 0-5 short bullets describing orders or issues that need attention.
- Reference order numbers (e.g. LS-1032) and supplier codes (e.g. BBM01) when relevant.
- If there are no exceptions, write a single bullet: "- None today."

RECOMMENDED ACTIONS
- 1-4 bullets with concrete next actions, ranked by priority.
- Each action should be something the owner can decide on or delegate.

Rules:
- Use the data provided; do not invent numbers.
- Distinguish facts from recommendations.
- Never instruct anyone to send emails, place supplier orders, or push external
  updates without human approval.`;

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

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "AI provider is not configured. Set ANTHROPIC_API_KEY in your .env to enable live briefings.",
    );
    this.name = "AiNotConfiguredError";
  }
}

export async function generateDashboardBriefing(userId: string): Promise<AiOutput> {
  const client = getAnthropicClient();
  if (!client) throw new AiNotConfiguredError();

  const data = await getDashboardData();
  const context = buildBriefingContext(data);

  const userPrompt = `Today's data is below. Write a daily management briefing using the format in the system prompt.\n\n${context}`;

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: BRIEFING_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const output = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  const sourceReferences = {
    period: data.period?.name,
    previousPeriod: data.previousPeriod?.name,
    exceptionOrderNumbers: data.exceptions.map((e) => e.orderNumber),
    topProductIds: data.topProducts.map((p) => p.id),
  };

  const tokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };

  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId,
      modelProvider: "anthropic",
      modelName: response.model,
      module: "dashboard_briefing",
      prompt: userPrompt,
      output,
      sourceReferences,
      tokenUsage,
      status: "generated",
    },
  });

  await writeAudit({
    actorUserId: userId,
    action: "ai.briefing_generated",
    entityType: "AiOutput",
    entityId: aiOutput.id,
    afterData: { module: "dashboard_briefing", model: response.model, tokenUsage },
  });

  revalidatePath("/dashboard");
  return aiOutput;
}

// -----------------------------------------------------------------------------
// AI Analyst — open Q&A grounded in the dashboard snapshot
// -----------------------------------------------------------------------------

const ANALYST_SYSTEM_PROMPT = `You are the LifeSupply Command Center analyst.

The owner asks you questions about the business. Today's snapshot is supplied
in the user message. Answer concisely (under ~250 words unless the question
genuinely needs more), grounded ONLY in the provided data.

Voice: direct, owner-to-owner, professional. No marketing fluff.

Rules:
- If a question can't be answered from the supplied data, say so plainly and
  list what data you would need.
- Reference order numbers (e.g. LS-1032), supplier codes (BBM01), customer
  names, period names verbatim from the data.
- Distinguish facts from your recommendations.
- Never instruct anyone to send emails, place supplier orders, modify pricing
  on external systems, or push external updates without human approval.
- For financial figures, use the consolidated numbers unless the question is
  about a specific division.`;

export async function askAiAnalyst(args: { question: string; userId: string }): Promise<AiOutput> {
  const client = getAnthropicClient();
  if (!client) throw new AiNotConfiguredError();

  const trimmed = args.question.trim();
  if (!trimmed) throw new Error("Question is required.");

  const data = await getDashboardData();
  const context = buildBriefingContext(data);

  const userPrompt = `## Today's snapshot\n\n${context}\n\n## Question\n\n${trimmed}`;

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: ANALYST_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const output = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId: args.userId,
      modelProvider: "anthropic",
      modelName: response.model,
      module: "analyst_query",
      prompt: trimmed,
      output,
      sourceReferences: {
        period: data.period?.name,
        exceptionOrderNumbers: data.exceptions.map((e) => e.orderNumber),
      },
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      status: "generated",
    },
  });

  await writeAudit({
    actorUserId: args.userId,
    action: "ai.analyst_query",
    entityType: "AiOutput",
    entityId: aiOutput.id,
    afterData: {
      module: "analyst_query",
      model: response.model,
      questionPreview: trimmed.slice(0, 120),
    },
  });

  revalidatePath("/ai-analyst");
  return aiOutput;
}

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
