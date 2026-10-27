/**
 * Read-only queries for unattended Product Studio runs: the Automation
 * Center pages render from here and never load the module that sends
 * events or spends.
 */
import { prisma } from "@/server/db/client";
import { isFeatureOn } from "@/server/services/feature-flags";

import { LIVE_RUN_STATUSES } from "./autopilot-policy";
import { REQUIRED_AUTOPILOT_FLAGS } from "./autopilot-flags";

export async function autopilotFlagState(): Promise<{ enabled: boolean; disabledFlags: string[] }> {
  const disabledFlags: string[] = [];
  for (const flag of REQUIRED_AUTOPILOT_FLAGS) {
    if (!(await isFeatureOn(flag))) disabledFlags.push(flag);
  }
  return { enabled: disabledFlags.length === 0, disabledFlags };
}

export async function listProductStudioRuns(limit = 50) {
  return prisma.productStudioRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      summary: true,
      imagesGenerated: true,
      cancelRequestedAt: true,
      stopReason: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { items: true } },
      items: { select: { stage: true } },
    },
  });
}

export async function getProductStudioRun(id: string) {
  return prisma.productStudioRun.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      settings: true,
      summary: true,
      imagesGenerated: true,
      consecutiveFailures: true,
      cancelRequestedAt: true,
      stopReason: true,
      approvalId: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true, email: true } },
      cancelledBy: { select: { id: true, name: true, email: true } },
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          projectId: true,
          productId: true,
          productName: true,
          sortOrder: true,
          stage: true,
          steps: true,
          imagesGenerated: true,
          regenerations: true,
          approvedSlots: true,
          publishedItems: true,
          note: true,
          startedAt: true,
          completedAt: true,
          project: { select: { id: true, status: true, confirmedTitle: true, title: true } },
        },
      },
    },
  });
}

/** Whether a run can still change, for the page's refresh and cancel controls. */
export function isRunLive(run: { status: string }): boolean {
  return LIVE_RUN_STATUSES.has(run.status);
}

/**
 * The projects a new run would cover, for the run form: what each one has
 * already, and anything that would make the service refuse it.
 */
export async function listRunCandidates(projectIds: readonly string[]) {
  const ids = [...new Set(projectIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return [];
  const projects = await prisma.productStudioProject.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      confirmedTitle: true,
      status: true,
      product: { select: { id: true, name: true, sku: true } },
      autopilotRun: { select: { id: true, status: true } },
      compositions: { select: { slot: true, status: true } },
      assets: { select: { kind: true, compositionSlot: true, revision: true, status: true } },
    },
  });
  const byId = new Map(projects.map((project) => [project.id, project]));
  return ids.flatMap((id) => {
    const project = byId.get(id);
    return project ? [project] : [];
  });
}
