/**
 * DP-6 writeback READ-ONLY queries and state.
 *
 * Split out of writeback.ts in DP-6A so that rendering a page never loads the
 * module that owns the write path. The detail page needs writeback history and
 * flag state to explain itself; it has no business importing a module that, two
 * imports down, holds a BigCommerce client capable of changing a live price.
 *
 * The dependency direction is one-way and enforced by canary: writeback.ts may
 * import from here, and nothing here may import the BigCommerce client or the
 * write service. Everything in this file is a SELECT or a flag read.
 */
import { prisma } from "@/server/db/client";
import { isFeatureOn } from "@/server/services/feature-flags";

import { REQUIRED_WRITEBACK_FLAGS } from "./writeback-eligibility";

/**
 * Which of the required flags are currently off.
 *
 * Shared with the write service so the UI's explanation and the service's
 * refusal can never disagree about what is required — a page that says
 * "everything is on" while the service refuses is worse than either alone.
 */
export async function flagsBlockingWriteback(): Promise<string[]> {
  const off: string[] = [];
  for (const flag of REQUIRED_WRITEBACK_FLAGS) {
    if (!(await isFeatureOn(flag))) off.push(flag);
  }
  return off;
}

/** Whether writeback is currently possible at all, for UI explanation. */
export async function writebackFlagState(): Promise<{ enabled: boolean; disabledFlags: string[] }> {
  const disabledFlags = await flagsBlockingWriteback();
  return { enabled: disabledFlags.length === 0, disabledFlags };
}

/** Writeback history for one recommendation, for the detail page. */
export async function listWritebackLogs(recommendationId: string) {
  return prisma.priceWritebackLog.findMany({
    where: { recommendationId },
    orderBy: { createdAt: "desc" },
    include: { writtenBy: { select: { id: true, name: true, email: true } } },
  });
}
