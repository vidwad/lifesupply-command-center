/**
 * "Generate all remaining" sequencing policy (pure).
 *
 * The chain runs one slot at a time rather than fanning out. Inngest already
 * caps project concurrency at 1, so a fan-out would only queue work, not speed
 * it up — while removing the operator's chance to stop a run that is going
 * wrong. Chaining keeps spend sequential and interruptible.
 */

/** Composition statuses that still need an image. */
export const PENDING_COMPOSITION_STATUSES = ["planned", "failed"] as const;

export type ChainDecision =
  | { continue: false; reason: "not-requested" | "qa-rejected" | "no-slots-left" }
  | { continue: true; slot: number };

export function decideNextChainedSlot(args: {
  autoContinue: boolean | undefined;
  /** QA verdict for the image that just finished. */
  verdict: string;
  /** Slots still awaiting generation, in any order. */
  pendingSlots: readonly number[];
}): ChainDecision {
  if (!args.autoContinue) return { continue: false, reason: "not-requested" };
  // A rejected draft means identity or condition drifted. Continuing would
  // spend on three more images built from the same failing premise, so the run
  // stops and hands the decision back to the operator.
  if (args.verdict === "reject") return { continue: false, reason: "qa-rejected" };
  const next = [...args.pendingSlots].sort((a, b) => a - b)[0];
  if (next === undefined) return { continue: false, reason: "no-slots-left" };
  return { continue: true, slot: next };
}
