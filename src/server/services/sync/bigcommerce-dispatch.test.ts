import { describe, expect, it } from "vitest";

import {
  planBigCommerceDispatch,
  type BcConnectionForDispatch,
  type DispatchPlanItem,
} from "./bigcommerce-dispatch";

function conn(over: Partial<BcConnectionForDispatch>): BcConnectionForDispatch {
  return {
    id: "c1",
    name: "BigCommerce — LifeSupply.ca",
    storeId: null,
    store: null,
    ...over,
  };
}

/** Plan a single connection and return its (defined) plan item. */
function planOne(over: Partial<BcConnectionForDispatch>): DispatchPlanItem {
  const plan = planBigCommerceDispatch([conn(over)]);
  expect(plan).toHaveLength(1);
  return plan[0]!;
}

const bcStore = { id: "s1", name: "LifeSupply.ca", platform: "bigcommerce", divisionId: "d1" };

describe("planBigCommerceDispatch", () => {
  it("dispatches a connection explicitly mapped to a BigCommerce store", () => {
    const item = planOne({ storeId: "s1", store: bcStore });
    expect(item.decision).toBe("dispatch");
    if (item.decision === "dispatch") {
      expect(item.store).toEqual({ id: "s1", name: "LifeSupply.ca" });
    }
  });

  it("skips a connection with no store mapping (storeId null)", () => {
    const item = planOne({ storeId: null, store: null });
    expect(item.decision).toBe("skip");
    if (item.decision === "skip") {
      expect(item.reason).toMatch(/not mapped to a Store/i);
      expect(item.reason).toMatch(/admin\/integrations/);
    }
  });

  it("skips when the mapped store row is gone (storeId set but relation null)", () => {
    expect(planOne({ storeId: "ghost", store: null }).decision).toBe("skip");
  });

  it("skips a connection mapped to a non-BigCommerce store", () => {
    const amazon = { id: "s9", name: "Amazon US", platform: "amazon", divisionId: "d9" };
    const item = planOne({ storeId: "s9", store: amazon });
    expect(item.decision).toBe("skip");
    if (item.decision === "skip") {
      expect(item.reason).toMatch(/not a BigCommerce store/i);
    }
  });

  it("does not depend on the connection display name for matching", () => {
    // A garbage name still dispatches as long as the FK mapping is set.
    const item = planOne({ name: "totally-unrelated-name", storeId: "s1", store: bcStore });
    expect(item.decision).toBe("dispatch");
  });

  it("plans each connection independently in a mixed batch", () => {
    const plan = planBigCommerceDispatch([
      conn({ id: "a", storeId: "s1", store: bcStore }),
      conn({ id: "b", storeId: null, store: null }),
    ]);
    expect(plan.map((p) => p.decision)).toEqual(["dispatch", "skip"]);
  });
});

describe("planBigCommerceDispatch — division filter", () => {
  const otherDivisionStore = {
    id: "s2",
    name: "WellmartMedical.com",
    platform: "bigcommerce",
    divisionId: "d2",
  };

  it("dispatches every mapped store when no division is given", () => {
    // "All divisions" in the shell selector — the pre-existing behaviour.
    const plan = planBigCommerceDispatch([
      conn({ id: "c1", storeId: "s1", store: bcStore }),
      conn({ id: "c2", storeId: "s2", store: otherDivisionStore }),
    ]);
    expect(plan.map((p) => p.decision)).toEqual(["dispatch", "dispatch"]);
  });

  it.each([null, undefined, ""])("treats %p as all divisions", (value) => {
    // An empty search param must not silently scope the run to nothing.
    const plan = planBigCommerceDispatch(
      [conn({ id: "c1", storeId: "s1", store: bcStore })],
      value as string | null | undefined,
    );
    expect(plan[0]!.decision).toBe("dispatch");
  });

  it("dispatches only stores in the selected division", () => {
    const plan = planBigCommerceDispatch(
      [
        conn({ id: "c1", storeId: "s1", store: bcStore }),
        conn({ id: "c2", storeId: "s2", store: otherDivisionStore }),
      ],
      "d1",
    );
    expect(plan[0]!.decision).toBe("dispatch");
    expect(plan[1]!.decision).toBe("skip");
  });

  it("skips out-of-division stores with a reason rather than dropping them", () => {
    // The caller must be able to show what a scoped run left alone, so a
    // filtered store stays in the plan as an explicit skip.
    const plan = planBigCommerceDispatch(
      [conn({ id: "c2", storeId: "s2", store: otherDivisionStore })],
      "d1",
    );
    expect(plan).toHaveLength(1);
    const item = plan[0]!;
    expect(item.decision).toBe("skip");
    if (item.decision === "skip") {
      expect(item.reason).toContain("WellmartMedical.com");
      expect(item.reason).toContain("division filter");
    }
  });

  it("can legitimately dispatch nothing when no store is in the division", () => {
    const plan = planBigCommerceDispatch(
      [conn({ id: "c1", storeId: "s1", store: bcStore })],
      "d-nonexistent",
    );
    expect(plan.every((p) => p.decision === "skip")).toBe(true);
  });

  it("reports a mapping problem as a mapping problem, not as a division mismatch", () => {
    // Ordering matters: an unmapped connection must not be explained away by
    // the division filter, or a real misconfiguration stays hidden.
    const item = planBigCommerceDispatch([conn({ storeId: null, store: null })], "d1")[0]!;
    expect(item.decision).toBe("skip");
    if (item.decision === "skip") {
      expect(item.reason).toContain("not mapped to a Store");
      expect(item.reason).not.toContain("division filter");
    }
  });

  it("reports a non-BigCommerce store as such even when the division also mismatches", () => {
    const item = planBigCommerceDispatch(
      [
        conn({
          storeId: "s9",
          store: { id: "s9", name: "Amazon US", platform: "amazon", divisionId: "d9" },
        }),
      ],
      "d1",
    )[0]!;
    expect(item.decision).toBe("skip");
    if (item.decision === "skip") {
      expect(item.reason).toContain("not a BigCommerce store");
      expect(item.reason).not.toContain("division filter");
    }
  });
});
