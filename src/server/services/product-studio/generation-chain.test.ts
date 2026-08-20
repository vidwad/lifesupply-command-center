import { describe, expect, it } from "vitest";

import { decideNextChainedSlot } from "./generation-chain";

const base = { autoContinue: true, verdict: "pass", pendingSlots: [2, 3, 4] };

describe("decideNextChainedSlot", () => {
  it("does nothing when the operator generated a single slot", () => {
    expect(decideNextChainedSlot({ ...base, autoContinue: false })).toEqual({
      continue: false,
      reason: "not-requested",
    });
    expect(decideNextChainedSlot({ ...base, autoContinue: undefined })).toEqual({
      continue: false,
      reason: "not-requested",
    });
  });

  it("advances to the lowest pending slot", () => {
    expect(decideNextChainedSlot(base)).toEqual({ continue: true, slot: 2 });
    expect(decideNextChainedSlot({ ...base, pendingSlots: [4, 3] })).toEqual({
      continue: true,
      slot: 3,
    });
  });

  it("stops the run when image QA rejects a draft", () => {
    // Continuing would spend on three more images built from the same failing
    // premise. The operator decides whether to proceed instead.
    expect(decideNextChainedSlot({ ...base, verdict: "reject" })).toEqual({
      continue: false,
      reason: "qa-rejected",
    });
  });

  it("continues through needs_review, which is a human decision not a failure", () => {
    expect(decideNextChainedSlot({ ...base, verdict: "needs_review" })).toEqual({
      continue: true,
      slot: 2,
    });
  });

  it("stops cleanly when the last slot is done", () => {
    expect(decideNextChainedSlot({ ...base, pendingSlots: [] })).toEqual({
      continue: false,
      reason: "no-slots-left",
    });
  });

  it("does not mutate the caller's slot list", () => {
    const pendingSlots = [4, 2, 3];
    decideNextChainedSlot({ ...base, pendingSlots });
    expect(pendingSlots).toEqual([4, 2, 3]);
  });
});
