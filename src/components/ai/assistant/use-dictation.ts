"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const DICTATE_ROUTE = "/api/ai/assistant/dictate";
/** A dictation longer than this is cut and sent; a question is shorter. */
export const MAX_DICTATION_MS = 60_000;

export type DictationStatus = "idle" | "recording" | "transcribing";

/**
 * Hold-to-talk dictation for text mode (docs/43 Stage 3, 2026-11-06). The
 * button's press starts a recording, its release sends the clip to the
 * dictation route, and the text comes back for the composer. Cheaper than
 * a live session for a one-off question, and it works while live voice is
 * switched off.
 */
export function useDictation(args: { onText: (text: string) => void }) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onText = useRef(args.onText);
  useEffect(() => {
    onText.current = args.onText;
  });

  const supported =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    recorder.stop();
  }, []);

  const start = useCallback(async () => {
    if (status !== "idle") return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        recorderRef.current = null;
        if (blob.size < 1_000) {
          setStatus("idle");
          return;
        }
        setStatus("transcribing");
        try {
          const form = new FormData();
          form.append("audio", blob, type.includes("mp4") ? "dictation.m4a" : "dictation.webm");
          const res = await fetch(DICTATE_ROUTE, { method: "POST", body: form });
          const json = (await res.json().catch(() => null)) as {
            text?: string;
            error?: string;
          } | null;
          if (!res.ok) throw new Error(json?.error ?? `Dictation failed (${res.status}).`);
          if (json?.text?.trim()) onText.current(json.text.trim());
        } catch (err) {
          setError(err instanceof Error ? err.message : "Dictation failed.");
        } finally {
          setStatus("idle");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
      timerRef.current = setTimeout(stop, MAX_DICTATION_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The microphone could not be used.");
      setStatus("idle");
    }
  }, [status, stop]);

  return { supported, status, error, start, stop };
}
