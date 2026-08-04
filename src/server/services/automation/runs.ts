/**
 * Supplier-automation orchestrator — listing, order preparation, and the
 * (still disabled) submission gate.
 *
 * Phase 7 moved the read-only checks (price / stock / SKU) into
 * `checks.ts`: the web process only creates the run + dispatches an Inngest
 * event, and the worker performs the portal interaction. This module keeps:
 *   - Run listing/detail queries for the operator UI.
 *   - prepare_order: drafts a payload + raises a `supplier_order` Approval
 *     row and parks the run as `awaiting_approval`.
 *   - submit_order: requires BOTH the `supplier.automation` and
 *     `supplier.order_submit` flags + an approved Approval row. No live
 *     submission runner is wired — it fails fast with a clear error, per
 *     docs/19 §7 ("keep supplier order submission disabled").
 */

import { Prisma, type AutomationWorkflow } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureOn, requireFeature } from "@/server/services/feature-flags";

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
    // Deliberately excludes `data` — payload bytes are served on demand by
    // /api/automation/evidence/[id], not dragged into every listing query.
    select: {
      id: true,
      kind: true,
      storageRef: true,
      label: true,
      description: true,
      contentHash: true,
      bytes: true,
      contentType: true,
      capturedAt: true,
    },
  },
} satisfies Prisma.AutomationRunInclude;

export type AutomationRunRow = Prisma.AutomationRunGetPayload<{ include: typeof INCLUDE }>;

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export async function listAutomationRuns(
  filters: {
    supplierId?: string;
    status?: string;
    workflow?: AutomationWorkflow;
    limit?: number;
  } = {},
): Promise<AutomationRunRow[]> {
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

export async function recordStep(args: {
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
  const validationFlags: { sku: string | null; reason: string; expected: number; got: number }[] =
    [];
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
    select: {
      id: true,
      status: true,
      approvalId: true,
      workflow: true,
      orderId: true,
      supplierId: true,
    },
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
