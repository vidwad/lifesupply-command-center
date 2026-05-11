/**
 * Permission gate for AI-initiated mutations.
 *
 * Per CLAUDE.md §13 + docs/09 §1, AI may always analyze + draft, but any
 * mutation triggered by an AI workflow must pass BOTH:
 *   1. The `ai.actions` FeatureFlag must be on.
 *   2. The calling human user must hold the underlying domain permission
 *      that would normally be required to perform that mutation manually.
 *
 * Callers pass the underlying permission key explicitly so the audit trail
 * makes the authorization basis obvious.
 *
 * This module exists so the check is consistent and centralized — never
 * inline ad-hoc `if (flag && perm)` in feature code.
 */

import { isFeatureOn } from "@/server/services/feature-flags";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { PermissionKey } from "@/lib/permissions";

import { AiActionPermissionError } from "./errors";

export type AiActionContext = {
  user: { id: string; permissions: string[] };
  /** Permission the user needs to perform the equivalent manual action. */
  permission: PermissionKey;
  /** Short identifier of what the AI is trying to do, used in error text + audit. */
  action: string;
};

/**
 * Throw if either the AI-actions feature flag is off, or the user lacks the
 * underlying domain permission. On success returns silently — callers proceed.
 */
export async function requireAiAction(ctx: AiActionContext): Promise<void> {
  if (!ctx.user.permissions.includes(ctx.permission)) {
    throw new AiActionPermissionError(
      `AI action "${ctx.action}" requires the "${ctx.permission}" permission, which the calling user does not have.`,
    );
  }
  const enabled = await isFeatureOn(FEATURE_FLAGS.AI_ACTIONS);
  if (!enabled) {
    throw new AiActionPermissionError(
      `AI action "${ctx.action}" is blocked because the "${FEATURE_FLAGS.AI_ACTIONS}" feature flag is off. Enable it in /admin/feature-flags after reviewing the workflow.`,
    );
  }
}

/**
 * Non-throwing variant — returns a tagged result that lets callers branch
 * (e.g. show a "request approval" UI instead of erroring). Useful in pages
 * that want to render AI controls only when permitted.
 */
export async function canPerformAiAction(
  ctx: AiActionContext,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await requireAiAction(ctx);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Not permitted." };
  }
}
