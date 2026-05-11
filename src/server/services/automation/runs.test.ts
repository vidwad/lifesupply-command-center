import { describe, expect, it } from "vitest";

import {
  AutomationApprovalRequiredError,
  AutomationDisabledError,
} from "./runs";

describe("automation error types", () => {
  it("AutomationDisabledError carries the message", () => {
    const e = new AutomationDisabledError("flag off");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("AutomationDisabledError");
    expect(e.message).toBe("flag off");
  });

  it("AutomationApprovalRequiredError has a fixed informative message", () => {
    const e = new AutomationApprovalRequiredError();
    expect(e.name).toBe("AutomationApprovalRequiredError");
    expect(e.message).toMatch(/supplier_order Approval/);
    expect(e.message).toMatch(/prepare_order/);
  });
});
