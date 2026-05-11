/**
 * Structured logger for server-side code (docs/14 §14).
 *
 * Pino is fast and produces structured JSON in production. In dev we emit
 * the same JSON — anyone running locally can pipe through `pino-pretty`
 * if they want pretty output, but we don't bundle it as a runtime dep so
 * production stays minimal.
 *
 * Conventions:
 *   - Pass an object first, message second: `log.info({ orderId }, "...")`
 *   - Never log secrets, OAuth tokens, supplier credentials, or full
 *     customer PII. The `redact` config strips a known set of keys
 *     defensively. Add new keys here as new fields appear.
 */

import pino from "pino";

const REDACTED_KEYS = [
  "*.password",
  "*.passwordHash",
  "*.apiKey",
  "*.api_key",
  "*.accessToken",
  "*.access_token",
  "*.refreshToken",
  "*.refresh_token",
  "*.bearerToken",
  "*.bearer_token",
  "*.secret",
  "*.clientSecret",
  "*.client_secret",
  "*.authorization",
  "*.cookie",
  "credentials.*",
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: {
    env: process.env.NODE_ENV ?? "unknown",
    service: "lifesupply-command-center",
  },
  redact: {
    paths: REDACTED_KEYS,
    censor: "[REDACTED]",
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Pino's default time format is epoch ms; switch to ISO for parity with
  // most log aggregators.
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Build a child logger with an additional context bag. Used by services to
 * attach request_id / user_id / job_id without re-stating them on every
 * call site.
 */
export function loggerFor(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
