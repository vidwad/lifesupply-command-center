import { describe, expect, it } from "vitest";

import { InvestorUpdateError } from "./investor-updates";

describe("InvestorUpdateError", () => {
  it("is a real Error subclass with the right name", () => {
    const e = new InvestorUpdateError("something");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InvestorUpdateError");
    expect(e.message).toBe("something");
  });
});
