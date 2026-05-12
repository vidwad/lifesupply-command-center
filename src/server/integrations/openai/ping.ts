/**
 * OpenAI API auth-check. GET /v1/models is the standard zero-cost auth probe.
 */

import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

export type OpenAiPingResult =
  | { ok: true; modelCount: number; detail: string }
  | { ok: false; status: number | "network" | "missing_credential"; message: string };

export async function pingOpenAi(connectionId: string): Promise<OpenAiPingResult> {
  const bundle = await resolveCredentialsBundleForConnection(connectionId);
  const apiKey = bundle?.apiKey;
  if (!apiKey) {
    return { ok: false, status: "missing_credential", message: "API key not set" };
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
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
    return { ok: false, status: res.status, message: body || `OpenAI returned ${res.status}` };
  }

  const data = (await res.json().catch(() => ({}))) as { data?: unknown[] };
  const count = Array.isArray(data.data) ? data.data.length : 0;
  return {
    ok: true,
    modelCount: count,
    detail: `Authenticated; ${count} models available.`,
  };
}
