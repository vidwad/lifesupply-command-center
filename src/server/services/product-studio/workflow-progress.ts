/**
 * Derives the operator-facing workflow step list for a Product Studio project.
 *
 * Kept pure and separate from the page so the state machine is unit-testable
 * and so the "is anything still running?" question has exactly one answer.
 * The page previously computed busyness from compositions alone, which meant
 * the research phase — which runs before any composition exists — rendered as
 * idle with no button and no progress indication.
 */

export type WorkflowStepState = "pending" | "running" | "done" | "failed";

export type WorkflowStep = {
  key: string;
  label: string;
  state: WorkflowStepState;
  detail?: string;
};

export const COMPOSITION_SLOTS = [1, 2, 3, 4] as const;

type ProjectStatus = string;
type CompositionLike = { slot: number; status: string };
type AssetLike = { kind: string; compositionSlot: number | null; status: string };

export type WorkflowProgressInput = {
  status: ProjectStatus;
  compositions: CompositionLike[];
  assets: AssetLike[];
};

const RESEARCH_RUNNING = new Set(["research_queued", "researching"]);
const COMPOSITION_RUNNING = new Set(["queued", "generating"]);

function researchState(input: WorkflowProgressInput): WorkflowStepState {
  if (RESEARCH_RUNNING.has(input.status)) return "running";
  if (input.compositions.length > 0) return "done";
  // `failed` before any composition exists means research itself failed.
  if (input.status === "failed") return "failed";
  return "pending";
}

function compositionState(composition: CompositionLike | undefined): WorkflowStepState {
  if (!composition) return "pending";
  if (COMPOSITION_RUNNING.has(composition.status)) return "running";
  if (composition.status === "generated") return "done";
  if (composition.status === "failed") return "failed";
  return "pending";
}

/**
 * Latest review state for a slot. Assets arrive newest-revision-first, so the
 * first match is the current revision.
 */
function latestAssetForSlot(input: WorkflowProgressInput, slot: number): AssetLike | undefined {
  return input.assets.find((asset) => asset.kind === "generated" && asset.compositionSlot === slot);
}

export function buildWorkflowSteps(input: WorkflowProgressInput): WorkflowStep[] {
  const research = researchState(input);
  const steps: WorkflowStep[] = [
    {
      key: "research",
      label: "Research retailers and prices",
      state: research,
      detail:
        research === "done"
          ? `${input.compositions.length} composition brief${input.compositions.length === 1 ? "" : "s"} ready`
          : research === "running"
            ? "Searching seller pages and normalising prices"
            : research === "failed"
              ? "Research did not complete — re-queue from the workflow panel"
              : undefined,
    },
  ];

  for (const slot of COMPOSITION_SLOTS) {
    const composition = input.compositions.find((item) => item.slot === slot);
    const state = compositionState(composition);
    const asset = latestAssetForSlot(input, slot);
    let detail: string | undefined;
    if (state === "done" && asset) {
      detail =
        asset.status === "approved"
          ? "Approved"
          : asset.status === "rejected"
            ? "Rejected — regenerate for a new revision"
            : "Awaiting your review";
    } else if (state === "running") {
      detail = "Generating and running image QA";
    } else if (state === "failed") {
      detail = "Generation failed — re-queue from the workflow panel";
    }
    steps.push({ key: `slot-${slot}`, label: `Image ${slot} of 4`, state, detail });
  }

  return steps;
}

/** True while any worker job for this project is queued or running. */
export function isWorkflowBusy(input: WorkflowProgressInput): boolean {
  if (RESEARCH_RUNNING.has(input.status)) return true;
  return input.compositions.some((item) => COMPOSITION_RUNNING.has(item.status));
}

/** Count of generated slots the operator has approved. */
export function approvedSlotCount(input: WorkflowProgressInput): number {
  return COMPOSITION_SLOTS.filter((slot) => latestAssetForSlot(input, slot)?.status === "approved")
    .length;
}
