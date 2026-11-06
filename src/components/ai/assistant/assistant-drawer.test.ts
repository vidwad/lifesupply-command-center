/**
 * The assistant drawer (docs/43 Stage 2, 2026-11-06): the pure folding of
 * streamed events, the budget strip's wording, and canaries holding the
 * drawer's shape in the shell.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { AssistantBudgetSummary } from "@/server/services/ai/assistant/types";

import { budgetStripText } from "./budget-strip";
import { applyProgress, type PendingTurn } from "./use-assistant-chat";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

const fresh = (): PendingTurn => ({ question: "q", tools: [], text: "" });

describe("applyProgress", () => {
  it("appends text deltas", () => {
    const p = applyProgress(applyProgress(fresh(), { type: "delta", text: "Hel" }), {
      type: "delta",
      text: "lo",
    });
    expect(p.text).toBe("Hello");
  });

  it("a new tool round drops the text so far and records the tool, then its outcome", () => {
    let p = applyProgress(fresh(), { type: "delta", text: "Let me look" });
    p = applyProgress(p, { type: "tool", name: "sales_overview", status: "running" });
    expect(p.text).toBe("");
    expect(p.tools).toEqual([{ name: "sales_overview", status: "running" }]);
    p = applyProgress(p, { type: "tool", name: "sales_overview", status: "done" });
    expect(p.tools).toEqual([{ name: "sales_overview", status: "done", reason: undefined }]);
  });

  it("a skipped tool keeps its reason, and an outcome without a start is still listed", () => {
    const p = applyProgress(fresh(), {
      type: "tool",
      name: "database_query",
      status: "skipped",
      reason: "not permitted",
    });
    expect(p.tools).toEqual([
      { name: "database_query", status: "skipped", reason: "not permitted" },
    ]);
  });
});

describe("budgetStripText", () => {
  const base: AssistantBudgetSummary = {
    spentUsd: 1.5,
    capUsd: 25,
    userSpentUsd: 0.25,
    userCapUsd: 10,
    voiceMinutes: 3.4,
    voiceCapMinutes: 60,
    userVoiceMinutes: 1,
    userVoiceCapMinutes: 20,
    sessionMaxMinutes: 15,
    spendBlocked: null,
    voiceBlocked: null,
    liveVoiceEnabled: true,
    timezone: "America/Toronto",
  };

  it("names today's spend, the person's own, and the voice minutes against their caps", () => {
    expect(budgetStripText(base)).toBe(
      "Today $1.50 of $25.00 · you $0.25 of $10.00 · voice 3 min of 60 min",
    );
  });

  it("says no cap where none is set, and voice off when the flag is off", () => {
    expect(
      budgetStripText({ ...base, capUsd: null, userCapUsd: null, liveVoiceEnabled: false }),
    ).toBe("Today $1.50, no cap · voice off");
  });

  it("waits for the figures", () => {
    expect(budgetStripText(null)).toBe("Reading today's allowances…");
  });
});

describe("the drawer in the shell", () => {
  const drawer = read("src/components/ai/assistant/AssistantDrawer.tsx");
  const dockShell = read("src/components/shell/DockShell.tsx");
  const dock = read("src/components/shell/MobileDock.tsx");
  const shell = read("src/components/shell/AppShell.tsx");

  it("is mounted once in the shell for people who may use AI, with the page context provider around the page", () => {
    expect(dockShell).toContain("<AssistantPageContextProvider>");
    expect(dockShell).toContain("{assistant && (");
    expect(dockShell).toContain("<AssistantDrawer");
    expect(shell).toContain(
      "assistant={canUseAi ? { suggestions: DOCK_ASSISTANT_SUGGESTIONS } : null}",
    );
    expect(shell).not.toContain("AnalystChat");
  });

  it("the phone dock's AI key opens the same drawer, and the old panel is gone", () => {
    expect(dock).toContain("onClick={onAssistant}");
    expect(dock).toContain("aria-pressed={assistantOpen}");
    expect(dock).not.toContain("phone-dock-panel");
    expect(read("src/styles/globals.css")).not.toContain("phone-dock-panel");
  });

  it("streams through the chat route, is a full sheet on a phone and a bottom panel on a desktop, and closes on back", () => {
    expect(read("src/components/ai/assistant/use-assistant-chat.ts")).toContain(
      'CHAT_ROUTE = "/api/ai/assistant/chat"',
    );
    expect(drawer).toContain("useCurrentAssistantPageContext()");
    expect(drawer).toContain('role="dialog"');
    expect(drawer).toContain("fixed inset-0 z-40");
    expect(drawer).toContain("md:hidden");
    expect(drawer).toContain("hidden shrink-0 flex-col border-t bg-background md:flex");
    expect(drawer).toContain('expanded ? "h-[45dvh]" : "h-11"');
    expect(drawer).toContain('window.history.pushState({ assistant: true }, "")');
    expect(drawer).toContain('window.addEventListener("popstate", onPop)');
    // Enter sends; Shift+Enter is a new line.
    expect(drawer).toContain('event.key === "Enter" && !event.shiftKey');
  });

  it("opens live voice only when the flag and the budgets allow, ends it from the composer, and dictates by holding", () => {
    expect(drawer).toContain('const canStartVoice = !voiceReason && voice.status === "idle";');
    expect(drawer).toContain("disabled={!canStartVoice}");
    expect(drawer).toContain('title={voiceReason ?? "Start a live conversation"}');
    expect(drawer).toContain('aria-label="End the live conversation"');
    expect(drawer).toContain('aria-label="Hold to dictate"');
    expect(drawer).toContain("onPointerUp={dictation.stop}");
    const voiceHook = read("src/components/ai/assistant/use-voice-session.ts");
    expect(voiceHook).toContain('VOICE_SESSION_ROUTE = "/api/ai/assistant/voice/session"');
    expect(voiceHook).toContain('pc.createDataChannel("oai-events")');
    expect(voiceHook).toContain('type: "session.close"');
    expect(voiceHook).toContain("navigator.sendBeacon(VOICE_END_ROUTE");
    // The browser never runs a tool: it relays the call and returns the result.
    expect(voiceHook).toContain("fetch(VOICE_TOOL_ROUTE");
    expect(voiceHook).toContain("toolResultEvents(effect.callId, output)");
  });
});
