import { describe, expect, it } from "vitest";

import { storeImageCount } from "./index";

describe("the store image count", () => {
  it("counts the images in the synced payload and reads zero for anything else", () => {
    expect(storeImageCount({ bcRaw: { images: [{ id: 1 }, { id: 2 }, { id: 3 }] } })).toBe(3);
    expect(storeImageCount({ bcRaw: { images: [] } })).toBe(0);
    expect(storeImageCount({ bcRaw: {} })).toBe(0);
    expect(storeImageCount({})).toBe(0);
    expect(storeImageCount(null)).toBe(0);
    expect(storeImageCount("not an object")).toBe(0);
  });
});
