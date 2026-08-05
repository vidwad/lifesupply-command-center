/**
 * Next.js instrumentation hook (Phase 11E — rows 11E-06/11E-07).
 *
 * `onRequestError` is the framework-level chokepoint for uncaught server
 * errors: every App Router request failure lands here regardless of which
 * page or route threw. It reports through the vendor-neutral
 * `captureException` seam — today structured pino logs (which Render's log
 * alerting can match on), and the DEC-04 error-monitoring service once the
 * product owner picks one, with no call-site changes.
 */
import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/server/logger");
    logger.info(
      { deployEnv: process.env.DEPLOY_ENV ?? "unknown" },
      "web process started (instrumentation registered)",
    );
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { captureException } = await import("@/server/logger/error-tracking");
  captureException(err, {
    source: "next.onRequestError",
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
