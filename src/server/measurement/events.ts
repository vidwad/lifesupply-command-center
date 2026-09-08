/**
 * Server-confirmed measurement events (Stage 8). The only producer today is
 * the public inquiry intake, which records `inquiry_submitted` after the
 * row is persisted and never before. Events are structured log lines with
 * allowlisted, non-sensitive parameters; no analytics property receives
 * them until consent handling and a property are approved.
 */
import { MEASUREMENT_EVENTS, type MeasurementEvent } from "@/lib/public-site/measurement";
import { logger } from "@/server/logger";

const SAFE_VALUE = /^[a-z0-9_/-]{1,80}$/;

export function recordServerEvent(
  event: MeasurementEvent,
  params: Record<string, string | undefined>,
) {
  const definition = MEASUREMENT_EVENTS[event];
  if (definition.source !== "server") return;
  const allowed = definition.params as readonly string[];
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (allowed.includes(key) && value && SAFE_VALUE.test(value)) safe[key] = value;
  }
  logger.info({ measurement: event, ...safe }, "measurement.server_event");
}
