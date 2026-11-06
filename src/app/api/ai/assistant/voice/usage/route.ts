/**
 * The live session's running usage (docs/43 Stage 3): the cumulative
 * seconds OpenAI reports on the data channel, and each backend response's
 * tokens. Seconds overwrite the session's ledger row, so the day's voice
 * minutes count a session while it runs; the answer says when a cap has
 * been reached and the browser must end the session.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { normaliseOpenAiUsage } from "@/server/integrations/openai/metering";
import { requirePermission } from "@/server/permissions";
import {
  recordVoiceBackendUsage,
  recordVoiceSeconds,
  VoiceSessionNotFoundError,
} from "@/server/services/ai/assistant/voice";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) return Response.json({ error: "sessionId is required." }, { status: 400 });
  try {
    let stop: string | null = null;
    if (typeof body.seconds === "number") {
      stop = (await recordVoiceSeconds({ userId: user.id, sessionId, seconds: body.seconds })).stop;
    }
    const backend = body.backend as Record<string, unknown> | undefined;
    if (backend && typeof backend === "object") {
      const usage = normaliseOpenAiUsage(
        backend.usage as Record<string, unknown> | null | undefined,
        "text",
      );
      if (usage) {
        await recordVoiceBackendUsage({
          userId: user.id,
          sessionId,
          responseId: String(backend.responseId ?? ""),
          model: typeof backend.model === "string" ? backend.model : null,
          usage,
        });
      }
    }
    return Response.json({ ok: true, stop }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof VoiceSessionNotFoundError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error("[assistant] voice usage failed", err);
    return Response.json({ ok: false, stop: null });
  }
}
