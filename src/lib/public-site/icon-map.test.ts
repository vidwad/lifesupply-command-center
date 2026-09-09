import { describe, expect, it } from "vitest";

import { ICONS } from "@/components/public-site/icons";

import { ICON_BY_TITLE, iconForTitle } from "./icon-map";

describe("icon map", () => {
  it("points every title at an icon that exists in the registry", () => {
    for (const [title, key] of Object.entries(ICON_BY_TITLE)) {
      expect(key in ICONS, `${title} -> ${key}`).toBe(true);
    }
  });

  it("returns nothing for an unmapped title so a page renders no icon rather than a wrong one", () => {
    expect(iconForTitle("Not a title on the site")).toBeUndefined();
    expect(iconForTitle("Planning")).toBe("compass");
  });
});
