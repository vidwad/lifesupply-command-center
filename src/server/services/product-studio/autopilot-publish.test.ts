import { describe, expect, it } from "vitest";

import { storeDescriptionIsEmpty } from "./autopilot-publish";

describe("deciding whether the store already has a description", () => {
  it("treats null, blank and markup-only descriptions as empty", () => {
    expect(storeDescriptionIsEmpty(null)).toBe(true);
    expect(storeDescriptionIsEmpty("")).toBe(true);
    expect(storeDescriptionIsEmpty("<p>&nbsp;</p><br>")).toBe(true);
  });
  it("treats any text as a description to keep under fill_empty", () => {
    expect(storeDescriptionIsEmpty("<p>Sterile gauze</p>")).toBe(false);
    expect(storeDescriptionIsEmpty("Gauze")).toBe(false);
  });
});
