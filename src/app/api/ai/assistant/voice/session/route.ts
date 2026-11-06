/**
 * Opens a live voice session (docs/43 Stage 3, 2026-11-06). The browser
 * posts its WebRTC offer and the page context; the server checks the
 * `ai.live_voice` flag and the voice budgets, opens the GPT-Live session
 * with the API key, and returns the SDP answer with the session's limits.
 * The key never reaches the browser.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { AiProviderNotConfiguredError } from "@/server/services/ai/errors";
import { AiBudgetExceededError } from "@/server/services/ai/errors";
import { createVoiceSession, VoiceModelError } from "@/server/services/ai/assistant/voice";
import { FeatureDisabledError } from "@/server/services/feature-flags";

import { sanitisePageContext } from "../../chat/route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const sdp = typeof body.sdp === "string" ? body.sdp : "";
  if (!sdp || sdp.length > 100_000) {
    return Response.json({ error: "A WebRTC offer is required." }, { status: 400 });
  }
  try {
    const started = await createVoiceSession({
      userId: user.id,
      permissions: user.permissions,
      sdp,
      pageContext: sanitisePageContext(body.pageContext),
    });
    return Response.json(started, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof FeatureDisabledError) {
      return Response.json(
        {
          error:
            "Live voice is switched off. An administrator turns on the ai.live_voice feature flag.",
        },
        { status: 403 },
      );
    }
    if (
      err instanceof AiBudgetExceededError ||
      err instanceof VoiceModelError ||
      err instanceof AiProviderNotConfiguredError
    ) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("[assistant] voice session failed", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "The voice session could not start." },
      { status: 502 },
    );
  }
}
