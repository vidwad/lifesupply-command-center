/**
 * Dictation for text mode (docs/43 Stage 3): a short recording from the
 * composer's hold-to-talk button, transcribed by the configured speech
 * model and returned as text to fill the composer. Metered by the OpenAI
 * client wrapper under `assistant.dictation`, cheaper than a live session
 * for a one-off question.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { getOpenAiClient, resolveOpenAiTranscribeModel } from "@/server/integrations/openai/client";
import { requirePermission } from "@/server/permissions";
import { AiNotConfiguredError } from "@/server/services/ai";
import { AiBudgetExceededError } from "@/server/services/ai/errors";

export const dynamic = "force-dynamic";

/** About a minute of compressed speech. */
export const MAX_DICTATION_BYTES = 6 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Send the recording as form data." }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "A recording is required." }, { status: 400 });
  }
  if (audio.size > MAX_DICTATION_BYTES) {
    return Response.json({ error: "The recording is too long." }, { status: 413 });
  }
  try {
    const client = await getOpenAiClient({ userId: user.id, feature: "assistant.dictation" });
    if (!client) throw new AiNotConfiguredError();
    const model = await resolveOpenAiTranscribeModel();
    const name = audio instanceof File && audio.name ? audio.name : "dictation.webm";
    const file = new File([audio], name, { type: audio.type || "audio/webm" });
    const result = await client.audio.transcriptions.create({ file, model });
    return Response.json({ text: result.text ?? "" }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AiNotConfiguredError || err instanceof AiBudgetExceededError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("[assistant] dictation failed", err);
    return Response.json({ error: "The recording could not be transcribed." }, { status: 502 });
  }
}
