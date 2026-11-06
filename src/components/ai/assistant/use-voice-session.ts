"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AssistantPageContext } from "@/server/services/ai/assistant/types";

import type { TaskDraft } from "@/server/services/ai/assistant/task-draft";

import {
  foldVoiceEvent,
  INITIAL_VOICE_STATE,
  settleVoiceTool,
  toolResultEvents,
  type VoiceEffect,
  type VoiceLine,
  type VoiceState,
} from "./voice-events";

export const VOICE_SESSION_ROUTE = "/api/ai/assistant/voice/session";
export const VOICE_TOOL_ROUTE = "/api/ai/assistant/voice/tool";
export const VOICE_USAGE_ROUTE = "/api/ai/assistant/voice/usage";
export const VOICE_END_ROUTE = "/api/ai/assistant/voice/end";

/** Seconds between usage reports to the server, so the day's minutes count while the session runs. */
export const USAGE_REPORT_EVERY_SECONDS = 10;
/** How long to wait for OpenAI's `session.closed` after asking to close. */
const CLOSE_GRACE_MS = 3_000;

export type VoiceSessionSummary = {
  lines: VoiceLine[];
  seconds: number;
  reason: string;
  endedAt: string;
  drafts: TaskDraft[];
};

export type VoiceStatus = "idle" | "connecting" | "live" | "ending" | "error";

/**
 * One live voice session over WebRTC (docs/43 Stage 3, 2026-11-06). The
 * browser captures the microphone, sends its offer to the session route,
 * which opens the GPT-Live session with the key held on the server, and
 * plays the model's audio. Events on the data channel are folded by
 * `foldVoiceEvent`; the effects it returns are carried out here: a tool
 * call is relayed to the tool route and its result returned to the
 * session, usage is reported, and the session's end is recorded. The
 * session ends on the button, when the server says a cap is reached, when
 * the client-side timer reaches the session limit, when the page is left,
 * or when the tab closes (by beacon).
 */
export function useVoiceSession(args: { onEnded: (summary: VoiceSessionSummary) => void }) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [state, setState] = useState<VoiceState>(INITIAL_VOICE_STATE);
  const [error, setError] = useState<string | null>(null);
  const [maxSeconds, setMaxSeconds] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const stateRef = useRef<VoiceState>(INITIAL_VOICE_STATE);
  const endedRef = useRef(false);
  const lastReportedRef = useRef(0);
  const closedResolveRef = useRef<(() => void) | null>(null);
  const onEnded = useRef(args.onEnded);
  useEffect(() => {
    onEnded.current = args.onEnded;
  });

  const update = useCallback((next: VoiceState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const teardownMedia = useCallback(() => {
    try {
      dcRef.current?.close();
    } catch {
      // closing
    }
    try {
      pcRef.current?.close();
    } catch {
      // closing
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
  }, []);

  const endPayload = useCallback(
    (reason: string) =>
      JSON.stringify({
        sessionId: sessionIdRef.current,
        seconds: stateRef.current.seconds,
        reason,
        transcript: stateRef.current.lines,
      }),
    [],
  );

  const finish = useCallback(
    async (reason: string, options: { beacon?: boolean } = {}) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const sessionId = sessionIdRef.current;
      teardownMedia();
      if (sessionId) {
        const body = endPayload(reason);
        if (options.beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(VOICE_END_ROUTE, new Blob([body], { type: "application/json" }));
        } else {
          await fetch(VOICE_END_ROUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => undefined);
        }
      }
      const summary: VoiceSessionSummary = {
        lines: stateRef.current.lines,
        seconds: stateRef.current.seconds,
        reason,
        endedAt: new Date().toISOString(),
        drafts: stateRef.current.drafts,
      };
      setStatus("idle");
      update(INITIAL_VOICE_STATE);
      sessionIdRef.current = null;
      if (summary.lines.length || summary.seconds || summary.drafts.length)
        onEnded.current(summary);
    },
    [endPayload, teardownMedia, update],
  );

  const requestClose = useCallback(
    async (reason: string) => {
      if (endedRef.current) return;
      setStatus("ending");
      const dc = dcRef.current;
      if (dc && dc.readyState === "open") {
        try {
          dc.send(JSON.stringify({ type: "session.close" }));
        } catch {
          // The channel may already be gone.
        }
        await new Promise<void>((resolve) => {
          closedResolveRef.current = resolve;
          setTimeout(resolve, CLOSE_GRACE_MS);
        });
      }
      await finish(reason);
    },
    [finish],
  );

  const reportUsage = useCallback(
    async (seconds: number, backend?: VoiceEffect & { type: "backend_usage" }) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      try {
        const res = await fetch(VOICE_USAGE_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            ...(seconds >= 0 ? { seconds } : {}),
            ...(backend
              ? {
                  backend: {
                    responseId: backend.responseId,
                    model: backend.model,
                    usage: backend.usage,
                  },
                }
              : {}),
          }),
        });
        const json = (await res.json().catch(() => null)) as { stop?: string | null } | null;
        if (json?.stop) {
          setError(json.stop);
          void requestClose("expired");
        }
      } catch {
        // The next report carries the running total anyway.
      }
    },
    [requestClose],
  );

  const relayTool = useCallback(
    async (effect: VoiceEffect & { type: "tool_call" }) => {
      const sessionId = sessionIdRef.current;
      const dc = dcRef.current;
      if (!sessionId || !dc) return;
      let output = JSON.stringify({ error: "The tool could not be run." });
      let ok = false;
      try {
        const res = await fetch(VOICE_TOOL_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, name: effect.name, arguments: effect.arguments }),
        });
        const json = (await res.json().catch(() => null)) as {
          output?: string;
          ok?: boolean;
        } | null;
        if (json && typeof json.output === "string") {
          output = json.output;
          ok = json.ok === true;
        }
      } catch {
        // The default error output goes back so the backend can finish its turn.
      }
      update(settleVoiceTool(stateRef.current, effect.callId, ok ? "done" : "skipped"));
      if (dc.readyState === "open") {
        for (const event of toolResultEvents(effect.callId, output)) dc.send(JSON.stringify(event));
      }
    },
    [update],
  );

  const handleEvent = useCallback(
    (raw: unknown) => {
      const { state: next, effects } = foldVoiceEvent(stateRef.current, raw);
      update(next);
      if (next.status === "live" && status !== "live") setStatus("live");
      for (const effect of effects) {
        if (effect.type === "tool_call") void relayTool(effect);
        else if (effect.type === "backend_usage") void reportUsage(-1, effect);
        else if (effect.type === "usage") {
          if (effect.seconds - lastReportedRef.current >= USAGE_REPORT_EVERY_SECONDS) {
            lastReportedRef.current = effect.seconds;
            void reportUsage(effect.seconds);
          }
        } else if (effect.type === "closed") {
          closedResolveRef.current?.();
          closedResolveRef.current = null;
          void finish(effect.reason);
        }
      }
    },
    [finish, relayTool, reportUsage, status, update],
  );

  const start = useCallback(
    async (pageContext: AssistantPageContext) => {
      if (status !== "idle") return;
      setError(null);
      endedRef.current = false;
      lastReportedRef.current = 0;
      update(INITIAL_VOICE_STATE);
      setStatus("connecting");
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
          throw new Error("This browser cannot hold a live voice session.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const pc = new RTCPeerConnection();
        pcRef.current = pc;
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.setAttribute("playsinline", "");
        document.body.appendChild(audio);
        audioRef.current = audio;
        pc.ontrack = (event) => {
          audio.srcObject = event.streams[0] ?? null;
          void audio.play().catch(() => undefined);
        };
        for (const track of stream.getTracks()) pc.addTrack(track, stream);
        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;
        dc.onmessage = (message) => {
          try {
            handleEvent(JSON.parse(String(message.data)));
          } catch {
            // Not JSON.
          }
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
            void finish("connection_lost");
          }
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const res = await fetch(VOICE_SESSION_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sdp: offer.sdp, pageContext }),
        });
        const json = (await res.json().catch(() => null)) as {
          sdp?: string;
          sessionId?: string;
          maxSeconds?: number;
          error?: string;
        } | null;
        if (!res.ok || !json?.sdp || !json.sessionId) {
          throw new Error(json?.error ?? `The voice session could not start (${res.status}).`);
        }
        sessionIdRef.current = json.sessionId;
        setMaxSeconds(json.maxSeconds ?? 0);
        await pc.setRemoteDescription({ type: "answer", sdp: json.sdp });
      } catch (err) {
        teardownMedia();
        sessionIdRef.current = null;
        setError(err instanceof Error ? err.message : "The voice session could not start.");
        setStatus("error");
      }
    },
    [finish, handleEvent, status, teardownMedia, update],
  );

  // The session limit, counted here as well as on the server.
  useEffect(() => {
    if (status !== "live" || !maxSeconds) return;
    if (state.seconds >= maxSeconds) void requestClose("expired");
  }, [state.seconds, maxSeconds, status, requestClose]);

  // Leaving the page or closing the tab ends the session.
  useEffect(() => {
    const onHide = () => {
      if (sessionIdRef.current && !endedRef.current) void finish("remote_hangup", { beacon: true });
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
  }, [finish]);

  const stop = useCallback(() => void requestClose("close_requested"), [requestClose]);
  const dismissError = useCallback(() => {
    setError(null);
    if (status === "error") setStatus("idle");
  }, [status]);

  return { status, state, error, maxSeconds, start, stop, dismissError };
}
