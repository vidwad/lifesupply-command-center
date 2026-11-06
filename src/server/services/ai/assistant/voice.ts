/**
 * Live voice sessions on OpenAI's GPT-Live (docs/43 Stage 3, 2026-11-06).
 *
 * The browser sends its WebRTC offer here; this module opens the session
 * with the API key, which never leaves the server, and returns the answer.
 * GPT-Live holds the spoken conversation and delegates every question
 * about the business to a backend Responses model that carries the same
 * read-only tools as text mode. The tool calls come back to the browser on
 * the session's data channel, the browser relays each to the tool route,
 * and the result goes back the same way; the browser never runs a tool.
 *
 * Costs: the voice session is billed by the second, and the backend model
 * by its tokens. Both are written to the ledger under `assistant.voice`:
 * the session's row is created at zero seconds and overwritten as the
 * browser reports cumulative seconds, so a cut connection still leaves what
 * was spent; each backend response is one row, keyed by its id.
 *
 * This module calls OpenAI with fetch rather than the SDK client: the SDK
 * has no wrapper for the Live sessions endpoint and the request carries no
 * usage to meter. The budget check the client wrapper would make is made
 * here explicitly, before the session opens.
 */
import type { Prisma } from "@prisma/client";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import {
  resolveOpenAiRealtimeModel,
  resolveOpenAiRealtimeVoice,
} from "@/server/integrations/openai/client";
import { requireFeature } from "@/server/services/feature-flags";
import { resolveCredential } from "@/server/services/integrations";

import {
  assertAiBudget,
  evaluateAiBudget,
  getAiBudgetLimits,
  getAiBudgetSpent,
  recordAiUsage,
  startOfBudgetDay,
} from "../budget";
import { AiProviderNotConfiguredError } from "../errors";
import { estimateCostUsd, type UsageCounts } from "../pricing";
import { resolveAssistantModel, serialiseToolResult } from "./answer";
import { buildAssistantInstructions } from "./prompt";
import { canQueryDatabase, runAssistantTool, toolsForPermissions } from "./tools";
import type { AssistantPageContext } from "./types";

export const LIVE_SESSIONS_URL = "https://api.openai.com/v1/live/sessions";
/** The ledger feature and the AiOutput module for a session. */
export const VOICE_FEATURE = "assistant.voice";
/** Seconds OpenAI bills while a WebRTC session initialises, credited back once it runs. */
export const LIVE_INITIALISATION_SECONDS = 15;

export class VoiceModelError extends Error {
  constructor(model: string) {
    super(
      `Live voice runs on OpenAI's GPT-Live models (gpt-live-1). "${model}" is not one; set the live-dialog model in Admin → AI Settings.`,
    );
    this.name = "VoiceModelError";
  }
}

export class VoiceSessionNotFoundError extends Error {
  constructor() {
    super("That voice session is not yours or does not exist.");
    this.name = "VoiceSessionNotFoundError";
  }
}

export function isLiveModel(model: string): boolean {
  return /^gpt-live/i.test(model.trim());
}

/**
 * Pure: what the voice model is told. Follows OpenAI's template for
 * gpt-live-1: a role, a backchannel policy, an interruption policy, and a
 * delegation policy that names when to generate <|SpawnThinking|>, the
 * token that hands the question to the backend.
 */
export function buildVoiceInstructions(args: { pageTitle?: string | null }): string {
  const page = args.pageTitle
    ? ` They are looking at ${args.pageTitle} in the Command Center.`
    : "";
  return [
    `You are the LifeSupply Command Center assistant, speaking with a manager of LifeSupply, a Canadian medical-supply group.${page}`,
    "Speak briefly and plainly: lead with the figure or the point, then one or two supporting facts. Figures come only from the backend; never estimate one yourself, and say when the backend had nothing.",
    "",
    "Backchannel policy: a short acknowledgement when the person finishes a question; while the backend works, say once that you are checking, then wait.",
    "",
    "Interruption policy: stop speaking as soon as the person speaks, and listen.",
    "",
    "Delegation policy:",
    "Backend tools: the Command Center's data (sales, customers, orders, products, finance, tasks, exceptions, pricing), the storefronts' APIs, the public website, and web search.",
    "Generate <|SpawnThinking|> when: the person asks for any figure, record, list, comparison or trend, anything about the business, the stores, customers, orders, products, the website or the market, or asks you to look something up or check something.",
    "Do not generate <|SpawnThinking|> when: the person greets you, asks you to repeat, slow down or summarise what you already said, or asks what you can do.",
    "",
    "Never read out email addresses, phone numbers or street addresses unless the person asks for that customer's by name. You take no actions: if asked to change, send, order or publish something, say that a person does that in the Command Center.",
  ].join("\n");
}

/** Pure: the transcript as the AiOutput stores it. */
export function transcriptText(lines: { role: string; text: string }[]): string {
  return lines
    .map((line) => `${line.role === "assistant" ? "Assistant" : "User"}: ${line.text.trim()}`)
    .join("\n");
}

export type VoiceSessionStart = {
  /** The SDP answer the browser sets as its remote description. */
  sdp: string;
  sessionId: string;
  aiOutputId: string;
  model: string;
  voice: string;
  backendModel: string;
  maxSeconds: number;
  expiresAt: string;
};

export type CreateVoiceSessionArgs = {
  userId: string;
  permissions: string[];
  /** The browser's WebRTC offer. */
  sdp: string;
  pageContext?: AssistantPageContext | null;
  now?: Date;
  /** For tests. */
  fetchImpl?: typeof fetch;
};

/** Pure: the request OpenAI receives, so a test can pin it. */
export function buildLiveSessionRequest(args: {
  model: string;
  voice: string;
  backendModel: string;
  voiceInstructions: string;
  backendInstructions: string;
  tools: { name: string; description: string; parameters: Record<string, unknown> }[];
  sdp: string;
}) {
  return {
    session: {
      model: args.model,
      instructions: args.voiceInstructions,
      audio: { output: { voice: args.voice } },
      delegation: {
        type: "responses",
        responses: {
          model: args.backendModel,
          instructions: args.backendInstructions,
          tools: [
            { type: "web_search" },
            ...args.tools.map((tool) => ({
              type: "function",
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
              strict: false,
            })),
          ],
          tool_choice: "auto",
        },
      },
    },
    transport: { type: "webrtc", sdp: args.sdp },
  };
}

export async function createVoiceSession(args: CreateVoiceSessionArgs): Promise<VoiceSessionStart> {
  const now = args.now ?? new Date();
  if (!args.sdp || !args.sdp.includes("v=0")) throw new Error("A WebRTC offer is required.");
  await requireFeature(FEATURE_FLAGS.AI_LIVE_VOICE);
  await assertAiBudget({ userId: args.userId, kind: "voice", now });

  const apiKey = await resolveCredential("openai", "apiKey");
  if (!apiKey) throw new AiProviderNotConfiguredError("openai");

  const [model, voice, backendModel, limits, stores] = await Promise.all([
    resolveOpenAiRealtimeModel(),
    resolveOpenAiRealtimeVoice(),
    resolveAssistantModel(),
    getAiBudgetLimits(),
    prisma.store.findMany({ select: { name: true } }),
  ]);
  if (!isLiveModel(model)) throw new VoiceModelError(model);

  const tools = toolsForPermissions(args.permissions);
  const backendInstructions =
    buildAssistantInstructions({
      now,
      audience: {
        permissions: args.permissions,
        canQueryDatabase: canQueryDatabase(args.permissions),
      },
      pageContext: args.pageContext ?? null,
      storeNames: stores.map((s) => s.name),
    }) +
    "\n\nYou are answering for a spoken conversation: a voice model reads your text aloud. Keep each answer to a few sentences and at most five figures, with no tables, lists or markdown.";
  const request = buildLiveSessionRequest({
    model,
    voice,
    backendModel,
    voiceInstructions: buildVoiceInstructions({ pageTitle: args.pageContext?.title ?? null }),
    backendInstructions,
    tools,
    sdp: args.sdp,
  });

  const doFetch = args.fetchImpl ?? fetch;
  const res = await doFetch(LIVE_SESSIONS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`OpenAI did not open a live session (${res.status}). ${text}`.trim());
  }
  const json = (await res.json()) as { session?: { id?: string }; transport?: { sdp?: string } };
  const sessionId = json.session?.id;
  const answer = json.transport?.sdp;
  if (!sessionId || !answer) throw new Error("OpenAI's answer carried no session id or SDP.");

  const maxSeconds = Math.round(limits.voiceSessionMaxMinutes * 60);
  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId: args.userId,
      modelProvider: "openai",
      modelName: model,
      module: VOICE_FEATURE,
      prompt: "Live voice session",
      output: "",
      sourceReferences: {
        liveSessionId: sessionId,
        backendModel,
        voice,
        pageContext: args.pageContext ?? null,
        startedAt: now.toISOString(),
        maxSeconds,
        state: "open",
      } as Prisma.InputJsonObject,
      status: "generated",
      assumptions: [],
      warnings: [],
      confidence: null,
    },
  });
  // The session's ledger row begins with the initialisation seconds OpenAI
  // bills, and is overwritten as the browser reports the running total.
  await recordAiUsage({
    userId: args.userId,
    feature: VOICE_FEATURE,
    kind: "realtime",
    modelName: model,
    usage: { audioSeconds: LIVE_INITIALISATION_SECONDS },
    metadata: { liveSessionId: sessionId, aiOutputId: aiOutput.id, session: true },
  });
  await writeAudit({
    actorUserId: args.userId,
    action: "ai.assistant_voice_started",
    entityType: "AiOutput",
    entityId: aiOutput.id,
    afterData: {
      liveSessionId: sessionId,
      model,
      voice,
      backendModel,
      maxSeconds,
      tools: tools.length,
      pageRoute: args.pageContext?.route ?? null,
    },
  });

  return {
    sdp: answer,
    sessionId,
    aiOutputId: aiOutput.id,
    model,
    voice,
    backendModel,
    maxSeconds,
    expiresAt: new Date(now.getTime() + maxSeconds * 1000).toISOString(),
  };
}

type SessionRow = {
  id: string;
  userId: string | null;
  modelName: string;
  sourceReferences: Prisma.JsonValue;
};

/** The person's own session, or an error. */
async function ownedSession(userId: string, sessionId: string): Promise<SessionRow> {
  if (!sessionId || sessionId.length > 200) throw new VoiceSessionNotFoundError();
  const row = await prisma.aiOutput.findFirst({
    where: {
      userId,
      module: VOICE_FEATURE,
      sourceReferences: { path: ["liveSessionId"], equals: sessionId },
    },
    select: { id: true, userId: true, modelName: true, sourceReferences: true },
  });
  if (!row) throw new VoiceSessionNotFoundError();
  return row;
}

const refs = (row: SessionRow): Record<string, unknown> =>
  row.sourceReferences &&
  typeof row.sourceReferences === "object" &&
  !Array.isArray(row.sourceReferences)
    ? (row.sourceReferences as Record<string, unknown>)
    : {};

/**
 * The browser's running total of session seconds. Overwrites the session's
 * ledger row (never below what it already says), so the day's voice minutes
 * count the session while it runs. Returns the reason to stop when a cap
 * has been reached meanwhile, else null.
 */
export async function recordVoiceSeconds(args: {
  userId: string;
  sessionId: string;
  seconds: number;
  now?: Date;
}): Promise<{ stop: string | null }> {
  const row = await ownedSession(args.userId, args.sessionId);
  const seconds = Math.max(0, Math.round(Number(args.seconds) || 0));
  const existing = await prisma.aiUsageEvent.findFirst({
    where: {
      feature: VOICE_FEATURE,
      kind: "realtime",
      metadata: { path: ["liveSessionId"], equals: args.sessionId },
    },
    select: { id: true, audioSeconds: true },
  });
  const total = Math.max(existing?.audioSeconds ?? 0, seconds);
  const { usd } = estimateCostUsd(row.modelName, "realtime", { audioSeconds: total });
  if (existing) {
    if (total !== existing.audioSeconds) {
      await prisma.aiUsageEvent.update({
        where: { id: existing.id },
        data: { audioSeconds: total, estimatedCostUsd: usd },
      });
    }
  } else {
    await recordAiUsage({
      userId: args.userId,
      feature: VOICE_FEATURE,
      kind: "realtime",
      modelName: row.modelName,
      usage: { audioSeconds: total },
      metadata: { liveSessionId: args.sessionId, aiOutputId: row.id, session: true },
    });
  }
  const maxSeconds = Number(refs(row).maxSeconds) || 0;
  if (maxSeconds && total >= maxSeconds) {
    return { stop: `The session reached its ${Math.round(maxSeconds / 60)}-minute limit.` };
  }
  const now = args.now ?? new Date();
  const [limits, spent] = await Promise.all([
    getAiBudgetLimits(),
    getAiBudgetSpent(args.userId, startOfBudgetDay(now)),
  ]);
  return { stop: evaluateAiBudget(limits, spent, "voice") };
}

/** One backend response's tokens, from the nested `response.completed` the browser saw. Idempotent by response id. */
export async function recordVoiceBackendUsage(args: {
  userId: string;
  sessionId: string;
  responseId: string;
  model: string | null;
  usage: UsageCounts;
}): Promise<void> {
  const row = await ownedSession(args.userId, args.sessionId);
  const responseId = String(args.responseId ?? "").slice(0, 200);
  if (!responseId) return;
  const seen = await prisma.aiUsageEvent.findFirst({
    where: { feature: VOICE_FEATURE, metadata: { path: ["responseId"], equals: responseId } },
    select: { id: true },
  });
  if (seen) return;
  const backendModel = args.model?.trim() || String(refs(row).backendModel ?? "unknown");
  await recordAiUsage({
    userId: args.userId,
    feature: VOICE_FEATURE,
    kind: "text",
    modelName: backendModel,
    usage: args.usage,
    metadata: { liveSessionId: args.sessionId, aiOutputId: row.id, responseId, backend: true },
  });
}

/** Runs one tool the backend asked for, under the person's permissions; the browser only relays. */
export async function runVoiceTool(args: {
  userId: string;
  permissions: string[];
  sessionId: string;
  name: string;
  arguments: unknown;
  now?: Date;
}): Promise<{ output: string; ok: boolean }> {
  await ownedSession(args.userId, args.sessionId);
  const parsed =
    args.arguments && typeof args.arguments === "object"
      ? (args.arguments as Record<string, unknown>)
      : {};
  const result = await runAssistantTool(args.name, parsed, {
    userId: args.userId,
    permissions: args.permissions,
    now: args.now ?? new Date(),
  });
  return result.ok
    ? { ok: true, output: serialiseToolResult(result.result) }
    : { ok: false, output: JSON.stringify({ error: result.error }) };
}

export type VoiceTranscriptLine = { role: "user" | "assistant"; text: string };

/**
 * The session's end: the final seconds, the reason OpenAI or the browser
 * gave, and the transcript, kept as the session's AiOutput. Idempotent: a
 * second call (the beacon after the button) changes nothing.
 */
export async function endVoiceSession(args: {
  userId: string;
  sessionId: string;
  seconds: number;
  reason: string;
  transcript: VoiceTranscriptLine[];
  now?: Date;
}): Promise<{ alreadyClosed: boolean }> {
  const row = await ownedSession(args.userId, args.sessionId);
  const current = refs(row);
  if (current.state === "closed") return { alreadyClosed: true };
  const now = args.now ?? new Date();
  await recordVoiceSeconds({
    userId: args.userId,
    sessionId: args.sessionId,
    seconds: args.seconds,
    now,
  });
  const ledger = await prisma.aiUsageEvent.findFirst({
    where: {
      feature: VOICE_FEATURE,
      kind: "realtime",
      metadata: { path: ["liveSessionId"], equals: args.sessionId },
    },
    select: { audioSeconds: true, estimatedCostUsd: true },
  });
  const transcript = args.transcript
    .filter((line) => line && (line.role === "user" || line.role === "assistant"))
    .map((line) => ({ role: line.role, text: String(line.text ?? "").slice(0, 4000) }))
    .slice(0, 400);
  const reason = String(args.reason ?? "unknown").slice(0, 60);
  await prisma.aiOutput.update({
    where: { id: row.id },
    data: {
      output: transcriptText(transcript),
      sourceReferences: {
        ...current,
        state: "closed",
        endedAt: now.toISOString(),
        reason,
        seconds: ledger?.audioSeconds ?? args.seconds,
        turns: transcript.length,
      } as Prisma.InputJsonObject,
      warnings:
        reason === "expired"
          ? ["The session reached its duration limit."]
          : reason === "connection_lost"
            ? ["The connection was lost before the session ended cleanly."]
            : [],
    },
  });
  await writeAudit({
    actorUserId: args.userId,
    action: "ai.assistant_voice_ended",
    entityType: "AiOutput",
    entityId: row.id,
    afterData: {
      liveSessionId: args.sessionId,
      reason,
      seconds: ledger?.audioSeconds ?? args.seconds,
      estimatedCostUsd: ledger ? Number(ledger.estimatedCostUsd) : null,
      turns: transcript.length,
    },
  });
  return { alreadyClosed: false };
}
