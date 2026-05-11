import { describe, expect, it } from "vitest";

import { approvePermissionFor, canUserApprove, APPROVAL_TYPE_LABEL } from "./index";

describe("approvePermissionFor", () => {
  it("returns the correct permission for each known approval type", () => {
    expect(approvePermissionFor("campaign")).toBe("marketing.approve_campaign");
    expect(approvePermissionFor("financial_summary")).toBe("financials.approve");
    expect(approvePermissionFor("report")).toBe("reports.approve");
    expect(approvePermissionFor("supplier_order")).toBe("suppliers.approve_order_automation");
    expect(approvePermissionFor("external_update")).toBe("orders.approve_external_update");
    expect(approvePermissionFor("investor_material")).toBe("investors.approve_materials");
  });

  it("returns null for an unknown type (no implicit grant)", () => {
    expect(approvePermissionFor("ai_action")).toBeNull();
    expect(approvePermissionFor("")).toBeNull();
  });
});

describe("canUserApprove", () => {
  it("denies when user has no permissions", () => {
    expect(canUserApprove({ permissions: [] }, "campaign")).toBe(false);
  });

  it("denies when user is null/undefined", () => {
    expect(canUserApprove(null, "campaign")).toBe(false);
    expect(canUserApprove(undefined, "campaign")).toBe(false);
  });

  it("allows when the user holds the type's required permission", () => {
    const user = { permissions: ["marketing.approve_campaign"] };
    expect(canUserApprove(user, "campaign")).toBe(true);
  });

  it("denies when the user holds a different approve permission", () => {
    const user = { permissions: ["financials.approve"] };
    expect(canUserApprove(user, "campaign")).toBe(false);
  });

  it("denies for unknown approval types even if user has many permissions", () => {
    const user = { permissions: ["admin.manage_users", "financials.approve"] };
    expect(canUserApprove(user, "ai_action")).toBe(false);
  });
});

describe("APPROVAL_TYPE_LABEL", () => {
  it("has a label for every type with an approve permission mapping", () => {
    for (const type of [
      "campaign",
      "financial_summary",
      "report",
      "supplier_order",
      "external_update",
      "investor_material",
    ]) {
      expect(APPROVAL_TYPE_LABEL[type]).toBeTruthy();
    }
  });
});
