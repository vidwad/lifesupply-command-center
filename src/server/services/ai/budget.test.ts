import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/server/services/system-settings", () => ({ getSettings: async () => ({}) }));

import {
  AI_BUDGET_TIMEZONE,
  evaluateAiBudget,
  parseAiBudgetLimits,
  startOfBudgetDay,
} from "./budget";

describe("startOfBudgetDay — the business day in America/Toronto", () => {
  it("uses the local calendar day, not the UTC one", () => {
    // 03:30 UTC on Nov 3 is 22:30 on Nov 2 in Toronto (EST, UTC-5).
    const start = startOfBudgetDay(new Date("2026-11-03T03:30:00Z"), AI_BUDGET_TIMEZONE);
    expect(start.toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("is four hours behind UTC in summer", () => {
    const start = startOfBudgetDay(new Date("2026-07-01T12:00:00Z"), AI_BUDGET_TIMEZONE);
    expect(start.toISOString()).toBe("2026-07-01T04:00:00.000Z");
  });

  it("finds midnight on the day the clocks change", () => {
    // DST ends Nov 1, 2026 at 02:00 Toronto. Midnight that day was still EDT.
    const start = startOfBudgetDay(new Date("2026-11-01T23:00:00Z"), AI_BUDGET_TIMEZONE);
    expect(start.toISOString()).toBe("2026-11-01T04:00:00.000Z");
  });

  it("is idempotent: the start of a day's start is itself", () => {
    const start = startOfBudgetDay(new Date("2026-03-09T15:00:00Z"), AI_BUDGET_TIMEZONE);
    expect(startOfBudgetDay(start, AI_BUDGET_TIMEZONE).getTime()).toBe(start.getTime());
  });
});

describe("parseAiBudgetLimits", () => {
  it("reads every cap and treats a missing or malformed one as its default", () => {
    expect(parseAiBudgetLimits({})).toEqual({
      dailyUsd: 0,
      dailyUsdPerUser: 0,
      dailyVoiceMinutes: 60,
      dailyVoiceMinutesPerUser: 20,
      voiceSessionMaxMinutes: 15,
    });
    expect(
      parseAiBudgetLimits({
        "ai.budget.daily_usd": "25",
        "ai.budget.daily_usd_per_user": "abc",
        "ai.budget.daily_voice_minutes": "-3",
        "ai.budget.voice_session_max_minutes": "0",
      }),
    ).toMatchObject({
      dailyUsd: 25,
      dailyUsdPerUser: 0,
      dailyVoiceMinutes: 60,
      voiceSessionMaxMinutes: 1,
    });
  });
});

describe("evaluateAiBudget", () => {
  const limits = {
    dailyUsd: 10,
    dailyUsdPerUser: 4,
    dailyVoiceMinutes: 60,
    dailyVoiceMinutesPerUser: 20,
    voiceSessionMaxMinutes: 15,
  };

  it("allows a call while every cap has room", () => {
    expect(
      evaluateAiBudget(
        limits,
        { usd: 9.99, userUsd: 3.99, voiceMinutes: 59, userVoiceMinutes: 19 },
        "voice",
      ),
    ).toBeNull();
  });

  it("blocks everything once the organisation cap is reached", () => {
    const reason = evaluateAiBudget(
      limits,
      { usd: 10, userUsd: 0, voiceMinutes: 0, userVoiceMinutes: 0 },
      "spend",
    );
    expect(reason).toContain("$10.00");
    expect(reason).toContain(AI_BUDGET_TIMEZONE);
  });

  it("blocks one person at their own cap without blocking the organisation", () => {
    const spent = { usd: 5, userUsd: 4, voiceMinutes: 0, userVoiceMinutes: 0 };
    expect(evaluateAiBudget(limits, spent, "spend")).toContain("Your AI budget");
    expect(evaluateAiBudget(limits, { ...spent, userUsd: 1 }, "spend")).toBeNull();
  });

  it("skips the per-user caps for an unattended call with no user", () => {
    expect(
      evaluateAiBudget(
        limits,
        { usd: 5, userUsd: null, voiceMinutes: 0, userVoiceMinutes: null },
        "spend",
      ),
    ).toBeNull();
  });

  it("applies the minute caps to voice only", () => {
    const spent = { usd: 0, userUsd: 0, voiceMinutes: 60, userVoiceMinutes: 0 };
    expect(evaluateAiBudget(limits, spent, "spend")).toBeNull();
    expect(evaluateAiBudget(limits, spent, "voice")).toContain("60 minutes");
    const own = { usd: 0, userUsd: 0, voiceMinutes: 30, userVoiceMinutes: 20 };
    expect(evaluateAiBudget(limits, own, "voice")).toContain("20 minutes");
  });

  it("treats a cap of zero as no cap", () => {
    const none = {
      ...limits,
      dailyUsd: 0,
      dailyUsdPerUser: 0,
      dailyVoiceMinutes: 0,
      dailyVoiceMinutesPerUser: 0,
    };
    expect(
      evaluateAiBudget(
        none,
        { usd: 1e6, userUsd: 1e6, voiceMinutes: 1e6, userVoiceMinutes: 1e6 },
        "voice",
      ),
    ).toBeNull();
  });
});
