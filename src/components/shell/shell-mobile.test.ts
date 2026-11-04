/**
 * Shell responsiveness canaries (2026-10-27).
 *
 * The sidebar is not rendered below the `md` breakpoint. Before this date
 * nothing replaced it, so a phone had no navigation beyond the search box.
 * These hold the replacement in place: a menu button in the top bar that
 * opens the same navigation as a drawer, carrying the context selectors.
 */
import { existsSync, readFileSync } from "node:fs";
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

describe("the phone has function keys along the bottom (2026-11-03)", () => {
  const bar = read("BottomTabBar.tsx");

  it("sits in the shell's column below the scrolling area, so it covers nothing", () => {
    const shell = read("AppShell.tsx");
    // The column is the phone's visible height, not the address-bar-hidden
    // height, or the bar ends up behind the browser's toolbar.
    expect(shell).toContain('className="flex h-dvh h-screen w-full overflow-hidden bg-muted/20"');
    expect(shell).toMatch(
      /<main className="flex-1 overflow-y-auto">\{children\}<\/main>[\s\S]*?<BottomTabBar/,
    );
    expect(bar).toContain(
      'className="phone-key-bar shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"',
    );
    // iOS Safari floats its toolbar over the page and reports only the home
    // indicator as the inset, so the bar clears the toolbar there explicitly.
    const css = readFileSync(join(__dirname, "..", "..", "styles", "globals.css"), "utf8");
    expect(css).toMatch(
      /@supports \(-webkit-touch-callout: none\) \{\s*\.phone-key-bar \{\s*padding-bottom: calc\(max\(env\(safe-area-inset-bottom, 0px\), 20px\) \+ 48px\);/,
    );
    expect(css).toMatch(/@media \(display-mode: standalone\) \{\s*\.phone-key-bar/);
  });

  it("offers home, orders, customers, tasks and the AI tool, each behind its sidebar permission", () => {
    const hrefs = [...bar.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/dashboard", "/orders", "/customers", "/tasks", "/ai-analyst"]);
    expect(bar).toContain("PERMISSIONS.DASHBOARD_VIEW");
    expect(bar).toContain("PERMISSIONS.ORDERS_VIEW");
    expect(bar).toContain("PERMISSIONS.CUSTOMERS_VIEW");
    expect(bar).toContain("PERMISSIONS.TASKS_VIEW");
    expect(bar).toContain("PERMISSIONS.AI_USE");
    expect(bar).toContain("permissions.includes(item.permission)");
  });

  it("marks the current destination and shows what needs attention on the tasks key", () => {
    expect(bar).toContain('aria-current={active ? "page" : undefined}');
    expect(bar).toContain("counts.myOverdueTasks + counts.approvalsCanDecide");
    // Each key is a full-height target a thumb can hit.
    expect(bar).toContain("min-h-14");
  });
});

describe("the Command Center opens from the Home Screen as an app (2026-11-04)", () => {
  const ROOT = join(__dirname, "..", "..", "..");
  const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
  const dashboardLayout = readFileSync(join(ROOT, "src/app/(dashboard)/layout.tsx"), "utf8");
  const manifest = readFileSync(join(ROOT, "src/app/manifest.ts"), "utf8");

  it("declares a standalone manifest with the dashboard as its start address and the icons it needs", () => {
    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain('start_url: "/dashboard"');
    for (const icon of ["icon-192.png", "icon-512.png", "icon-512-maskable.png"]) {
      expect(manifest).toContain(`/icons/${icon}`);
      expect(existsSync(join(ROOT, "public/icons", icon))).toBe(true);
    }
  });

  it("tells iOS the same, and sizes the body to the visible viewport so the top bar cannot scroll away", () => {
    expect(dashboardLayout).toContain("appleWebApp: { capable: true");
    expect(layout).not.toContain("appleWebApp");
    expect(layout).toContain('viewportFit: "cover"');
    expect(layout).toContain(
      'className="min-h-dvh min-h-screen bg-background font-sans text-foreground antialiased"',
    );
  });
});

describe("the Products page folds its secondary filters on a phone (2026-11-04)", () => {
  const ROOT = join(__dirname, "..", "..", "..");
  const page = readFileSync(join(ROOT, "src/app/(dashboard)/products/page.tsx"), "utf8");
  const disclosure = readFileSync(
    join(ROOT, "src/components/data/PhoneFilterDisclosure.tsx"),
    "utf8",
  );

  it("keeps the quality pills visible and folds the range, performance and threshold rows", () => {
    const pills = page.indexOf('label="Missing images"');
    const fold = page.indexOf("<PhoneFilterDisclosure summary={filterSummary}>");
    const form = page.indexOf('<form action="/products"');
    const end = page.indexOf("</PhoneFilterDisclosure>");
    expect(pills).toBeGreaterThan(0);
    expect(fold).toBeGreaterThan(pills);
    expect(form).toBeGreaterThan(fold);
    expect(end).toBeGreaterThan(form);
  });

  it("the control is phone-only and the rows stay as they were from md up", () => {
    expect(disclosure).toContain("md:hidden");
    expect(disclosure).toContain('open ? "block" : "hidden md:block"');
    expect(disclosure).toContain("aria-expanded={open}");
  });
});
