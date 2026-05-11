/**
 * Public health endpoint. Returns:
 *   - status: ok | degraded | failing
 *   - timestamp + uptime
 *   - DB reachability (raw SELECT 1)
 *   - Anthropic credential present
 *   - High-risk feature-flag posture (any kill-switch on?)
 *
 * NEVER exposes secrets or row counts. Designed for uptime probes + the
 * disaster-recovery runbook (docs/16 §12, §19).
 *
 * Returns 200 on ok, 503 on failing. degraded returns 200 so probes that
 * gate on HTTP status don't trip on optional integrations being missing.
 */

import { prisma } from "@/server/db/client";
import { ALL_FEATURE_FLAG_KEYS, FEATURE_FLAGS } from "@/lib/feature-flags";
import { resolveCredential } from "@/server/services/integrations";
import { getFeatureFlags } from "@/server/services/feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "degraded" | "failing" | "skipped";

type Check = {
  name: string;
  status: CheckStatus;
  /** Optional human-readable note. NEVER include secrets. */
  detail?: string;
};

const STARTED_AT = Date.now();

async function checkDatabase(): Promise<Check> {
  try {
    // Lightweight ping that returns one row regardless of schema state.
    await prisma.$queryRaw`SELECT 1`;
    return { name: "database", status: "ok" };
  } catch (err) {
    return {
      name: "database",
      status: "failing",
      detail: err instanceof Error ? err.name : "unknown",
    };
  }
}

async function checkAnthropic(): Promise<Check> {
  try {
    const key = await resolveCredential("anthropic", "apiKey");
    return key
      ? { name: "anthropic", status: "ok" }
      : { name: "anthropic", status: "skipped", detail: "no credential" };
  } catch {
    // resolveCredential should not throw; defensive.
    return { name: "anthropic", status: "skipped", detail: "credential resolution failed" };
  }
}

async function checkFeatureFlags(): Promise<Check> {
  // Surface high-risk flag posture so probes can alert if something risky
  // is enabled in a deployment that should not have it on.
  const flags = await getFeatureFlags(ALL_FEATURE_FLAG_KEYS);
  const risky: string[] = [];
  for (const key of [
    FEATURE_FLAGS.SUPPLIER_ORDER_SUBMIT,
    FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
    FEATURE_FLAGS.QUICKBOOKS_WRITEBACKS,
    FEATURE_FLAGS.AI_ACTIONS,
    FEATURE_FLAGS.MAILCHIMP_SEND,
  ]) {
    if (flags[key]) risky.push(key);
  }
  return {
    name: "feature_flags",
    status: "ok",
    detail: risky.length > 0 ? `high-risk ON: ${risky.join(", ")}` : "no high-risk flags on",
  };
}

export async function GET() {
  const checks = await Promise.all([checkDatabase(), checkAnthropic(), checkFeatureFlags()]);
  const failing = checks.some((c) => c.status === "failing");
  const degraded = checks.some((c) => c.status === "degraded");
  const status: CheckStatus = failing ? "failing" : degraded ? "degraded" : "ok";

  const body = {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
    checks,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: failing ? 503 : 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
