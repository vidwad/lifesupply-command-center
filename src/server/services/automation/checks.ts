/**
 * Read-only supplier checks (Phase 7 — docs/19 §7).
 *
 * Split across processes so browser automation NEVER runs inside a web
 * request (roadmap "do not run automation in browser requests"):
 *
 *   startSupplierCheck (web)   — flag check, create the AutomationRun,
 *                                dispatch `supplier/check.requested`.
 *   executeSupplierCheck (worker) — live BBM01 Playwright lookup (or the
 *                                simulated fallback), durable evidence,
 *                                comparison rules, exceptions, finalize.
 *
 * Run-status semantics: a completed portal interaction is `succeeded` even
 * when the values disagree — the finding lives in validationFlags + an
 * Exception row. `failed` is reserved for automation faults (auth rejected,
 * selector missing, Playwright unavailable), which also raise exceptions so
 * silent breakage is impossible.
 *
 * Order submission is untouched by this module and remains disabled.
 */
import type { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { inngest } from "@/server/inngest/client";
import { isFeatureOn, requireFeature } from "@/server/services/feature-flags";
import { resolveCredentialsBundle } from "@/server/services/integrations";
import { createOrTouchException } from "@/server/services/exceptions";
import { storeScreenshots } from "@/server/services/automation/evidence";
import { recordStep } from "@/server/services/automation/runs";
import {
  BbmAuthError,
  SelectorNotFoundError,
  isMockPortalUrl,
  lookupSupplierSku,
  resolvePortalUrl,
  type RunResult,
} from "@/server/automation/suppliers/best-buy-medical";
import {
  errorScreenshots,
  PlaywrightUnavailableError,
} from "@/server/automation/playwright-runner";
import {
  evaluateSupplierCheck,
  worstVerdict,
  type ComparisonFlag,
} from "@/server/automation/suppliers/comparison";

export const SUPPLIER_CHECK_EVENT = "supplier/check.requested";

export type SupplierCheckWorkflow = "price_check" | "stock_check" | "sku_check";

const WORKFLOW_LABEL: Record<SupplierCheckWorkflow, string> = {
  price_check: "price check",
  stock_check: "stock check",
  sku_check: "SKU check",
};

// ---------------------------------------------------------------------------
// Web side — create + dispatch
// ---------------------------------------------------------------------------

/**
 * Create the run row and hand execution to the worker. Returns the runId
 * immediately; the run page shows live status as the worker progresses.
 */
export async function startSupplierCheck(args: {
  workflow: SupplierCheckWorkflow;
  supplierProductId: string;
  triggeredById: string;
}): Promise<string> {
  await requireFeature(FEATURE_FLAGS.SUPPLIER_AUTOMATION);

  const sp = await prisma.supplierProduct.findUniqueOrThrow({
    where: { id: args.supplierProductId },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true } },
    },
  });

  const run = await prisma.automationRun.create({
    data: {
      workflow: args.workflow,
      supplierId: sp.supplierId,
      triggeredById: args.triggeredById,
      status: "running",
      metadata: {
        supplierProductId: sp.id,
        supplierSku: sp.supplierSku,
        dispatchedToWorker: true,
      },
    },
  });
  await recordStep({
    runId: run.id,
    stepKey: "load_mapping",
    sortOrder: 0,
    status: "succeeded",
    output: {
      supplierCode: sp.supplier.code,
      supplierSku: sp.supplierSku,
      productName: sp.product?.name ?? null,
    },
  });
  await writeAudit({
    actorUserId: args.triggeredById,
    action: "automation.run_started",
    entityType: "automation_run",
    entityId: run.id,
    afterData: { workflow: args.workflow, supplierId: sp.supplierId, supplierSku: sp.supplierSku },
  });

  try {
    await inngest.send({
      name: SUPPLIER_CHECK_EVENT,
      data: { runId: run.id, triggeredById: args.triggeredById },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to dispatch to worker.";
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorSummary: `Could not dispatch to the worker: ${message}`,
      },
    });
    throw err;
  }
  return run.id;
}

// ---------------------------------------------------------------------------
// Worker side — execute + finalize
// ---------------------------------------------------------------------------

const EXCEPTION_TYPE_BY_RULE = {
  price: "supplier_price_mismatch",
  stock: "supplier_stock",
  sku: "supplier_sku_mismatch",
} as const;

export type SupplierCheckOutcome = {
  runId: string;
  status: "succeeded" | "failed" | "cancelled";
  simulated: boolean;
  verdict: string | null;
  exceptionIds: string[];
};

export async function executeSupplierCheck(args: { runId: string }): Promise<SupplierCheckOutcome> {
  const run = await prisma.automationRun.findUniqueOrThrow({
    where: { id: args.runId },
    include: { supplier: { select: { id: true, name: true, code: true } } },
  });
  const meta = (run.metadata ?? {}) as { supplierProductId?: string };
  if (!meta.supplierProductId) {
    throw new Error(`Run ${run.id} has no supplierProductId in metadata.`);
  }
  const workflow = run.workflow as SupplierCheckWorkflow;
  const actorId = run.triggeredById ?? undefined;

  // Honor the kill switch at execution time too — a queued check must not
  // hit the portal after an operator turns the flag off.
  if (!(await isFeatureOn(FEATURE_FLAGS.SUPPLIER_AUTOMATION))) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: "cancelled",
        completedAt: new Date(),
        summary: `Cancelled: ${FEATURE_FLAGS.SUPPLIER_AUTOMATION} was turned off before the worker picked this up.`,
      },
    });
    return {
      runId: run.id,
      status: "cancelled",
      simulated: false,
      verdict: null,
      exceptionIds: [],
    };
  }

  const sp = await prisma.supplierProduct.findUniqueOrThrow({
    where: { id: meta.supplierProductId },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true } },
    },
  });
  const label = WORKFLOW_LABEL[workflow];

  // ---- Live portal path (BBM01 with configured credentials) ----
  const creds =
    sp.supplier.code === "BBM01" ? await resolveCredentialsBundle("supplier_portal") : null;
  const liveEligible = !!(creds?.username && creds?.password);

  if (liveEligible) {
    const credentials = {
      username: creds.username!,
      password: creds.password!,
      loginUrl: creds.loginUrl,
    };
    const portalUrl = resolvePortalUrl(credentials);
    let live: RunResult;
    try {
      live = await lookupSupplierSku({ sku: sp.supplierSku, credentials });
    } catch (err) {
      return finalizeFailedLiveRun({
        run: { id: run.id, workflow, label },
        sp: {
          id: sp.id,
          supplierCode: sp.supplier.code,
          supplierSku: sp.supplierSku,
        },
        err,
        actorId,
      });
    }

    const evidenceCount = await storeScreenshots(run.id, live.screenshots);
    const flags = evaluateSupplierCheck({
      workflow,
      found: live.lookup.found,
      supplierSku: sp.supplierSku,
      portalPrice: live.lookup.price,
      portalStockText: live.lookup.stock,
      portalName: live.lookup.name,
      expectedCost: sp.cost != null ? Number(sp.cost) : null,
      expectedAvailability: sp.availabilityStatus,
      mappedProductName: sp.product?.name ?? null,
    });
    const verdict = worstVerdict(flags);

    await recordStep({
      runId: run.id,
      stepKey: "live_lookup",
      sortOrder: 1,
      status: "succeeded",
      output: {
        simulated: false,
        mockPortal: isMockPortalUrl(portalUrl),
        found: live.lookup.found,
        name: live.lookup.name,
        price: live.lookup.price,
        stock: live.lookup.stock,
        screenshots: evidenceCount,
      },
    });
    await recordStep({
      runId: run.id,
      stepKey: "compare_records",
      sortOrder: 2,
      status: verdict === "mismatch" ? "failed" : "succeeded",
      output: { verdict, flags: flags as unknown as Prisma.InputJsonValue },
      error:
        verdict === "mismatch"
          ? "Portal values contradict Command Center records — see validation flags."
          : undefined,
    });

    const exceptionIds = await raiseComparisonExceptions({
      flags,
      sp: { id: sp.id, supplierCode: sp.supplier.code, supplierSku: sp.supplierSku },
      runId: run.id,
      actorId,
    });

    await prisma.supplierProduct.update({
      where: { id: sp.id },
      data: { lastCheckedAt: new Date() },
    });

    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: "succeeded",
        completedAt: new Date(),
        summary: `Live BBM01 ${label} for ${sp.supplierSku}: ${verdict}${
          live.lookup.found
            ? ` (price ${live.lookup.price ?? "?"}, stock ${live.lookup.stock ?? "?"})`
            : " (SKU not found in portal)"
        }.`,
        validationFlags: flags as unknown as Prisma.InputJsonValue,
        result: {
          simulated: false,
          mockPortal: isMockPortalUrl(portalUrl),
          supplierCode: sp.supplier.code,
          supplierSku: sp.supplierSku,
          found: live.lookup.found,
          capturedPrice: live.lookup.price,
          rawPrice: live.lookup.rawPrice,
          stock: live.lookup.stock,
          productName: live.lookup.name,
          verdict,
          exceptionIds,
        },
      },
    });
    await writeAudit({
      actorUserId: actorId ?? null,
      action: `automation.${workflow}_live`,
      entityType: "automation_run",
      entityId: run.id,
      afterData: {
        supplierProductId: sp.id,
        verdict,
        found: live.lookup.found,
        capturedPrice: live.lookup.price,
        exceptions: exceptionIds.length,
        screenshots: evidenceCount,
      },
    });
    return { runId: run.id, status: "succeeded", simulated: false, verdict, exceptionIds };
  }

  // ---- Simulation fallback (no credentials / non-BBM01 supplier) ----
  // No portal values exist, so comparison is explicitly skipped — comparing
  // a record against itself would fabricate confidence.
  await recordStep({
    runId: run.id,
    stepKey: "capture_snapshot",
    sortOrder: 1,
    status: "succeeded",
    output: {
      simulated: true,
      capturedCost: sp.cost != null ? Number(sp.cost) : null,
      currency: sp.currency,
      availability: sp.availabilityStatus,
      lastCheckedAt: sp.lastCheckedAt,
    },
  });
  await recordStep({
    runId: run.id,
    stepKey: "compare_records",
    sortOrder: 2,
    status: "skipped",
    output: {
      note: "Simulated run — no portal capture to compare. Configure supplier_portal credentials for live checks.",
    },
  });
  await prisma.automationRun.update({
    where: { id: run.id },
    data: {
      status: "succeeded",
      completedAt: new Date(),
      summary: `Simulated ${label} for ${sp.supplier.code}/${sp.supplierSku}: ${
        workflow === "stock_check"
          ? (sp.availabilityStatus ?? "unknown")
          : `${Number(sp.cost)} ${sp.currency}`
      } (no portal credentials).`,
      result: {
        simulated: true,
        supplierCode: sp.supplier.code,
        supplierSku: sp.supplierSku,
        capturedCost: sp.cost != null ? Number(sp.cost) : null,
        currency: sp.currency,
        availability: sp.availabilityStatus,
      },
    },
  });
  await writeAudit({
    actorUserId: actorId ?? null,
    action: `automation.${workflow}_simulated`,
    entityType: "automation_run",
    entityId: run.id,
    afterData: { supplierProductId: sp.id },
  });
  return { runId: run.id, status: "succeeded", simulated: true, verdict: null, exceptionIds: [] };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function raiseComparisonExceptions(args: {
  flags: ComparisonFlag[];
  sp: { id: string; supplierCode: string; supplierSku: string };
  runId: string;
  actorId?: string;
}): Promise<string[]> {
  const ids: string[] = [];
  for (const flag of args.flags) {
    if (flag.verdict !== "warn" && flag.verdict !== "mismatch") continue;
    const { id } = await createOrTouchException(
      {
        exceptionType: EXCEPTION_TYPE_BY_RULE[flag.rule],
        severity: flag.verdict === "mismatch" ? "high" : "medium",
        title: `Supplier ${flag.rule} ${flag.verdict}: ${args.sp.supplierCode}/${args.sp.supplierSku}`,
        description: `${flag.detail} (run ${args.runId})`,
        entityType: "supplier_product",
        entityId: args.sp.id,
        recurringKey: `supplier:${args.sp.supplierCode}:${flag.rule}:${args.sp.supplierSku}`,
        source: "supplier_automation",
        metadata: { runId: args.runId, ...flag } as unknown as Prisma.InputJsonValue,
      },
      args.actorId ? { id: args.actorId } : undefined,
    );
    ids.push(id);
  }
  return ids;
}

async function finalizeFailedLiveRun(args: {
  run: { id: string; workflow: SupplierCheckWorkflow; label: string };
  sp: { id: string; supplierCode: string; supplierSku: string };
  err: unknown;
  actorId?: string;
}): Promise<SupplierCheckOutcome> {
  const { err } = args;
  const failureKind =
    err instanceof BbmAuthError
      ? "login_failed"
      : err instanceof SelectorNotFoundError
        ? "portal_layout_changed"
        : err instanceof PlaywrightUnavailableError
          ? "runner_unavailable"
          : "portal_error";
  const message =
    err instanceof Error ? err.message : "Live supplier lookup failed for an unknown reason.";

  // Failure evidence: screenshots captured before the throw still get stored.
  const shots = errorScreenshots(err);
  if (shots.length > 0) await storeScreenshots(args.run.id, shots);

  await recordStep({
    runId: args.run.id,
    stepKey: "live_lookup",
    sortOrder: 1,
    status: "failed",
    output: { failureKind, screenshots: shots.length },
    error: message,
  });

  // Automation faults raise exceptions too — a silently broken checker is
  // worse than a failing one (docs/19 §7 acceptance criteria).
  const { id: exceptionId } = await createOrTouchException(
    {
      exceptionType: "integration_sync",
      severity: "high",
      title: `Supplier automation failure (${failureKind}): ${args.sp.supplierCode}`,
      description: `${message} (run ${args.run.id})`,
      entityType: "supplier_product",
      entityId: args.sp.id,
      recurringKey: `supplier:${args.sp.supplierCode}:automation_failure:${failureKind}`,
      source: "supplier_automation",
      metadata: { runId: args.run.id, failureKind, workflow: args.run.workflow },
    },
    args.actorId ? { id: args.actorId } : undefined,
  );

  await prisma.automationRun.update({
    where: { id: args.run.id },
    data: {
      status: "failed",
      completedAt: new Date(),
      errorSummary: message,
      summary: `Live BBM01 ${args.run.label} failed for ${args.sp.supplierSku} (${failureKind}).`,
      result: { simulated: false, failureKind, exceptionIds: [exceptionId] },
    },
  });
  await writeAudit({
    actorUserId: args.actorId ?? null,
    action: `automation.${args.run.workflow}_failed`,
    entityType: "automation_run",
    entityId: args.run.id,
    afterData: { supplierProductId: args.sp.id, failureKind, error: message },
  });
  return {
    runId: args.run.id,
    status: "failed",
    simulated: false,
    verdict: null,
    exceptionIds: [exceptionId],
  };
}
