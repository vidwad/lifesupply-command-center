import { Prisma, type AiModelProvider, type PromptTemplate } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

/**
 * Built-in fallback templates. The DB row wins when present; this is the
 * safety net for fresh installs and tests where no seed has been run.
 *
 * Keep these prompts identical to the original hardcoded versions in
 * src/server/services/ai/index.ts so the migration is invisible to
 * existing AI behavior.
 */
const BUILTIN: Record<
  string,
  Omit<PromptTemplate, "id" | "createdAt" | "updatedAt" | "createdById">
> = {
  dashboard_briefing: {
    key: "dashboard_briefing",
    version: 1,
    name: "Daily management briefing",
    description: "OBSERVATIONS / EXCEPTIONS / RECOMMENDED ACTIONS sections from dashboard data.",
    provider: "anthropic",
    modelHint: null,
    systemPrompt: `You are the LifeSupply Command Center management analyst.

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
- 2-4 short bullets describing what the owner should do today.
- Each bullet should be a specific, actionable item.

Do not include preamble, sign-off, or explanation. Output the three sections only.

Always distinguish facts from assumptions. If data is stale or missing, say so.`,
    userTemplate: `Today's data is below. Write a daily management briefing using the format in the system prompt.\n\n{{context}}`,
    outputSchema: null,
    contextTags: ["financial", "operating"],
    isActive: true,
  },
  analyst_query: {
    key: "analyst_query",
    version: 1,
    name: "AI Analyst chat",
    description: "Natural-language Q&A grounded in the executive snapshot.",
    provider: "anthropic",
    modelHint: null,
    systemPrompt: `You are the LifeSupply Command Center management analyst — answering ad-hoc
questions for the business owner using ONLY the snapshot provided.

Rules:
- Ground every answer in the data provided. If the data does not contain the
  answer, say so explicitly. Do not invent figures.
- Be direct and concise. Use short paragraphs and bullet lists where helpful.
- When you do quote numbers, attribute them to the source ("Per the open
  period…", "Per the order queue…").
- Distinguish facts from inferences. Mark inferences as such.
- Recommend a clear next step when one is appropriate.
- Never claim to take an action. You only analyze and advise.`,
    userTemplate: `## Today's snapshot\n\n{{context}}\n\n## Question\n\n{{question}}`,
    outputSchema: null,
    contextTags: ["financial", "operating", "customer"],
    isActive: true,
  },
  opportunity_analysis: {
    key: "opportunity_analysis",
    version: 1,
    name: "M&A opportunity memo",
    description: "Structured strategic memo for an opportunity record.",
    provider: "anthropic",
    modelHint: null,
    systemPrompt: `You are the LifeSupply Command Center strategic analyst preparing a one-page
memo on an M&A or strategic opportunity for the business owner.

Structure the memo as follows, in order, with these EXACT section headings:

SUMMARY
- 1-2 sentences plainly describing the opportunity and the action under consideration.

STRATEGIC RATIONALE
- 3-5 bullets on why this fits LifeSupply's strategy. Reference revenue scale,
  product mix, geographic fit, supplier relationships, and capability gaps.

KEY RISKS
- 3-5 bullets on what could go wrong. Be honest. Flag integration complexity,
  customer concentration, regulatory exposure, supplier risk, and execution risk.

QUESTIONS FOR DILIGENCE
- 3-6 specific questions that should be answered before proceeding.

RECOMMENDATION
- One paragraph: PROCEED, PAUSE, or DECLINE — with the most important reason.

Tone: owner-to-owner. No buzzwords. Mark inferences clearly. Never invent
financial figures. If data is missing, list it as a diligence question rather
than fabricating an estimate.`,
    userTemplate: `{{context}}\n\nProduce the memo.`,
    outputSchema: null,
    contextTags: ["strategic", "investor"],
    isActive: true,
  },
  campaign_draft: {
    key: "campaign_draft",
    version: 1,
    name: "Reactivation campaign draft",
    description: "Drafts a short reactivation email body + tone guidance based on a marketer brief and audience snapshot.",
    provider: "anthropic",
    modelHint: null,
    systemPrompt: `You are the LifeSupply Command Center marketing analyst, drafting a
short reactivation email for a Canadian medical-supply business serving
clinics, institutional buyers, and retail customers.

Voice: warm, helpful, direct. No marketing fluff. Never make medical claims.
Never quote prices, percentages, or stats unless they appear in the brief
verbatim. Address the reader as "you", not by name.

Format the output as plain text with these EXACT sections, in this order:

SUBJECT
- One subject line, ≤ 65 chars, plain — no all-caps, no emoji, no exclamation.

PREVIEW TEXT
- One sentence, ≤ 110 chars, that complements the subject without repeating it.

BODY
- 2–4 short paragraphs. Plain text. No HTML.
- Open with why we're reaching out (lapsed customer, time-of-year, new
  product range, etc. — taken from the brief).
- Mention one concrete next step the reader can take (browse a category,
  contact a rep, request a quote). Do not promise discounts.
- Close with a one-line sign-off from "The LifeSupply team".

DISCLOSURES
- Always include this exact line as the last paragraph of BODY:
  "You're receiving this email because you've ordered from LifeSupply before.
  If you'd prefer not to hear from us, you can unsubscribe at any time."

Rules:
- Never invent product names, SKUs, prices, or testimonials.
- If the brief asks for content that violates Canadian anti-spam (CASL) or
  medical-advice guidance, refuse and produce a SUBJECT that says
  "BLOCKED — see body" with the body explaining the issue.
- Never include any recipient names from the audience sample — the sample is
  for tone calibration only.`,
    userTemplate: `{{context}}\n\nDraft the campaign for the {{bucket}} reactivation bucket.`,
    outputSchema: null,
    contextTags: ["customer"],
    isActive: true,
  },
};

export type RenderedPrompt = {
  templateId: string | null;
  templateKey: string;
  templateVersion: number;
  provider: AiModelProvider;
  modelHint: string | null;
  systemPrompt: string;
  userPrompt: string;
};

/**
 * Pure helper: substitute `{{variable}}` placeholders in a template string.
 * Variables not provided are left as-is so debugging in dev makes a missing
 * variable visible. Exported for unit tests.
 */
export function applyPlaceholders(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [name, value] of Object.entries(vars)) {
    out = out.split(`{{${name}}}`).join(value);
  }
  return out;
}

/**
 * Resolve the active version of a template (or the built-in if not in DB)
 * and render `{{var}}` placeholders into the user prompt. Variables that
 * do not appear in `vars` are left as-is for visibility during debugging.
 */
export async function renderPrompt(
  key: string,
  vars: Record<string, string>,
): Promise<RenderedPrompt> {
  const dbRow = await prisma.promptTemplate.findFirst({
    where: { key, isActive: true },
    orderBy: { version: "desc" },
  });

  const source = dbRow
    ? {
        id: dbRow.id,
        key: dbRow.key,
        version: dbRow.version,
        provider: dbRow.provider,
        modelHint: dbRow.modelHint,
        systemPrompt: dbRow.systemPrompt,
        userTemplate: dbRow.userTemplate,
      }
    : (() => {
        const fallback = BUILTIN[key];
        if (!fallback) throw new Error(`No prompt template registered for key "${key}"`);
        return {
          id: null,
          key: fallback.key,
          version: fallback.version,
          provider: fallback.provider,
          modelHint: fallback.modelHint,
          systemPrompt: fallback.systemPrompt,
          userTemplate: fallback.userTemplate,
        };
      })();

  const userPrompt = applyPlaceholders(source.userTemplate, vars);

  return {
    templateId: source.id,
    templateKey: source.key,
    templateVersion: source.version,
    provider: source.provider,
    modelHint: source.modelHint,
    systemPrompt: source.systemPrompt,
    userPrompt,
  };
}

export type PromptTemplateSummary = {
  key: string;
  activeVersion: number;
  totalVersions: number;
  provider: AiModelProvider;
  description: string | null;
  isFromDb: boolean;
};

export async function listPromptTemplates(): Promise<PromptTemplateSummary[]> {
  const grouped = await prisma.promptTemplate.groupBy({
    by: ["key"],
    _max: { version: true },
    _count: { _all: true },
  });
  const dbKeys = new Set(grouped.map((g) => g.key));

  const dbRows = await prisma.promptTemplate.findMany({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });
  const activeByKey = new Map(dbRows.map((r) => [r.key, r]));

  const fromDb: PromptTemplateSummary[] = grouped.map((g) => {
    const active = activeByKey.get(g.key);
    return {
      key: g.key,
      activeVersion: g._max.version ?? 1,
      totalVersions: g._count._all,
      provider: active?.provider ?? "anthropic",
      description: active?.description ?? null,
      isFromDb: true,
    };
  });

  const fromBuiltin: PromptTemplateSummary[] = Object.values(BUILTIN)
    .filter((b) => !dbKeys.has(b.key))
    .map((b) => ({
      key: b.key,
      activeVersion: b.version,
      totalVersions: 1,
      provider: b.provider,
      description: b.description,
      isFromDb: false,
    }));

  return [...fromDb, ...fromBuiltin].sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Seed any missing built-in templates into the DB. Idempotent — used by
 * the seed script and as a safety net at first AI call if needed.
 */
export async function seedBuiltinTemplates(actor?: { id: string }): Promise<number> {
  let inserted = 0;
  for (const builtin of Object.values(BUILTIN)) {
    const existing = await prisma.promptTemplate.findFirst({
      where: { key: builtin.key, version: builtin.version },
    });
    if (existing) continue;
    await prisma.promptTemplate.create({
      data: {
        key: builtin.key,
        version: builtin.version,
        name: builtin.name,
        description: builtin.description,
        provider: builtin.provider,
        modelHint: builtin.modelHint,
        systemPrompt: builtin.systemPrompt,
        userTemplate: builtin.userTemplate,
        outputSchema: builtin.outputSchema ?? Prisma.JsonNull,
        contextTags: builtin.contextTags,
        isActive: builtin.isActive,
        createdById: actor?.id ?? null,
      },
    });
    inserted++;
    await writeAudit({
      actorUserId: actor?.id ?? null,
      action: "prompt_template.seeded",
      entityType: "prompt_template",
      entityId: builtin.key,
      afterData: { key: builtin.key, version: builtin.version },
    });
  }
  return inserted;
}
