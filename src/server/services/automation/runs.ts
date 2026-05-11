/**
 * Supplier-automation orchestrator. Phase 2D scope: PREPARE only.
 *
 * Per CLAUDE.md §14 + docs/10 §1, this module:
 *   - Never opens a real supplier portal. Playwright is not installed yet.
 *   - Models every workflow as an AutomationRun with sequenced AutomationStep
 *     rows + AutomationEvidence attachments, so the UI + audit trail are in
 *     place before any live runner lands.
 *   - Synthesizes a price-check or stock-check result from SupplierProduct
 *     data, marking the result as "simulated" so reviewers know it is not
 *     a live capture.
 *   - For prepare_order workflows, raises a `supplier_order` Approval row
 *     and parks the run as `awaiting_approval` until someone with the
 *     right permission decides on it.
 *   - For submit_order, requires BOTH the `supplier.automation` and
 *     `supplier.order_submit` flags + an approved Approval row. Since no
 *     real runner is wired yet, submission fails fast with a clear error.
 *
 * Adding a real portal runner is a separate ticket (install Playwright,
 * build a mock supplier portal, write the per-supplier flow).
 */

import { Prisma, type AutomationWorkflow } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureOn, requireFeature } from "@/server/services/feature-flags";
import { resolveCredentialsBundle } from "@/server/services/integrations";
import {
  BbmAuthError,
  lookupSupplierSku,
  type RunResult,
} from "@/server/automation/suppliers/best-buy-medical";
import { PlaywrightUnavailableError } from "@/server/automation/playwright-runner";

export class AutomationDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutomationDisabledError";
  }
}

export class AutomationApprovalRequiredError extends Error {
  constructor() {
    super(
      "This workflow requires an approved supplier_order Approval row. Run prepare_order first and ask an authorized user to approve it before submitting.",
    );
    this.name = "AutomationApprovalRequiredError";
  }
}

const INCLUDE = {
  supplier: { select: { id: true, name: true, code: true } },
  order: { select: { id: true, orderNumber: true } },
  triggeredBy: { select: { id: true, name: true, email: true } },
  steps: {
    orderBy: { sortOrder: "asc" },
  },
  evidence: {
    orderBy: { capturedAt: "asc" },
  },
} satisfies Prisma.AutomationRunInclude;

export type AutomationRunRow = Prisma.AutomationRunGetPayload<{ include: typeof INCLUDE }>;

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export async function listAutomationRuns(filters: {
  supplierId?: string;
  status?: string;
  workflow?: AutomationWorkflow;
  limit?: number;
} = {}): Promise<AutomationRunRow[]> {
  return prisma.automationRun.findMany({
    where: {
      ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.workflow ? { workflow: filters.workflow } : {}),
    },
    include: INCLUDE,
    orderBy: { startedAt: "desc" },
    take: filters.limit ?? 50,
  });
}

export async function getAutomationRun(id: string): Promise<AutomationRunRow | null> {
  return prisma.automationRun.findUnique({ where: { id }, include: INCLUDE });
}

// ---------------------------------------------------------------------------
// Workflow runners
// ---------------------------------------------------------------------------

type RunAndFinalize = (runId: string) => Promise<void>;

/**
 * Create a run + invoke the inner workflow. Wraps the workflow in a
 * try/catch so a failed run is always recorded with a status + error.
 */
async function createAndRun(args: {
  workflow: AutomationWorkflow;
  supplierId?: string | null;
  orderId?: string | null;
  triggeredById: string;
  metadata?: Prisma.InputJsonValue;
  inner: RunAndFinalize;
}): Promise<string> {
  const run = await prisma.automationRun.create({
    data: {
      workflow: args.workflow,
      supplierId: args.supplierId ?? null,
      orderId: args.orderId ?? null,
      triggeredById: args.triggeredById,
      status: "running",
      metadata: args.metadata ?? Prisma.JsonNull,
    },
  });
  await writeAudit({
    actorUserId: args.triggeredById,
    action: "automation.run_started",
    entityType: "automation_run",
    entityId: run.id,
    afterData: { workflow: args.workflow, supplierId: args.supplierId, orderId: args.orderId },
  });
  try {
    await args.inner(run.id);
  } catch (err) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorSummary: err instanceof Error ? err.message : "unknown error",
      },
    });
    await writeAudit({
      actorUserId: args.triggeredById,
      action: "automation.run_failed",
      entityType: "automation_run",
      entityId: run.id,
      afterData: { error: err instanceof Error ? err.message : "unknown" },
    });
    throw err;
  }
  return run.id;
}

async function recordStep(args: {
  runId: string;
  stepKey: string;
  sortOrder: number;
  status: "succeeded" | "failed" | "skipped";
  output?: Prisma.InputJsonValue;
  error?: string;
}) {
  await prisma.automationStep.create({
    data: {
      runId: args.runId,
      stepKey: args.stepKey,
      sortOrder: args.sortOrder,
      status: args.status,
      startedAt: new Date(),
      completedAt: new Date(),
      output: args.output ?? Prisma.JsonNull,
      errorMessage: args.error ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Price check / stock check — read-only, no portal hit
// ---------------------------------------------------------------------------

/**
 * Try the live BBM01 portal. Returns null if the supplier isn't BBM01 or
 * credentials are missing — caller falls back to the simulation path.
 *
 * On Playwright unavailability the helper throws PlaywrightUnavailableError
 * so the caller can mark the run as failed with a clear message instead of
 * silently degrading to simulation (which would mislead the reviewer).
 */
async function tryLiveLookup(
  supplierCode: string,
  supplierSku: string,
): Promise<RunResult | null> {
  if (supplierCode !== "BBM01") return null;
  const creds = await resolveCredentialsBundle("supplier_portal");
  if (!creds || !creds.username || !creds.password) return null;
  return lookupSupplierSku({
    sku: supplierSku,
    credentials: {
      username: creds.username,
      password: creds.password,
      loginUrl: creds.loginUrl,
    },
  });
}

async function recordEvidence(
  runId: string,
  screenshots: { label: string; bytes: Buffer }[],
): Promise<void> {
  for (const shot of screenshots) {
    await prisma.automationEvidence.create({
      data: {
        runId,
        kind: "screenshot",
        // Real storage (S3) lands in a follow-up ticket; for now we record
        // the metadata + size so the evidence chain is auditable.
        storageRef: `inline:${shot.label}`,
        label: shot.label,
        bytes: shot.bytes.length,
      },
    });
  }
}

/**
 * Price check. Tries the live BBM01 Playwright flow first; falls back to a
 * simulated read of SupplierProduct.cost when credentials aren't configured.
 * Reviewers can tell the two apart by `result.simulated` + the run summary.
 */
export async function runPriceCheck(args: {
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

  return createAndRun({
    workflow: "price_check",
    supplierId: sp.supplierId,
    triggeredById: args.triggeredById,
    metadata: {
      supplierProductId: sp.id,
      supplierSku: sp.supplierSku,
    },
    inner: async (runId) => {
      await recordStep({
        runId,
        stepKey: "load_mapping",
        sortOrder: 0,
        status: "succeeded",
        output: {
          supplierCode: sp.supplier.code,
          supplierSku: sp.supplierSku,
          productName: sp.product?.name ?? null,
        },
      });

      // Try live BBM01 lookup. If the supplier isn't BBM01 or creds are
      // missing, this returns null and we fall back to simulation.
      let live: RunResult | null = null;
      try {
        live = await tryLiveLookup(sp.supplier.code, sp.supplierSku);
      } catch (err) {
        const message =
          err instanceof BbmAuthError
            ? "Supplier portal rejected credentials."
            : err instanceof PlaywrightUnavailableError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Live lookup failed.";
        await recordStep({
          runId,
          stepKey: "live_lookup",
          sortOrder: 1,
          status: "failed",
          error: message,
        });
        await prisma.automationRun.update({
          where: { id: runId },
          data: {
            status: "failed",
            completedAt: new Date(),
            errorSummary: message,
            summary: `Live BBM01 price check failed for ${sp.supplierSku}.`,
          },
        });
        await writeAudit({
          actorUserId: args.triggeredById,
          action: "automation.price_check_failed",
          entityType: "automation_run",
          entityId: runId,
          afterData: { supplierProductId: sp.id, error: message },
        });
        return;
      }

      if (live) {
        await recordEvidence(runId, live.screenshots);
        await recordStep({
          runId,
          stepKey: "live_lookup",
          sortOrder: 1,
          status: live.lookup.found ? "succeeded" : "failed",
          output: {
            simulated: false,
            sku: live.lookup.sku,
            name: live.lookup.name,
            price: live.lookup.price,
            stock: live.lookup.stock,
            screenshots: live.screenshots.length,
          },
          error: live.lookup.found ? undefined : "SKU not found in supplier portal.",
        });
        const succeeded = live.lookup.found;
        await prisma.automationRun.update({
          where: { id: runId },
          data: {
            status: succeeded ? "succeeded" : "failed",
            completedAt: new Date(),
            summary: succeeded
              ? `Live BBM01 price check for ${sp.supplierSku}: ${live.lookup.price ?? "?"} (${live.lookup.stock ?? "?"})`
              : `Live BBM01 price check: SKU ${sp.supplierSku} not found.`,
            errorSummary: succeeded ? null : "SKU not found in supplier portal.",
            result: {
              simulated: false,
              supplierCode: sp.supplier.code,
              supplierSku: sp.supplierSku,
              found: succeeded,
              capturedPrice: live.lookup.price,
              rawPrice: live.lookup.rawPrice,
              stock: live.lookup.stock,
              productName: live.lookup.name,
            },
          },
        });
        await writeAudit({
          actorUserId: args.triggeredById,
          action: succeeded
            ? "automation.price_check_live"
            : "automation.price_check_not_found",
          entityType: "automation_run",
          entityId: runId,
          afterData: {
            supplierProductId: sp.id,
            capturedPrice: live.lookup.price,
            screenshots: live.screenshots.length,
          },
        });
        return;
      }

      // ---- Simulation fallback ----
      const capturedCost = Number(sp.cost);
      await recordStep({
        runId,
        stepKey: "capture_price",
        sortOrder: 1,
        status: "succeeded",
        output: {
          simulated: true,
          capturedCost,
          currency: sp.currency,
          lastCheckedAt: sp.lastCheckedAt,
        },
      });

      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: "succeeded",
          completedAt: new Date(),
          summary: `Simulated price check for ${sp.supplier.code}/${sp.supplierSku}: ${capturedCost} ${sp.currency}.`,
          result: {
            simulated: true,
            supplierCode: sp.supplier.code,
            supplierSku: sp.supplierSku,
            capturedCost,
            currency: sp.currency,
          },
        },
      });
      await writeAudit({
        actorUserId: args.triggeredById,
        action: "automation.price_check_simulated",
        entityType: "automation_run",
        entityId: runId,
        afterData: { supplierProductId: sp.id, capturedCost },
      });
    },
  });
}

export async function runStockCheck(args: {
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

  return createAndRun({
    workflow: "stock_check",
    supplierId: sp.supplierId,
    triggeredById: args.triggeredById,
    metadata: { supplierProductId: sp.id },
    inner: async (runId) => {
      await recordStep({
        runId,
        stepKey: "load_mapping",
        sortOrder: 0,
        status: "succeeded",
        output: { supplierCode: sp.supplier.code, supplierSku: sp.supplierSku },
      });

      // Live BBM01 path mirrors the price-check; same lookup, different
      // field captured on the run.
      let live: RunResult | null = null;
      try {
        live = await tryLiveLookup(sp.supplier.code, sp.supplierSku);
      } catch (err) {
        const message =
          err instanceof BbmAuthError
            ? "Supplier portal rejected credentials."
            : err instanceof PlaywrightUnavailableError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Live lookup failed.";
        await recordStep({
          runId,
          stepKey: "live_lookup",
          sortOrder: 1,
          status: "failed",
          error: message,
        });
        await prisma.automationRun.update({
          where: { id: runId },
          data: {
            status: "failed",
            completedAt: new Date(),
            errorSummary: message,
            summary: `Live BBM01 stock check failed for ${sp.supplierSku}.`,
          },
        });
        await writeAudit({
          actorUserId: args.triggeredById,
          action: "automation.stock_check_failed",
          entityType: "automation_run",
          entityId: runId,
          afterData: { supplierProductId: sp.id, error: message },
        });
        return;
      }

      if (live) {
        await recordEvidence(runId, live.screenshots);
        await recordStep({
          runId,
          stepKey: "live_lookup",
          sortOrder: 1,
          status: live.lookup.found ? "succeeded" : "failed",
          output: {
            simulated: false,
            sku: live.lookup.sku,
            stock: live.lookup.stock,
            screenshots: live.screenshots.length,
          },
          error: live.lookup.found ? undefined : "SKU not found in supplier portal.",
        });
        const succeeded = live.lookup.found;
        await prisma.automationRun.update({
          where: { id: runId },
          data: {
            status: succeeded ? "succeeded" : "failed",
            completedAt: new Date(),
            summary: succeeded
              ? `Live BBM01 stock check for ${sp.supplierSku}: ${live.lookup.stock ?? "?"}`
              : `Live BBM01 stock check: SKU ${sp.supplierSku} not found.`,
            errorSummary: succeeded ? null : "SKU not found in supplier portal.",
            result: {
              simulated: false,
              supplierCode: sp.supplier.code,
              supplierSku: sp.supplierSku,
              found: succeeded,
              availability: live.lookup.stock,
              productName: live.lookup.name,
            },
          },
        });
        await writeAudit({
          actorUserId: args.triggeredById,
          action: succeeded
            ? "automation.stock_check_live"
            : "automation.stock_check_not_found",
          entityType: "automation_run",
          entityId: runId,
          afterData: {
            supplierProductId: sp.id,
            availability: live.lookup.stock,
            screenshots: live.screenshots.length,
          },
        });
        return;
      }

      // ---- Simulation fallback ----
      await recordStep({
        runId,
        stepKey: "capture_stock",
        sortOrder: 1,
        status: "succeeded",
        output: {
          simulated: true,
          availability: sp.availabilityStatus,
          lastCheckedAt: sp.lastCheckedAt,
        },
      });
      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: "succeeded",
          completedAt: new Date(),
          summary: `Simulated stock check for ${sp.supplier.code}/${sp.supplierSku}: ${sp.availabilityStatus}.`,
          result: {
            simulated: true,
            supplierCode: sp.supplier.code,
            supplierSku: sp.supplierSku,
            availability: sp.availabilityStatus,
          },
        },
      });
      await writeAudit({
        actorUserId: args.triggeredById,
        action: "automation.stock_check_simulated",
        entityType: "automation_run",
        entityId: runId,
        afterData: { supplierProductId: sp.id, availability: sp.availabilityStatus },
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Prepare order — drafts a payload + raises an Approval row
// ---------------------------------------------------------------------------

export async function prepareSupplierOrder(args: {
  orderId: string;
  triggeredById: string;
}): Promise<string> {
  await requireFeature(FEATURE_FLAGS.SUPPLIER_AUTOMATION);

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: args.orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
          supplier: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  // Group items by supplier so prepared payloads are per-supplier.
  const bySupplier = new Map<
    string,
    {
      supplierName: string;
      supplierCode: string;
      lines: { productName: string; sku: string | null; quantity: number; unitPrice: number }[];
    }
  >();

  for (const item of order.items) {
    if (!item.supplier) continue;
    const key = item.supplier.id;
    let bucket = bySupplier.get(key);
    if (!bucket) {
      bucket = {
        supplierName: item.supplier.name,
        supplierCode: item.supplier.code,
        lines: [],
      };
      bySupplier.set(key, bucket);
    }
    bucket.lines.push({
      productName: item.product?.name ?? "Unknown product",
      sku: item.product?.sku ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    });
  }

  if (bySupplier.size === 0) {
    throw new Error("Order has no supplier-mapped items — nothing to prepare.");
  }
  if (bySupplier.size > 1) {
    throw new Error(
      `Order has items from ${bySupplier.size} suppliers. Split the order before preparing supplier submissions.`,
    );
  }

  const [supplierId, bucket] = Array.from(bySupplier.entries())[0]!;
  const totalLines = bucket.lines.length;
  const totalAmount = bucket.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  // Validation: pull supplier cost from SupplierProduct and flag mismatches.
  const validationFlags: { sku: string | null; reason: string; expected: number; got: number }[] = [];
  for (const line of bucket.lines) {
    if (!line.sku) continue;
    const mapping = await prisma.supplierProduct.findFirst({
      where: { supplierId, supplierSku: line.sku },
    });
    if (!mapping) {
      validationFlags.push({
        sku: line.sku,
        reason: "no supplier mapping for sku",
        expected: 0,
        got: line.unitPrice,
      });
      continue;
    }
    const expected = Number(mapping.cost);
    const tolerance = expected * 0.05;
    if (Math.abs(line.unitPrice - expected) > tolerance) {
      validationFlags.push({
        sku: line.sku,
        reason: "price differs by >5% from supplier mapping cost",
        expected,
        got: line.unitPrice,
      });
    }
  }

  return createAndRun({
    workflow: "prepare_order",
    supplierId,
    orderId: order.id,
    triggeredById: args.triggeredById,
    metadata: { orderNumber: order.orderNumber, lineCount: totalLines },
    inner: async (runId) => {
      await recordStep({
        runId,
        stepKey: "group_items_by_supplier",
        sortOrder: 0,
        status: "succeeded",
        output: { supplierCode: bucket.supplierCode, lineCount: totalLines, totalAmount },
      });
      await recordStep({
        runId,
        stepKey: "validate_lines",
        sortOrder: 1,
        status: validationFlags.length === 0 ? "succeeded" : "failed",
        output: {
          flagCount: validationFlags.length,
          flags: validationFlags,
        },
        error:
          validationFlags.length > 0
            ? `${validationFlags.length} validation issue(s) — review before approving.`
            : undefined,
      });

      // Raise an Approval row so the prepared payload can be decided on.
      const approval = await prisma.approval.create({
        data: {
          approvalType: "supplier_order",
          relatedEntityType: "AutomationRun",
          relatedEntityId: runId,
          requestSummary: `Approve prepared supplier order to ${bucket.supplierCode} for ${order.orderNumber} (${totalLines} line${totalLines === 1 ? "" : "s"}, ${totalAmount.toFixed(2)})${
            validationFlags.length > 0
              ? `\n\n⚠ ${validationFlags.length} validation flag${validationFlags.length === 1 ? "" : "s"} — review before approving.`
              : ""
          }`,
          requestedById: args.triggeredById,
          status: "pending",
        },
      });

      await recordStep({
        runId,
        stepKey: "request_approval",
        sortOrder: 2,
        status: "succeeded",
        output: { approvalId: approval.id },
      });

      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: "awaiting_approval",
          completedAt: new Date(),
          summary: `Prepared supplier order to ${bucket.supplierCode} for ${order.orderNumber}: ${totalLines} line${totalLines === 1 ? "" : "s"}, ${totalAmount.toFixed(2)}.`,
          result: {
            supplierCode: bucket.supplierCode,
            orderNumber: order.orderNumber,
            lineCount: totalLines,
            totalAmount,
            lines: bucket.lines,
          },
          validationFlags: validationFlags as unknown as Prisma.InputJsonValue,
          approvalId: approval.id,
        },
      });
      await writeAudit({
        actorUserId: args.triggeredById,
        action: "automation.order_prepared",
        entityType: "automation_run",
        entityId: runId,
        afterData: {
          orderId: order.id,
          supplierCode: bucket.supplierCode,
          lineCount: totalLines,
          validationFlagCount: validationFlags.length,
          approvalId: approval.id,
        },
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Submit order — gated; no real runner yet, fails loudly
// ---------------------------------------------------------------------------

export async function submitSupplierOrder(args: {
  runId: string;
  triggeredById: string;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.SUPPLIER_AUTOMATION);
  const submissionEnabled = await isFeatureOn(FEATURE_FLAGS.SUPPLIER_ORDER_SUBMIT);
  if (!submissionEnabled) {
    throw new AutomationDisabledError(
      `Submission is blocked because "${FEATURE_FLAGS.SUPPLIER_ORDER_SUBMIT}" is off.`,
    );
  }

  const run = await prisma.automationRun.findUniqueOrThrow({
    where: { id: args.runId },
    select: { id: true, status: true, approvalId: true, workflow: true, orderId: true, supplierId: true },
  });
  if (run.workflow !== "prepare_order") {
    throw new Error("Only prepare_order runs can be submitted.");
  }
  if (!run.approvalId) throw new AutomationApprovalRequiredError();
  const approval = await prisma.approval.findUniqueOrThrow({
    where: { id: run.approvalId },
    select: { status: true },
  });
  if (approval.status !== "approved") throw new AutomationApprovalRequiredError();

  // No live runner yet — fail fast so callers can wire a real workflow before
  // this path becomes destructive.
  throw new AutomationDisabledError(
    "Live supplier submission is not wired. A Playwright-based runner is the next ticket — see docs/10 §11.",
  );
}
