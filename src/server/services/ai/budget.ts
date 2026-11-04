/**
 * Daily AI budgets (2026-11-03).
 *
 * The owner sets caps in Admin → AI Settings; this module enforces them and
 * keeps the ledger they are enforced against:
 *
 * - `assertAiBudget` runs before every metered OpenAI call (the client
 *   wrapper calls it) and before a live-dialog session is minted. It throws
 *   `AiBudgetExceededError` when today's estimated spend, or today's voice
 *   minutes, has reached a cap. A cap of 0 means "no cap".
 * - `recordAiUsage` writes one `AiUsageEvent` after a call. It never throws:
 *   losing a ledger row is better than failing the work it was measuring,
 *   and the gap is logged.
 * - `getAiBudgetStatus` is what the settings page and the assistant drawer
 *   show: limits, today's figures, and whether each kind is blocked.
 *
 * "Today" is the calendar day in `AI_BUDGET_TIMEZONE`, the business's own,
 * so the cap resets at local midnight rather than at 7 pm the evening
 * before. Cost figures are estimates from list prices (see pricing.ts).
 */
import type { AiUsageKind, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { captureException } from "@/server/logger/error-tracking";
import { getSettings } from "@/server/services/system-settings";

import { AiBudgetExceededError } from "./errors";
import { estimateCostUsd, type UsageCounts } from "./pricing";

export const AI_BUDGET_TIMEZONE = "America/Toronto";

export type AiBudgetLimits = {
  /** Organisation-wide estimated spend per day, USD. 0 = no cap. */
  dailyUsd: number;
  /** Per-user estimated spend per day, USD. 0 = no cap. */
  dailyUsdPerUser: number;
  /** Live-dialog minutes per day across everyone. 0 = no cap. */
  dailyVoiceMinutes: number;
  /** Live-dialog minutes per day per user. 0 = no cap. */
  dailyVoiceMinutesPerUser: number;
  /** Longest single live-dialog session, minutes. Always enforced. */
  voiceSessionMaxMinutes: number;
};

export type AiBudgetSpent = {
  usd: number;
  userUsd: number | null;
  voiceMinutes: number;
  userVoiceMinutes: number | null;
};

export type AiBudgetKind = "spend" | "voice";

export type AiBudgetStatus = {
  limits: AiBudgetLimits;
  spent: AiBudgetSpent;
  timezone: string;
  dayStart: Date;
  /** Why spend-kind calls are blocked right now, or null. */
  spendBlocked: string | null;
  /** Why a new live-dialog session is blocked right now, or null. */
  voiceBlocked: string | null;
  /** Today's estimated spend by feature, largest first. */
  byFeature: { feature: string; usd: number; calls: number }[];
};

// ---------------------------------------------------------------------------
// Day boundary
// ---------------------------------------------------------------------------

function zoneParts(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Milliseconds the zone is ahead of UTC at the given instant. */
function zoneOffsetMs(date: Date, zone: string): number {
  const p = zoneParts(date, zone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Local midnight of `now`'s calendar day in the zone, as an instant. Two
 * passes over the offset so a day that starts in a different DST state than
 * `now` still resolves to its own midnight.
 */
export function startOfBudgetDay(now: Date, zone: string = AI_BUDGET_TIMEZONE): Date {
  const p = zoneParts(now, zone);
  const wallMidnight = Date.UTC(p.year, p.month - 1, p.day);
  let instant = wallMidnight - zoneOffsetMs(new Date(wallMidnight), zone);
  instant = wallMidnight - zoneOffsetMs(new Date(instant), zone);
  return new Date(instant);
}

// ---------------------------------------------------------------------------
// Limits and evaluation (pure once the settings are read)
// ---------------------------------------------------------------------------

const nonNegative = (raw: string | undefined, fallback: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function parseAiBudgetLimits(values: Record<string, string>): AiBudgetLimits {
  return {
    dailyUsd: nonNegative(values["ai.budget.daily_usd"], 0),
    dailyUsdPerUser: nonNegative(values["ai.budget.daily_usd_per_user"], 0),
    dailyVoiceMinutes: nonNegative(values["ai.budget.daily_voice_minutes"], 60),
    dailyVoiceMinutesPerUser: nonNegative(values["ai.budget.daily_voice_minutes_per_user"], 20),
    voiceSessionMaxMinutes: Math.max(
      1,
      nonNegative(values["ai.budget.voice_session_max_minutes"], 15),
    ),
  };
}

export async function getAiBudgetLimits(): Promise<AiBudgetLimits> {
  const values = await getSettings([
    "ai.budget.daily_usd",
    "ai.budget.daily_usd_per_user",
    "ai.budget.daily_voice_minutes",
    "ai.budget.daily_voice_minutes_per_user",
    "ai.budget.voice_session_max_minutes",
  ]);
  return parseAiBudgetLimits(values);
}

const usd = (n: number) => `$${n.toFixed(2)}`;

/**
 * Pure: the reason a call of this kind is blocked, or null. Spend caps apply
 * to everything; the minute caps only to live dialog. A user figure of null
 * (no user, as for an unattended run) skips the per-user caps.
 */
export function evaluateAiBudget(
  limits: AiBudgetLimits,
  spent: AiBudgetSpent,
  kind: AiBudgetKind,
): string | null {
  if (limits.dailyUsd > 0 && spent.usd >= limits.dailyUsd) {
    return `Today's AI budget of ${usd(limits.dailyUsd)} has been used (${usd(spent.usd)} estimated). It resets at midnight ${AI_BUDGET_TIMEZONE}.`;
  }
  if (
    limits.dailyUsdPerUser > 0 &&
    spent.userUsd != null &&
    spent.userUsd >= limits.dailyUsdPerUser
  ) {
    return `Your AI budget for today, ${usd(limits.dailyUsdPerUser)}, has been used (${usd(spent.userUsd)} estimated). It resets at midnight ${AI_BUDGET_TIMEZONE}.`;
  }
  if (kind === "voice") {
    if (limits.dailyVoiceMinutes > 0 && spent.voiceMinutes >= limits.dailyVoiceMinutes) {
      return `Today's live-dialog allowance of ${limits.dailyVoiceMinutes} minutes has been used. It resets at midnight ${AI_BUDGET_TIMEZONE}.`;
    }
    if (
      limits.dailyVoiceMinutesPerUser > 0 &&
      spent.userVoiceMinutes != null &&
      spent.userVoiceMinutes >= limits.dailyVoiceMinutesPerUser
    ) {
      return `Your live-dialog allowance for today, ${limits.dailyVoiceMinutesPerUser} minutes, has been used. It resets at midnight ${AI_BUDGET_TIMEZONE}.`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Ledger reads
// ---------------------------------------------------------------------------

const toNumber = (v: Prisma.Decimal | number | null | undefined): number =>
  v == null ? 0 : typeof v === "number" ? v : Number(v);

export async function getAiBudgetSpent(
  userId: string | null | undefined,
  dayStart: Date,
): Promise<AiBudgetSpent> {
  const since = { createdAt: { gte: dayStart } };
  const [all, voice, user, userVoice] = await Promise.all([
    prisma.aiUsageEvent.aggregate({ _sum: { estimatedCostUsd: true }, where: since }),
    prisma.aiUsageEvent.aggregate({
      _sum: { audioSeconds: true },
      where: { ...since, kind: "realtime" },
    }),
    userId
      ? prisma.aiUsageEvent.aggregate({
          _sum: { estimatedCostUsd: true },
          where: { ...since, userId },
        })
      : null,
    userId
      ? prisma.aiUsageEvent.aggregate({
          _sum: { audioSeconds: true },
          where: { ...since, userId, kind: "realtime" },
        })
      : null,
  ]);
  return {
    usd: toNumber(all._sum.estimatedCostUsd),
    voiceMinutes: (voice._sum.audioSeconds ?? 0) / 60,
    userUsd: user ? toNumber(user._sum.estimatedCostUsd) : null,
    userVoiceMinutes: userVoice ? (userVoice._sum.audioSeconds ?? 0) / 60 : null,
  };
}

export async function getAiBudgetStatus(
  userId?: string | null,
  now: Date = new Date(),
): Promise<AiBudgetStatus> {
  const dayStart = startOfBudgetDay(now);
  const [limits, spent, grouped] = await Promise.all([
    getAiBudgetLimits(),
    getAiBudgetSpent(userId, dayStart),
    prisma.aiUsageEvent.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: dayStart } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
  ]);
  const byFeature = grouped
    .map((g) => ({
      feature: g.feature,
      usd: toNumber(g._sum.estimatedCostUsd),
      calls: g._count._all,
    }))
    .sort((a, b) => b.usd - a.usd);
  return {
    limits,
    spent,
    timezone: AI_BUDGET_TIMEZONE,
    dayStart,
    spendBlocked: evaluateAiBudget(limits, spent, "spend"),
    voiceBlocked: evaluateAiBudget(limits, spent, "voice"),
    byFeature,
  };
}

/**
 * Throws `AiBudgetExceededError` when a call of this kind may not start.
 * Called by the OpenAI client wrapper before every metered call, so a cap
 * holds for every feature without each one remembering to check.
 */
export async function assertAiBudget(args: {
  userId?: string | null;
  kind: AiBudgetKind;
  now?: Date;
}): Promise<void> {
  const dayStart = startOfBudgetDay(args.now ?? new Date());
  const [limits, spent] = await Promise.all([
    getAiBudgetLimits(),
    getAiBudgetSpent(args.userId, dayStart),
  ]);
  const reason = evaluateAiBudget(limits, spent, args.kind);
  if (reason) throw new AiBudgetExceededError(reason);
}

// ---------------------------------------------------------------------------
// Ledger writes
// ---------------------------------------------------------------------------

export type RecordAiUsageInput = {
  userId?: string | null;
  feature: string;
  kind: AiUsageKind;
  modelName: string;
  usage: UsageCounts;
  metadata?: Record<string, unknown>;
};

const int = (v: number | null | undefined): number | null =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;

/** Writes one ledger row. Never throws; a failure is logged and the call it measured stands. */
export async function recordAiUsage(input: RecordAiUsageInput): Promise<void> {
  try {
    const { usd, known } = estimateCostUsd(input.modelName, input.kind, input.usage);
    await prisma.aiUsageEvent.create({
      data: {
        userId: input.userId ?? null,
        feature: input.feature,
        kind: input.kind,
        modelName: input.modelName,
        inputTokens: int(input.usage.inputTokens),
        cachedInputTokens: int(input.usage.cachedInputTokens),
        outputTokens: int(input.usage.outputTokens),
        audioInputTokens: int(input.usage.audioInputTokens),
        audioOutputTokens: int(input.usage.audioOutputTokens),
        imageInputTokens: int(input.usage.imageInputTokens),
        imageOutputTokens: int(input.usage.imageOutputTokens),
        audioSeconds: int(input.usage.audioSeconds),
        estimatedCostUsd: usd,
        metadata: {
          ...(input.metadata ?? {}),
          ...(known ? {} : { unknownModelRate: true }),
        } as Prisma.InputJsonObject,
      },
    });
  } catch (err) {
    captureException(err, { feature: input.feature, model: input.modelName, scope: "ai-usage" });
  }
}
