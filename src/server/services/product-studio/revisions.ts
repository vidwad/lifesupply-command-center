/**
 * Generation revision policy (pure). A composition slot's latest generated
 * asset controls whether a new generation may run:
 *
 * - no asset yet          → create revision 1
 * - latest is rejected    → create the next revision (regeneration)
 * - anything else         → reuse: the image is still under (or past)
 *                           review, and generating again would silently
 *                           duplicate spend and bypass the review trail
 *
 * Prior revisions are never overwritten — each regeneration is a new row.
 */
export type RevisionPlan = { action: "reuse" } | { action: "create"; revision: number };

export function planGenerationRevision(
  latest: { revision: number; status: string } | null,
): RevisionPlan {
  if (!latest) return { action: "create", revision: 1 };
  if (latest.status === "rejected") return { action: "create", revision: latest.revision + 1 };
  return { action: "reuse" };
}
