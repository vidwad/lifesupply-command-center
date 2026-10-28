import { describe, expect, it } from "vitest";

import {
  decideNextAction,
  evaluateGeneratedImage,
  finalizeRunStatus,
  mayPublishPartially,
  qaScoresFrom,
  type ProjectSnapshot,
} from "./autopilot-policy";
import { DEFAULT_AUTOPILOT_SETTINGS, type AutopilotSettings } from "./autopilot-settings";

const settings: AutopilotSettings = { ...DEFAULT_AUTOPILOT_SETTINGS };
const run = { imagesGenerated: 0 };

const qa = (over: Partial<ReturnType<typeof good>> = {}) => ({ ...good(), ...over });
function good() {
  return {
    identityScore: 0.95,
    conditionFidelityScore: 0.9,
    compositionScore: 0.88,
    textIntegrity: "pass",
    verdict: "pass",
  };
}

const compositions = [1, 2, 3, 4].map((slot) => ({ slot, status: "planned" }));

function snapshot(over: Partial<ProjectSnapshot> = {}): ProjectSnapshot {
  return {
    status: "ready_to_generate",
    sourceCount: 1,
    compositions,
    assets: [],
    identityConfidence: 0.95,
    ...over,
  };
}

describe("approving or regenerating a draft from its QA scores", () => {
  it("approves when the lowest of the three scores reaches the threshold", () => {
    expect(evaluateGeneratedImage(qa(), settings)).toEqual({ decision: "approve", score: 0.88 });
  });
  it("regenerates when any score is below the threshold, naming the lowest", () => {
    const verdict = evaluateGeneratedImage(qa({ compositionScore: 0.7 }), settings);
    expect(verdict.decision).toBe("regenerate");
    expect(verdict).toMatchObject({ score: 0.7 });
    expect((verdict as { reason: string }).reason).toContain("70%");
  });
  it("regenerates on a reject verdict or failed text whatever the scores", () => {
    expect(evaluateGeneratedImage(qa({ verdict: "reject" }), settings).decision).toBe("regenerate");
    expect(evaluateGeneratedImage(qa({ textIntegrity: "fail" }), settings).decision).toBe(
      "regenerate",
    );
  });
  it("approves a needs_review verdict when the scores are high enough", () => {
    expect(evaluateGeneratedImage(qa({ verdict: "needs_review" }), settings).decision).toBe(
      "approve",
    );
  });
  it("reads stored QA JSON defensively and regenerates when there is none", () => {
    expect(qaScoresFrom(null)).toBeNull();
    expect(qaScoresFrom({ identityScore: 0.9 })).toBeNull();
    expect(qaScoresFrom(good())).toMatchObject({ verdict: "pass" });
    expect(evaluateGeneratedImage(null, settings).decision).toBe("regenerate");
  });
});

describe("the next step for a product", () => {
  it("stops a product without a photograph before spending", () => {
    const next = decideNextAction(snapshot({ sourceCount: 0, compositions: [] }), settings, run);
    expect(next.action).toBe("attention");
  });
  it("researches a draft or failed project with no compositions", () => {
    expect(
      decideNextAction(snapshot({ status: "draft", compositions: [] }), settings, run).action,
    ).toBe("research");
    expect(
      decideNextAction(snapshot({ status: "failed", compositions: [] }), settings, run).action,
    ).toBe("research");
  });
  it("stops after research when identity confidence is below the threshold", () => {
    const next = decideNextAction(snapshot({ identityConfidence: 0.6 }), settings, run);
    expect(next.action).toBe("attention");
    expect((next as { reason: string }).reason).toContain("60%");
  });
  it("generates the first slot, then reviews a draft awaiting review", () => {
    expect(decideNextAction(snapshot(), settings, run)).toEqual({
      action: "generate",
      slot: 1,
      regeneration: false,
    });
    const awaiting = snapshot({
      assets: [{ compositionSlot: 1, revision: 1, status: "needs_review" }],
    });
    expect(decideNextAction(awaiting, settings, run)).toEqual({ action: "review", slot: 1 });
  });
  it("regenerates a rejected slot until the attempts run out, then leaves it for a person", () => {
    const once = snapshot({ assets: [{ compositionSlot: 1, revision: 1, status: "rejected" }] });
    expect(decideNextAction(once, settings, run)).toEqual({
      action: "generate",
      slot: 1,
      regeneration: true,
    });
    const spent = snapshot({
      assets: [
        { compositionSlot: 1, revision: 1, status: "rejected" },
        { compositionSlot: 1, revision: 2, status: "rejected" },
        { compositionSlot: 1, revision: 3, status: "rejected" },
        { compositionSlot: 2, revision: 1, status: "approved" },
        { compositionSlot: 3, revision: 1, status: "approved" },
        { compositionSlot: 4, revision: 1, status: "approved" },
      ],
    });
    const next = decideNextAction(spent, settings, run);
    expect(next.action).toBe("attention");
    expect((next as { reason: string }).reason).toContain("image 1 was rejected 3 times");
    expect((next as { approvedSlots: number }).approvedSlots).toBe(3);
    expect((next as { imagesFinal: boolean }).imagesFinal).toBe(true);
  });
  it("publishes a product short of images only when its images are final and the minimum passed", () => {
    const spent = snapshot({
      assets: [
        { compositionSlot: 1, revision: 1, status: "rejected" },
        { compositionSlot: 1, revision: 2, status: "rejected" },
        { compositionSlot: 1, revision: 3, status: "rejected" },
        { compositionSlot: 2, revision: 1, status: "approved" },
        { compositionSlot: 3, revision: 1, status: "approved" },
        { compositionSlot: 4, revision: 1, status: "approved" },
      ],
    });
    const stuck = decideNextAction(spent, settings, run);
    // The default minimum is every image: as before, nothing is published.
    expect(mayPublishPartially(stuck, settings)).toBe(false);
    expect(mayPublishPartially(stuck, { ...settings, minApprovedImagesToPublish: 3 })).toBe(true);
    expect(mayPublishPartially(stuck, { ...settings, minApprovedImagesToPublish: 0 })).toBe(true);
    // The ceiling also leaves the images final.
    const ceiling = decideNextAction(snapshot(), settings, { imagesGenerated: 80 });
    expect(mayPublishPartially(ceiling, { ...settings, minApprovedImagesToPublish: 0 })).toBe(true);
    // A product that stopped before its images never publishes, whatever the minimum.
    for (const early of [
      decideNextAction(snapshot({ sourceCount: 0, compositions: [] }), settings, run),
      decideNextAction(snapshot({ identityConfidence: 0.6 }), settings, run),
      decideNextAction(snapshot({ status: "researching", compositions: [] }), settings, run),
    ]) {
      expect(early.action).toBe("attention");
      expect(mayPublishPartially(early, { ...settings, minApprovedImagesToPublish: 0 })).toBe(
        false,
      );
    }
    // A complete product is not "partial".
    const done = decideNextAction(
      snapshot({
        assets: [1, 2, 3, 4].map((s) => ({ compositionSlot: s, revision: 1, status: "approved" })),
      }),
      settings,
      run,
    );
    expect(done.action).toBe("complete");
    expect(mayPublishPartially(done, settings)).toBe(false);
  });
  it("skips approved slots and only works the ones the settings ask for", () => {
    const two = { ...settings, imagesPerProduct: 2 };
    const project = snapshot({
      assets: [
        { compositionSlot: 1, revision: 1, status: "approved" },
        { compositionSlot: 2, revision: 2, status: "approved" },
      ],
    });
    expect(decideNextAction(project, two, run)).toEqual({ action: "complete", approvedSlots: 2 });
    expect(decideNextAction(project, settings, run)).toEqual({
      action: "generate",
      slot: 3,
      regeneration: false,
    });
  });
  it("honours the run's image ceiling before generating", () => {
    const next = decideNextAction(snapshot(), settings, {
      imagesGenerated: settings.maxImagesTotal,
    });
    expect(next.action).toBe("attention");
    expect((next as { reason: string }).reason).toContain("ceiling");
  });
  it("needs attention when research left a project in an unexpected state", () => {
    const next = decideNextAction(
      snapshot({ status: "researching", compositions: [] }),
      settings,
      run,
    );
    expect(next.action).toBe("attention");
  });
});

describe("closing a run", () => {
  it("succeeds only when every product completed", () => {
    expect(finalizeRunStatus({ outcomes: ["done", "done"], cancelRequested: false })).toBe(
      "succeeded",
    );
    expect(finalizeRunStatus({ outcomes: ["done", "attention"], cancelRequested: false })).toBe(
      "needs_attention",
    );
    expect(finalizeRunStatus({ outcomes: ["failed", "failed"], cancelRequested: false })).toBe(
      "failed",
    );
    expect(finalizeRunStatus({ outcomes: ["done", "cancelled"], cancelRequested: true })).toBe(
      "cancelled",
    );
  });
});
