/**
 * Runs one tool the live session's backend asked for (docs/43 Stage 3).
 * The browser relays the call from the data channel; the tool runs here
 * under the person's permissions, as in text mode, and the serialised
 * result goes back for the browser to return to the session.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { runVoiceTool, VoiceSessionNotFoundError } from "@/server/services/ai/assistant/voice";

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
  const name = typeof body.name === "string" ? body.name.slice(0, 80) : "";
  if (!sessionId || !name) {
    return Response.json({ error: "sessionId and name are required." }, { status: 400 });
  }
  try {
    const result = await runVoiceTool({
      userId: user.id,
      permissions: user.permissions,
      sessionId,
      name,
      arguments: body.arguments,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof VoiceSessionNotFoundError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error("[assistant] voice tool failed", err);
    return Response.json({ ok: false, output: JSON.stringify({ error: "The tool failed." }) });
  }
}
