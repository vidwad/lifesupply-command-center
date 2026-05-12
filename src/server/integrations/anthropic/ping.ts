/**
 * Anthropic API auth-check. Sends the cheapest possible request — a 1-token
 * messages call to Haiku — and reports whether the key authenticates. Never
 * echoes the key.
 */

import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

export type AnthropicPingResult =
  | { ok: true; model: string; detail: string }
  | { ok: false; status: number | "network" | "missing_credential"; message: string };

export async function pingAnthropic(connectionId: string): Promise<AnthropicPingResult> {
  const bundle = await resolveCredentialsBundleForConnection(connectionId);
  const apiKey = bundle?.apiKey;
  if (!apiKey) {
    return { ok: false, status: "missing_credential", message: "API key not set" };
  }

  // Use the cheapest current Haiku — pings cost a fraction of a cent.
  const model = "claude-haiku-4-5-20251001";
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      status: "network",
      message: err instanceof Error ? err.message : "Network error",
    };
  }

  if (!res.ok) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 200);
    } catch {
      // ignore
    }
    return { ok: false, status: res.status, message: body || `Anthropic returned ${res.status}` };
  }

  return {
    ok: true,
    model,
    detail: `Authenticated; ${model} responded.`,
  };
}
