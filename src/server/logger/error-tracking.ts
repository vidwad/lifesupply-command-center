/**
 * Server-side error tracking abstraction. Today: no-op + structured log.
 *
 * Designed so a real Sentry/OpenTelemetry/Bugsnag client can be slotted in
 * without touching the call sites. The convention is to wrap any
 * non-throwing failure with `captureException` so it ends up in both the
 * structured logs (pino) and the eventual error-tracker.
 *
 * Real Sentry wiring is a follow-up:
 *   1. Add `@sentry/nextjs` dep
 *   2. Run `npx @sentry/wizard@latest -i nextjs`
 *   3. Replace the body of captureException with `Sentry.captureException`
 * The shape stays the same so call sites don't change.
 */

import { logger } from "./index";

export type ErrorContext = Record<string, unknown>;

export function captureException(err: unknown, context: ErrorContext = {}): void {
  const payload =
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : { value: err };
  logger.error({ ...context, err: payload }, "captureException");
}

/** Capture a non-error message at warn level — used for "shouldn't happen" branches. */
export function captureMessage(message: string, context: ErrorContext = {}): void {
  logger.warn({ ...context }, message);
}
