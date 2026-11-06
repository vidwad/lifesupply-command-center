import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Live voice sessions (docs/43 Stage 3, 2026-11-06), with OpenAI, the
 * database and the settings stood in for. Pinned: the session request
 * carries the voice model, the backend model with the person's tools, and
 * the browser's offer; a non-Live model is refused before OpenAI is called;
 * the flag and the voice budget are checked first; usage reports overwrite
 * the session's ledger row; the end keeps the transcript once.
 */
const outputs: Record<string, unknown>[] = [];
const usageRows: Record<string, unknown>[] = [];
const audits: Record<string, unknown>[] = [];
let flagOn = true;
let budgetReason: string | null = null;
let settings: Record<string, string> = {};

vi.mock("@/server/db/client", () => ({
  prisma: {
    store: { findMany: async () => [{ name: "LifeSupply.ca" }] },
    aiOutput: {
      create: async (args: { data: Record<string, unknown> }) => {
        const row = { id: `out_${outputs.length + 1}`, ...args.data };
        outputs.push(row);
        return row;
      },
      findFirst: async (args: {
        where: { userId: string; sourceReferences: { equals: string } };
      }) => {
        const row = outputs.find(
          (o) =>
            o.userId === args.where.userId &&
            (o.sourceReferences as { liveSessionId: string }).liveSessionId ===
              args.where.sourceReferences.equals,
        );
        return row
          ? {
              id: row.id,
              userId: row.userId,
              modelName: row.modelName,
              sourceReferences: row.sourceReferences,
            }
          : null;
      },
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = outputs.find((o) => o.id === args.where.id)!;
        Object.assign(row, args.data);
        return row;
      },
    },
    aiUsageEvent: {
      findFirst: async (args: {
        where: { metadata: { path: string[]; equals: string }; kind?: string };
      }) => {
        const [key] = args.where.metadata.path;
        const row = usageRows.find(
          (u) =>
            (u.metadata as Record<string, unknown>)[key!] === args.where.metadata.equals &&
            (!args.where.kind || u.kind === args.where.kind),
        );
        return row ?? null;
      },
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = usageRows.find((u) => u.id === args.where.id)!;
        Object.assign(row, args.data);
        return row;
      },
    },
  },
}));
vi.mock("@/server/audit", () => ({
  writeAudit: async (entry: Record<string, unknown>) => {
    audits.push(entry);
  },
}));
vi.mock("@/server/services/feature-flags", () => ({
  requireFeature: async () => {
    if (!flagOn) throw new Error('Feature "ai.live_voice" is disabled.');
  },
}));
vi.mock("@/server/services/integrations", () => ({
  resolveCredential: async () => "sk-test",
}));
vi.mock("@/server/services/system-settings", () => ({
  getSetting: async (key: string) => settings[key] ?? "",
  getSettings: async (keys: string[]) =>
    Object.fromEntries(keys.map((k) => [k, settings[k] ?? ""])),
}));
vi.mock("../budget", async () => {
  const actual = (await vi.importActual("../budget")) as Record<string, unknown>;
  return {
    ...actual,
    assertAiBudget: async () => {
      if (budgetReason) throw new Error(budgetReason);
    },
    getAiBudgetSpent: async () => ({ usd: 0, userUsd: 0, voiceMinutes: 0, userVoiceMinutes: 0 }),
    recordAiUsage: async (input: Record<string, unknown>) => {
      usageRows.push({
        id: `use_${usageRows.length + 1}`,
        audioSeconds: (input.usage as { audioSeconds?: number }).audioSeconds ?? 0,
        ...input,
      });
    },
  };
});
vi.mock("./tools", () => ({
  canQueryDatabase: () => false,
  toolsForPermissions: () => [
    {
      name: "sales_overview",
      description: "Revenue for a range.",
      permissions: ["ai.use"],
      parameters: { type: "object", properties: {} },
      run: async () => ({}),
    },
  ],
  runAssistantTool: async (name: string) =>
    name === "sales_overview" ? { ok: true, result: { revenue: 10 } } : { ok: false, error: "no" },
}));

import {
  buildVoiceInstructions,
  createVoiceSession,
  endVoiceSession,
  isLiveModel,
  recordVoiceSeconds,
  runVoiceTool,
  transcriptText,
  VoiceModelError,
} from "./voice";

const okFetch = (session = "live_abc") =>
  vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    void init;
    return new Response(
      JSON.stringify({
        session: { id: session },
        transport: { type: "webrtc", sdp: "v=0 answer" },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  });

beforeEach(() => {
  outputs.length = 0;
  usageRows.length = 0;
  audits.length = 0;
  flagOn = true;
  budgetReason = null;
  settings = {
    "ai.openai_realtime_model": "gpt-live-1",
    "ai.budget.voice_session_max_minutes": "15",
  };
});

describe("the voice session", () => {
  it("opens a GPT-Live session with the voice model, the backend model and the person's tools, and records the start", async () => {
    const fetchImpl = okFetch();
    const started = await createVoiceSession({
      userId: "u1",
      permissions: ["ai.use"],
      sdp: "v=0 offer",
      pageContext: { route: "/orders", title: "Orders" },
      now: new Date("2026-11-06T12:00:00Z"),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(started).toMatchObject({
      sdp: "v=0 answer",
      sessionId: "live_abc",
      aiOutputId: "out_1",
      model: "gpt-live-1",
      voice: "marin",
      backendModel: "gpt-5-mini",
      maxSeconds: 900,
    });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/live/sessions");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(init!.body as string);
    expect(body.transport).toEqual({ type: "webrtc", sdp: "v=0 offer" });
    expect(body.session.model).toBe("gpt-live-1");
    expect(body.session.audio).toEqual({ output: { voice: "marin" } });
    expect(body.session.instructions).toContain("Generate <|SpawnThinking|> when:");
    expect(body.session.instructions).toContain("looking at Orders");
    expect(body.session.delegation.type).toBe("responses");
    expect(body.session.delegation.responses.model).toBe("gpt-5-mini");
    expect(body.session.delegation.responses.instructions).toContain("spoken conversation");
    expect(
      body.session.delegation.responses.tools.map(
        (t: { type: string; name?: string }) => t.name ?? t.type,
      ),
    ).toEqual(["web_search", "sales_overview"]);
    expect(outputs[0]).toMatchObject({
      module: "assistant.voice",
      userId: "u1",
      modelName: "gpt-live-1",
    });
    expect(usageRows[0]).toMatchObject({
      feature: "assistant.voice",
      kind: "realtime",
      audioSeconds: 15,
    });
    expect(audits[0]).toMatchObject({ action: "ai.assistant_voice_started", entityId: "out_1" });
  });

  it("refuses a model that is not GPT-Live before calling OpenAI", async () => {
    settings["ai.openai_realtime_model"] = "gpt-realtime";
    const fetchImpl = okFetch();
    await expect(
      createVoiceSession({
        userId: "u1",
        permissions: ["ai.use"],
        sdp: "v=0",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(VoiceModelError);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(isLiveModel("gpt-live-1")).toBe(true);
    expect(isLiveModel("gpt-realtime-mini")).toBe(false);
  });

  it("stops at the flag and at the voice budget", async () => {
    flagOn = false;
    await expect(
      createVoiceSession({ userId: "u1", permissions: ["ai.use"], sdp: "v=0" }),
    ).rejects.toThrow("disabled");
    flagOn = true;
    budgetReason = "Today's live-dialog allowance has been used.";
    await expect(
      createVoiceSession({ userId: "u1", permissions: ["ai.use"], sdp: "v=0" }),
    ).rejects.toThrow("allowance");
    expect(outputs).toHaveLength(0);
  });

  it("overwrites the session's ledger seconds as the browser reports, never downwards, and relays tools under the person's permissions", async () => {
    await createVoiceSession({
      userId: "u1",
      permissions: ["ai.use"],
      sdp: "v=0",
      fetchImpl: okFetch() as unknown as typeof fetch,
    });
    await recordVoiceSeconds({ userId: "u1", sessionId: "live_abc", seconds: 40 });
    expect(usageRows).toHaveLength(1);
    expect(usageRows[0]!.audioSeconds).toBe(40);
    await recordVoiceSeconds({ userId: "u1", sessionId: "live_abc", seconds: 30 });
    expect(usageRows[0]!.audioSeconds).toBe(40);
    const { stop } = await recordVoiceSeconds({
      userId: "u1",
      sessionId: "live_abc",
      seconds: 900,
    });
    expect(stop).toContain("15-minute limit");

    const tool = await runVoiceTool({
      userId: "u1",
      permissions: ["ai.use"],
      sessionId: "live_abc",
      name: "sales_overview",
      arguments: {},
    });
    expect(tool.ok).toBe(true);
    expect(JSON.parse(tool.output)).toEqual({ revenue: 10 });
    await expect(
      runVoiceTool({
        userId: "u2",
        permissions: ["ai.use"],
        sessionId: "live_abc",
        name: "sales_overview",
        arguments: {},
      }),
    ).rejects.toThrow("not yours");
  });

  it("keeps the transcript once at the end and audits it", async () => {
    await createVoiceSession({
      userId: "u1",
      permissions: ["ai.use"],
      sdp: "v=0",
      fetchImpl: okFetch() as unknown as typeof fetch,
    });
    const first = await endVoiceSession({
      userId: "u1",
      sessionId: "live_abc",
      seconds: 61,
      reason: "close_requested",
      transcript: [
        { role: "user", text: "How are sales?" },
        { role: "assistant", text: "Up four percent." },
      ],
    });
    expect(first.alreadyClosed).toBe(false);
    expect(outputs[0]!.output).toBe("User: How are sales?\nAssistant: Up four percent.");
    expect((outputs[0]!.sourceReferences as Record<string, unknown>).state).toBe("closed");
    expect(usageRows[0]!.audioSeconds).toBe(61);
    expect(audits.at(-1)).toMatchObject({ action: "ai.assistant_voice_ended" });
    const again = await endVoiceSession({
      userId: "u1",
      sessionId: "live_abc",
      seconds: 61,
      reason: "close_requested",
      transcript: [],
    });
    expect(again.alreadyClosed).toBe(true);
    expect(audits.filter((a) => a.action === "ai.assistant_voice_ended")).toHaveLength(1);
  });
});

describe("the pure parts", () => {
  it("writes the voice instructions in OpenAI's template and the transcript as lines", () => {
    const text = buildVoiceInstructions({ pageTitle: null });
    expect(text).toContain("Backchannel policy:");
    expect(text).toContain("Interruption policy:");
    expect(text).toContain("Delegation policy:");
    expect(text).toContain("Do not generate <|SpawnThinking|> when:");
    expect(text).not.toContain("looking at");
    expect(
      transcriptText([
        { role: "assistant", text: " Hi " },
        { role: "user", text: "Hello" },
      ]),
    ).toBe("Assistant: Hi\nUser: Hello");
  });
});
