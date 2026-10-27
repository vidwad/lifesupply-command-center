/**
 * Decision rules for unattended Product Studio runs (product owner,
 * 2026-10-27). Pure functions of the rows passed in, so the run processor
 * and its tests cannot disagree about what happens next.
 *
 * The owner's rule: an image below the confidence threshold is regenerated
 * automatically; one at or above it is approved automatically. The QA pass
 * returns three scores (identity, condition fidelity, composition) and a
 * verdict, so "confidence" here is the lowest of the three scores, and a
 * reject verdict or failed text integrity always regenerates whatever the
 * numbers say. The QA model's own confidence in its verdict is not used as
 * the threshold: it rates the model's certainty, not the image.
 */
import type { AutopilotSettings } from "./autopilot-settings";

export type QaScores = {
  identityScore: number;
  conditionFidelityScore: number;
  compositionScore: number;
  textIntegrity: string;
  verdict: string;
};

export type ImageDecision =
  | { decision: "approve"; score: number }
  | { decision: "regenerate"; score: number; reason: string };

/** Reads a stored qaResult JSON defensively; null when it is not a QA record. */
export function qaScoresFrom(value: unknown): QaScores | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const num = (key: string) => (typeof record[key] === "number" ? (record[key] as number) : null);
  const identityScore = num("identityScore");
  const conditionFidelityScore = num("conditionFidelityScore");
  const compositionScore = num("compositionScore");
  if (identityScore == null || conditionFidelityScore == null || compositionScore == null) {
    return null;
  }
  return {
    identityScore,
    conditionFidelityScore,
    compositionScore,
    textIntegrity: typeof record.textIntegrity === "string" ? record.textIntegrity : "pass",
    verdict: typeof record.verdict === "string" ? record.verdict : "needs_review",
  };
}

export function evaluateGeneratedImage(
  qa: QaScores | null,
  settings: Pick<AutopilotSettings, "minImageScore">,
): ImageDecision {
  if (!qa) return { decision: "regenerate", score: 0, reason: "QA returned no scores." };
  const score = Math.min(qa.identityScore, qa.conditionFidelityScore, qa.compositionScore);
  if (qa.verdict === "reject") {
    return { decision: "regenerate", score, reason: "QA verdict was reject." };
  }
  if (qa.textIntegrity === "fail") {
    return { decision: "regenerate", score, reason: "QA found garbled or invented text." };
  }
  if (score < settings.minImageScore) {
    return {
      decision: "regenerate",
      score,
      reason: `Lowest QA score ${Math.round(score * 100)}% is below the ${Math.round(settings.minImageScore * 100)}% threshold.`,
    };
  }
  return { decision: "approve", score };
}

export type ProjectSnapshot = {
  status: string;
  sourceCount: number;
  compositions: readonly { slot: number; status: string }[];
  /** Generated assets only, any revision. */
  assets: readonly { compositionSlot: number | null; revision: number; status: string }[];
  /** From researchSummary.identifiedProduct.confidence; null before research. */
  identityConfidence: number | null;
};

export type RunCounters = {
  /** Images generated across the whole run so far. */
  imagesGenerated: number;
};

export type NextAction =
  | { action: "research" }
  | { action: "generate"; slot: number; regeneration: boolean }
  | { action: "review"; slot: number }
  | { action: "complete"; approvedSlots: number }
  | { action: "attention"; reason: string; approvedSlots: number };

/** The latest revision per generated slot. */
function latestBySlot(assets: ProjectSnapshot["assets"]) {
  const map = new Map<number, ProjectSnapshot["assets"][number]>();
  for (const asset of assets) {
    if (asset.compositionSlot == null) continue;
    const current = map.get(asset.compositionSlot);
    if (!current || asset.revision > current.revision) map.set(asset.compositionSlot, asset);
  }
  return map;
}

/**
 * What the run should do next for one product, from its stored state. Called
 * before every step and again after it, so a crashed or retried step simply
 * re-derives its place. Research first; then each requested slot in order:
 * generate when there is no draft or the latest was rejected and attempts
 * remain, review when a draft awaits review, otherwise move on. When every
 * requested slot is approved the product is complete; when any is stuck it
 * needs a person.
 */
export function decideNextAction(
  project: ProjectSnapshot,
  settings: AutopilotSettings,
  run: RunCounters,
): NextAction {
  const latest = latestBySlot(project.assets);
  const approvedSlots = [...latest.values()].filter((a) => a.status === "approved").length;

  if (project.sourceCount === 0) {
    return {
      action: "attention",
      reason: "No authoritative photograph. Add one on the project page and research by hand.",
      approvedSlots,
    };
  }
  if (project.compositions.length === 0) {
    if (project.status === "draft" || project.status === "failed") return { action: "research" };
    return {
      action: "attention",
      reason: `Project is "${project.status}" with no research; finish or re-queue it by hand.`,
      approvedSlots,
    };
  }
  if (
    project.identityConfidence != null &&
    project.identityConfidence < settings.minIdentityConfidence
  ) {
    return {
      action: "attention",
      reason: `Research is ${Math.round(project.identityConfidence * 100)}% sure of the exact product, below the ${Math.round(settings.minIdentityConfidence * 100)}% threshold. Confirm the model before generating.`,
      approvedSlots,
    };
  }

  const stuck: string[] = [];
  for (let slot = 1; slot <= settings.imagesPerProduct; slot += 1) {
    if (!project.compositions.some((c) => c.slot === slot)) {
      stuck.push(`slot ${slot} has no composition brief`);
      continue;
    }
    const asset = latest.get(slot);
    const revisions = project.assets.filter((a) => a.compositionSlot === slot).length;
    if (!asset) {
      if (run.imagesGenerated >= settings.maxImagesTotal) {
        return {
          action: "attention",
          reason: `The run's image ceiling of ${settings.maxImagesTotal} was reached before image ${slot}.`,
          approvedSlots,
        };
      }
      return { action: "generate", slot, regeneration: false };
    }
    if (asset.status === "approved") continue;
    if (asset.status === "needs_review") return { action: "review", slot };
    if (asset.status === "rejected") {
      if (revisions - 1 >= settings.maxRegenerationsPerSlot) {
        stuck.push(
          `image ${slot} was rejected ${revisions} time${revisions === 1 ? "" : "s"} and is out of attempts`,
        );
        continue;
      }
      if (run.imagesGenerated >= settings.maxImagesTotal) {
        return {
          action: "attention",
          reason: `The run's image ceiling of ${settings.maxImagesTotal} was reached before image ${slot} could be regenerated.`,
          approvedSlots,
        };
      }
      return { action: "generate", slot, regeneration: true };
    }
    // queued / generating / failed with an asset: the state the generation
    // service left behind; the revision policy decides whether a new one
    // is due, so treat it as a generate attempt.
    return { action: "generate", slot, regeneration: revisions > 0 };
  }
  if (stuck.length > 0) {
    return {
      action: "attention",
      reason: "Left for review: " + stuck.join("; ") + ".",
      approvedSlots,
    };
  }
  return { action: "complete", approvedSlots };
}

export type ItemOutcome = "done" | "attention" | "failed" | "skipped" | "cancelled";

/** The run's final status from its items' outcomes. */
export function finalizeRunStatus(args: {
  outcomes: readonly ItemOutcome[];
  cancelRequested: boolean;
}): "succeeded" | "needs_attention" | "failed" | "cancelled" {
  if (args.cancelRequested) return "cancelled";
  const counts = { done: 0, attention: 0, failed: 0, skipped: 0, cancelled: 0 };
  for (const outcome of args.outcomes) counts[outcome] += 1;
  if (args.outcomes.length > 0 && counts.failed === args.outcomes.length) return "failed";
  if (counts.attention > 0 || counts.failed > 0 || counts.skipped > 0) return "needs_attention";
  return "succeeded";
}

/** Whether a run is still able to do work. */
export const LIVE_RUN_STATUSES = new Set(["queued", "running"]);
export const TERMINAL_ITEM_STAGES = new Set([
  "done",
  "attention",
  "failed",
  "skipped",
  "cancelled",
]);
