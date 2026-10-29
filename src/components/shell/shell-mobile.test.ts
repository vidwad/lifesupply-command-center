/**
 * Shell responsiveness canaries (2026-10-27).
 *
 * The sidebar is not rendered below the `md` breakpoint. Before this date
 * nothing replaced it, so a phone had no navigation beyond the search box.
 * These hold the replacement in place: a menu button in the top bar that
 * opens the same navigation as a drawer, carrying the context selectors.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(join(__dirname, name), "utf8").replace(/\r\n/g, "\n");

describe("the app shell keeps a navigation route on narrow screens", () => {
  it("hides the sidebar only where the top bar offers the drawer", () => {
    const shell = read("AppShell.tsx");
    expect(shell).toContain(
      'className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col"',
    );
    const topBar = read("TopBar.tsx");
    expect(topBar).toContain("<MobileNav permissions={user.permissions}");
    const mobile = read("MobileNav.tsx");
    expect(mobile).toContain('className="h-9 w-9 shrink-0 md:hidden"');
    expect(mobile).toContain('aria-label="Open navigation"');
  });

  it("the drawer reuses the sidebar navigation and offers the context as option lists, and closes on navigation", () => {
    const mobile = read("MobileNav.tsx");
    expect(mobile).toContain(
      "<SidebarNav permissions={permissions} onNavigate={() => setOpen(false)} />",
    );
    expect(mobile).toContain("<ContextOptionLists divisions={divisions} periods={periods} />");
    // The navigation and the context scroll as one, so an expanded list
    // below a long navigation is reachable.
    expect(mobile).toMatch(
      /<div className="min-h-0 flex-1 overflow-y-auto">[\s\S]*?<SidebarNav[\s\S]*?<ContextOptionLists/,
    );
    expect(mobile).toMatch(
      /if \(seenPathname !== pathname\) \{\s*setSeenPathname\(pathname\);\s*setOpen\(false\);/,
    );
    const sidebar = read("SidebarNav.tsx");
    expect(sidebar.match(/onClick=\{onNavigate\}/g)?.length).toBe(2);
  });

  it("the drawer's context controls are buttons, never a native select, and carry no hover styles", () => {
    // A native select inside the modal drawer did not always open on the
    // first touch (product owner, 2026-10-29): its picker is the operating
    // system's and depends on the dialog's focus trap and scroll lock. The
    // drawer's lists are ordinary buttons; the top bar keeps its selects.
    const lists = read("ContextOptionLists.tsx");
    expect(lists).not.toContain("<select");
    expect(lists).not.toMatch(/\bhover:/);
    expect(lists).toContain('role="radiogroup"');
    expect(lists).toContain("aria-checked={active}");
    expect(lists).toContain('emptyLabel="All divisions"');
    expect(lists).toContain('emptyLabel="Open period"');
    const mobile = read("MobileNav.tsx");
    expect(mobile).not.toContain("ContextSelectors");
    // Both selectors change the same two address parameters.
    const selectors = read("ContextSelectors.tsx");
    expect(selectors).toContain('from "./context-params"');
    expect(lists).toContain('from "./context-params"');
  });

  it("the page header stacks its title above its actions below `sm`", () => {
    const header = read("PageHeader.tsx");
    expect(header).toContain("flex flex-col gap-3 sm:flex-row");
    expect(header).toContain('className="min-w-0 sm:flex-1"');
    expect(header).toContain("px-4 py-4 md:px-6 md:py-5");
  });
});
