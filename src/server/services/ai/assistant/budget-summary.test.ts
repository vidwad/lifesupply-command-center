import { describe, expect, it } from "vitest";

import type { AiBudgetStatus } from "../budget";
import { summariseAssistantBudget } from "./budget-summary";

const status = (over: Partial<AiBudgetStatus> = {}): AiBudgetStatus => ({
  limits: {
    dailyUsd: 25,
    dailyUsdPerUser: 0,
    dailyVoiceMinutes: 60,
    dailyVoiceMinutesPerUser: 20,
    voiceSessionMaxMinutes: 15,
  },
  spent: { usd: 1.23456, userUsd: 0.5, voiceMinutes: 12.345, userVoiceMinutes: null },
  timezone: "America/Toronto",
  dayStart: new Date("2026-11-06T05:00:00Z"),
  spendBlocked: null,
  voiceBlocked: null,
  byFeature: [],
  ...over,
});

describe("summariseAssistantBudget", () => {
  it("rounds the figures to cents and turns a zero cap into no cap", () => {
    const s = summariseAssistantBudget(status(), true);
    expect(s).toMatchObject({
      spentUsd: 1.23,
      capUsd: 25,
      userSpentUsd: 0.5,
      userCapUsd: null,
      voiceMinutes: 12.35,
      voiceCapMinutes: 60,
      userVoiceMinutes: null,
      userVoiceCapMinutes: 20,
      sessionMaxMinutes: 15,
      spendBlocked: null,
      voiceBlocked: null,
      liveVoiceEnabled: true,
      timezone: "America/Toronto",
    });
  });

  it("blocks voice with the flag's reason when live voice is off, whatever the minutes say", () => {
    const s = summariseAssistantBudget(status(), false);
    expect(s.liveVoiceEnabled).toBe(false);
    expect(s.voiceBlocked).toContain("ai.live_voice");
    expect(s.spendBlocked).toBeNull();
  });

  it("passes the budget's own reasons through when the flag is on", () => {
    const s = summariseAssistantBudget(
      status({
        spendBlocked: "Today's AI budget has been used.",
        voiceBlocked: "No minutes left.",
      }),
      true,
    );
    expect(s.spendBlocked).toBe("Today's AI budget has been used.");
    expect(s.voiceBlocked).toBe("No minutes left.");
  });
});
