/**
 * The live session's end (docs/43 Stage 3): final seconds, the reason, and
 * the transcript, kept as the session's AiOutput. Idempotent, and accepts
 * the beacon a closing tab sends.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import {
  endVoiceSession,
  VoiceSessionNotFoundError,
  type VoiceTranscriptLine,
} from "@/server/services/ai/assistant/voice";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) return Response.json({ error: "sessionId is required." }, { status: 400 });
  const transcript = Array.isArray(body.transcript)
    ? (body.transcript as VoiceTranscriptLine[])
    : [];
  try {
    const result = await endVoiceSession({
      userId: user.id,
      sessionId,
      seconds: typeof body.seconds === "number" ? body.seconds : 0,
      reason: typeof body.reason === "string" ? body.reason : "unknown",
      transcript,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof VoiceSessionNotFoundError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error("[assistant] voice end failed", err);
    return Response.json({ error: "The session could not be closed." }, { status: 500 });
  }
}
