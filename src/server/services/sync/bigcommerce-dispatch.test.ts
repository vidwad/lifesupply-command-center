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

const bcStore = { id: "s1", name: "LifeSupply.ca", platform: "bigcommerce" };

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
    const amazon = { id: "s9", name: "Amazon US", platform: "amazon" };
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
