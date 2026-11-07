/**
 * The page-context registration must settle (2026-11-07). The registering
 * effect once depended on the provider's whole value, which changed on every
 * registration, so every registered page re-rendered without end and the
 * sidebar stopped navigating. These hold the two halves of the fix: the
 * setter keeps identity for unchanged content, and the effect depends on
 * the stable setter and the serialised context only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { nextPageContext } from "./page-context";

const source = readFileSync(join(__dirname, "page-context.tsx"), "utf8").replace(/\r\n/g, "\n");

describe("nextPageContext", () => {
  it("keeps the previous object when the content is unchanged, so no re-render follows", () => {
    const previous = { route: "/orders", title: "Orders", figures: [{ label: "a", value: "1" }] };
    const same = { route: "/orders", title: "Orders", figures: [{ label: "a", value: "1" }] };
    expect(nextPageContext(previous, same)).toBe(previous);
    expect(nextPageContext(previous, previous)).toBe(previous);
    expect(nextPageContext(null, null)).toBeNull();
  });

  it("takes the new object when the content differs, and null when the page leaves", () => {
    const previous = { route: "/orders", title: "Orders" };
    const changed = { route: "/orders", title: "Orders", filters: { page: "2" } };
    expect(nextPageContext(previous, changed)).toBe(changed);
    expect(nextPageContext(previous, null)).toBeNull();
    expect(nextPageContext(null, changed)).toBe(changed);
  });
});

describe("the registering effect", () => {
  it("depends on the stable setter and the serialised context, never on the provider's value", () => {
    expect(source).toContain("const set = useContext(Context)?.set;");
    expect(source).toContain("}, [set, key]);");
    expect(source).not.toContain("}, [holder, key]);");
    // The setter is created once and compares content before updating.
    expect(source).toContain("const set = useCallback<Setter>((next) => {");
    expect(source).toContain("setContext((previous) => nextPageContext(previous, next));");
    expect(source).toContain("}, []);");
  });
});
