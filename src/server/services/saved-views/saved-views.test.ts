import { describe, expect, it } from "vitest";

import { isSavedViewPage, MAX_VIEWS_PER_PAGE, sanitizeViewParams, viewHref } from "./index";

describe("sanitizeViewParams", () => {
  it("keeps simple string params and drops everything else", () => {
    expect(
      sanitizeViewParams({
        view: "delayed",
        store: "st_1",
        junk: { nested: true },
        list: ["a"],
        empty: "",
        num: 4,
      }),
    ).toEqual({ view: "delayed", store: "st_1" });
  });

  it("bounds key/value lengths and param count", () => {
    const long = sanitizeViewParams({ [`k${"x".repeat(100)}`]: "v".repeat(500) });
    const [key, value] = Object.entries(long)[0]!;
    expect(key.length).toBeLessThanOrEqual(40);
    expect(value.length).toBeLessThanOrEqual(200);

    const many = sanitizeViewParams(
      Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, "v"])),
    );
    expect(Object.keys(many).length).toBeLessThanOrEqual(12);
  });
});

describe("viewHref", () => {
  it("builds a plain link to the page with the stored filters", () => {
    expect(
      viewHref({
        id: "sv1",
        page: "operations",
        name: "Delayed",
        params: { view: "delayed", store: "st_1" },
      }),
    ).toBe("/operations?view=delayed&store=st_1");
  });
  it("omits the query string when empty", () => {
    expect(viewHref({ id: "sv1", page: "tasks", name: "All", params: {} })).toBe("/tasks");
  });
});

describe("isSavedViewPage", () => {
  it("accepts only the known queue pages", () => {
    expect(isSavedViewPage("operations")).toBe(true);
    expect(isSavedViewPage("operations/exceptions")).toBe(true);
    expect(isSavedViewPage("admin/users")).toBe(false);
  });
});

describe("MAX_VIEWS_PER_PAGE", () => {
  it("is pinned", () => {
    expect(MAX_VIEWS_PER_PAGE).toBe(20);
  });
});
