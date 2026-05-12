/**
 * Generic "test connection" dispatcher. Looks up the integration by ID,
 * dispatches to the per-provider ping, and returns a uniform shape the
 * admin UI can render. Never throws — callers always get a structured
 * { ok, ... } payload.
 */

import { prisma } from "@/server/db/client";
import { pingAnthropic } from "@/server/integrations/anthropic/ping";
import { pingBigCommerceByConnectionName } from "@/server/integrations/bigcommerce/client";
import { pingMailchimp } from "@/server/integrations/mailchimp/ping";
import { pingOpenAi } from "@/server/integrations/openai/ping";

export type IntegrationTestResult = {
  ok: boolean;
  /** http status code, "network", "missing_credential", "not_implemented", or "internal_error" */
  status: number | string;
  /** Short human message — safe to render in the UI. Never contains the secret. */
  message: string;
  /** Optional structured detail for the UI (e.g. store name, model count). */
  detail?: Record<string, string | number | null>;
};

export async function testIntegrationConnection(
  connectionId: string,
): Promise<IntegrationTestResult> {
  const conn = await prisma.integrationConnection.findUnique({
    where: { id: connectionId },
    select: { id: true, name: true, integrationType: true },
  });
  if (!conn) {
    return { ok: false, status: "missing_credential", message: "Integration not found." };
  }

  try {
    switch (conn.integrationType) {
      case "anthropic": {
        const r = await pingAnthropic(conn.id);
        return r.ok
          ? { ok: true, status: 200, message: r.detail, detail: { model: r.model } }
          : { ok: false, status: r.status, message: r.message };
      }
      case "openai": {
        const r = await pingOpenAi(conn.id);
        return r.ok
          ? { ok: true, status: 200, message: r.detail, detail: { modelCount: r.modelCount } }
          : { ok: false, status: r.status, message: r.message };
      }
      case "bigcommerce": {
        const r = await pingBigCommerceByConnectionName(conn.name);
        return r.ok
          ? {
              ok: true,
              status: 200,
              message: `Connected to "${r.storeName}".`,
              detail: {
                storeName: r.storeName,
                storeId: r.storeId,
                domain: r.domain,
                currency: r.currency,
                plan: r.plan,
              },
            }
          : { ok: false, status: r.status, message: r.message };
      }
      case "mailchimp": {
        const r = await pingMailchimp(conn.id);
        return r.ok
          ? {
              ok: true,
              status: 200,
              message: r.detail,
              detail: { healthStatus: r.healthStatus },
            }
          : { ok: false, status: r.status, message: r.message };
      }
      default:
        return {
          ok: false,
          status: "not_implemented",
          message: `Test not yet implemented for "${conn.integrationType}". Coming soon.`,
        };
    }
  } catch (err) {
    return {
      ok: false,
      status: "internal_error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
