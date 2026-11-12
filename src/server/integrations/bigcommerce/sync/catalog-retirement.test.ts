import { describe, expect, it } from "vitest";

import {
  absentProducts,
  MAX_RETIREMENT_SHARE,
  retirementDecision,
  type WalkOutcome,
} from "./catalog-retirement";

const fullWalk: WalkOutcome = { mode: "full", walkComplete: true, scanned: 1000, storeTotal: 1000 };

describe("the products a full walk shows the store no longer lists", () => {
  it("names the live products whose BigCommerce id the walk did not return", () => {
    const live = [
      { id: "a", sourceId: "1" },
      { id: "b", sourceId: "2" },
      { id: "c", sourceId: null },
    ];
    expect(absentProducts(live, new Set(["1"])).map((p) => p.id)).toEqual(["b"]);
  });
});

describe("whether the absent products may be retired", () => {
  it("retires a modest share after a complete full walk that matched the store's total", () => {
    expect(retirementDecision({ walk: fullWalk, liveCount: 1010, absentCount: 10 })).toEqual({
      retire: true,
      count: 10,
    });
  });

  it("refuses an incremental walk, which never sees the whole catalogue", () => {
    const decision = retirementDecision({
      walk: { ...fullWalk, mode: "incremental" },
      liveCount: 1010,
      absentCount: 10,
    });
    expect(decision).toMatchObject({ retire: false, reason: /incremental/ });
  });

  it("refuses a walk that stopped early, since absence then proves nothing", () => {
    expect(
      retirementDecision({
        walk: { ...fullWalk, walkComplete: false },
        liveCount: 1010,
        absentCount: 10,
      }),
    ).toMatchObject({ retire: false, reason: /stopped before the last page/ });
  });

  it("refuses an empty walk and a walk short of the store's own total", () => {
    expect(
      retirementDecision({ walk: { ...fullWalk, scanned: 0 }, liveCount: 10, absentCount: 10 }),
    ).toMatchObject({ retire: false, reason: /no products/ });
    expect(
      retirementDecision({
        walk: { ...fullWalk, scanned: 990, storeTotal: 1000 },
        liveCount: 1010,
        absentCount: 20,
      }),
    ).toMatchObject({ retire: false, reason: /990 products but the store reports 1000/ });
  });

  it("accepts a walk whose store gave no total, trusting the complete walk alone", () => {
    expect(
      retirementDecision({
        walk: { ...fullWalk, storeTotal: null },
        liveCount: 1010,
        absentCount: 10,
      }),
    ).toEqual({ retire: true, count: 10 });
  });

  it("refuses to retire more than a fifth of the live products in one go", () => {
    const liveCount = 1000;
    const tooMany = Math.floor(liveCount * MAX_RETIREMENT_SHARE) + 1;
    expect(retirementDecision({ walk: fullWalk, liveCount, absentCount: tooMany })).toMatchObject({
      retire: false,
      reason: /more than 20%/,
    });
    expect(retirementDecision({ walk: fullWalk, liveCount, absentCount: tooMany - 1 })).toEqual({
      retire: true,
      count: tooMany - 1,
    });
  });

  it("is a no-op when nothing is absent", () => {
    expect(retirementDecision({ walk: fullWalk, liveCount: 1000, absentCount: 0 })).toEqual({
      retire: true,
      count: 0,
    });
  });
});
