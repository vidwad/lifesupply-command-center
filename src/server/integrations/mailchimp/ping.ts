/**
 * Mailchimp API auth-check. GET /3.0/ping is the documented health endpoint.
 * The server-prefix on the credential determines the data-center subdomain.
 */

import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

export type MailchimpPingResult =
  | { ok: true; healthStatus: string; detail: string }
  | { ok: false; status: number | "network" | "missing_credential"; message: string };

export async function pingMailchimp(connectionId: string): Promise<MailchimpPingResult> {
  const bundle = await resolveCredentialsBundleForConnection(connectionId);
  const apiKey = bundle?.apiKey;
  const serverPrefix = bundle?.serverPrefix;
  if (!apiKey || !serverPrefix) {
    return {
      ok: false,
      status: "missing_credential",
      message: "apiKey and serverPrefix are both required",
    };
  }

  // Mailchimp uses HTTP Basic with any non-empty username + the API key as
  // the password. "anystring" is the documented placeholder.
  const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");
  const url = `https://${encodeURIComponent(serverPrefix)}.api.mailchimp.com/3.0/ping`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
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
    return { ok: false, status: res.status, message: body || `Mailchimp returned ${res.status}` };
  }

  const data = (await res.json().catch(() => ({}))) as { health_status?: string };
  return {
    ok: true,
    healthStatus: data.health_status ?? "unknown",
    detail: data.health_status ?? "Authenticated.",
  };
}
