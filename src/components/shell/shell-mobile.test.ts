/**
 * Shell canaries.
 *
 * The sidebar is not rendered below the `md` breakpoint. Before 2026-10-27
 * nothing replaced it, so a phone had no navigation beyond the search box.
 * Since 2026-11-04 the shell follows the owner's pookt-operations app: one
 * grouped sidebar that collapses on a desktop and opens as a sheet on a
 * phone, a header naming the open module, and a dock of function keys at
 * the foot of every page. These hold that structure in place.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NAV_GROUPS, PRIMARY_NAV, navGroupForPath, navItemForPath } from "./nav-config";

const read = (name: string) => readFileSync(join(__dirname, name), "utf8").replace(/\r\n/g, "\n");
const ROOT = join(__dirname, "..", "..", "..");
const readRoot = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

describe("the app shell keeps a navigation route on narrow screens", () => {
  it("renders the panel only from md up, and the header's trigger opens the sheet below it", () => {
    const sidebar = readRoot("src/components/ui/sidebar.tsx");
    expect(sidebar).toContain('className="group peer hidden md:block"');
    expect(sidebar).toMatch(
      /if \(isMobile\) \{\s*return \(\s*<Sheet open=\{openMobile\} onOpenChange=\{setOpenMobile\}>/,
    );
    expect(sidebar).toContain('side="left"');
    const topBar = read("TopBar.tsx");
    expect(topBar).toContain("<SidebarTrigger />");
    expect(sidebar).toContain(
      'aria-label={isMobile ? "Open navigation" : open ? "Collapse navigation" : "Expand navigation"}',
    );
  });

  it("the sheet is the same navigation, offers the context as option lists, and closes on navigation", () => {
    const app = read("AppSidebar.tsx");
    expect(app).toContain("NAV_GROUPS.map((group) => ({");
    expect(app).toContain("<ContextOptionLists divisions={divisions} periods={periods} />");
    // The context sits at the foot of the sheet only; the header's selects serve a desktop.
    expect(app).toMatch(/<SidebarFooter className="[^"]*md:hidden"/);
    expect(app).toMatch(
      /useEffect\(\(\) => \{\s*if \(isMobile\) setOpenMobile\(false\);\s*\}, \[pathname, isMobile, setOpenMobile\]\);/,
    );
    const shell = read("AppShell.tsx");
    expect(shell).toContain("<AppSidebar");
    expect(shell).toContain("<TopBar");
  });

  it("the sheet's context controls are buttons, never a native select, and carry no hover styles", () => {
    // A native select inside the modal drawer did not always open on the
    // first touch (product owner, 2026-10-29): its picker is the operating
    // system's and depends on the dialog's focus trap and scroll lock. The
    // sheet's lists are ordinary buttons; the header keeps its selects.
    const lists = read("ContextOptionLists.tsx");
    expect(lists).not.toContain("<select");
    expect(lists).not.toMatch(/\bhover:/);
    expect(lists).toContain('role="radiogroup"');
    expect(lists).toContain("aria-checked={active}");
    expect(lists).toContain('emptyLabel="All divisions"');
    expect(lists).toContain('emptyLabel="Open period"');
    expect(read("AppSidebar.tsx")).not.toContain("ContextSelectors");
    // Both selectors change the same two address parameters.
    expect(read("ContextSelectors.tsx")).toContain('from "./context-params"');
    expect(lists).toContain('from "./context-params"');
  });

  it("the page header stacks its title above its actions below `sm`", () => {
    const header = read("PageHeader.tsx");
    expect(header).toContain("flex flex-col gap-3 sm:flex-row");
    expect(header).toContain('className="min-w-0 sm:flex-1"');
    expect(header).toContain("px-4 py-4 md:px-6 md:py-5");
  });
});

describe("the sidebar groups every destination and the header names the open one (2026-11-04)", () => {
  it("places each primary item in exactly one group, so nothing silently leaves the sidebar", () => {
    const grouped = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
    expect([...grouped].sort()).toEqual(PRIMARY_NAV.map((item) => item.href).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("resolves an address to its deepest item and that item's group", () => {
    expect(navItemForPath("/products/pricing/runs")?.href).toBe("/products/pricing/runs");
    expect(navItemForPath("/products/studio/abc")?.href).toBe("/products/studio");
    expect(navItemForPath("/orders/123")?.href).toBe("/orders");
    expect(navGroupForPath("/orders/123")?.label).toBe("Commerce");
    expect(navItemForPath("/settings-that-do-not-exist")).toBeNull();
  });

  it("the header shows the item's label and the sidebar collapses to icons with tooltips", () => {
    const title = read("HeaderTitle.tsx");
    expect(title).toContain("navItemForPath(pathname)");
    expect(title).toContain('{item?.label ?? "Command Center"}');
    const sidebar = readRoot("src/components/ui/sidebar.tsx");
    expect(sidebar).toContain('data-collapsible={state === "collapsed" ? "icon" : ""}');
    expect(sidebar).toContain('hidden={state !== "collapsed" || isMobile}');
    expect(sidebar).toContain("SIDEBAR_COOKIE_NAME");
    expect(read("AppShell.tsx")).toContain('cookieStore.get("sidebar_state")?.value !== "false"');
  });
});

describe("the phone has function keys along the bottom (2026-11-03, dock 2026-11-04)", () => {
  const dock = read("MobileDock.tsx");

  it("is fixed at the foot, hidden from md up, and the main area pads for it below md", () => {
    expect(dock).toContain(
      'className="phone-dock fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden"',
    );
    const shell = read("AppShell.tsx");
    expect(shell).toContain('className="flex-1 overflow-y-auto md:pb-0"');
    expect(shell).toContain(
      "paddingBottom: `calc(${DOCK_HEIGHT_PX}px + var(--phone-dock-pad, 0px))`",
    );
    // One variable carries the bottom padding: the safe-area inset, and on
    // iOS Safari the floating toolbar's height, which Safari does not report.
    const css = readRoot("src/styles/globals.css");
    expect(css).toMatch(/:root \{\s*--phone-dock-pad: env\(safe-area-inset-bottom, 0px\);\s*\}/);
    expect(css).toMatch(
      /@supports \(-webkit-touch-callout: none\) \{\s*:root \{\s*--phone-dock-pad: calc\(max\(env\(safe-area-inset-bottom, 0px\), 20px\) \+ 48px\);/,
    );
    expect(css).toMatch(
      /@media \(display-mode: standalone\) \{\s*:root \{\s*--phone-dock-pad: env/,
    );
    expect(css).toMatch(/\.phone-dock \{\s*padding-bottom: var\(--phone-dock-pad\);/);
  });

  it("offers home, two keys that differ by page, the AI tool and the menu, each behind its permission", () => {
    const hrefs = [...dock.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/dashboard", "/orders", "/tasks", "/customers", "/products"]);
    expect(dock).toContain("permissions.includes(key.permission)");
    // The open page's own keys come first, then defaults, never the page already open.
    expect(dock).toContain(
      'actions.slice(0, 2).map((action) => ({ kind: "action" as const, action }))',
    );
    expect(dock).toContain('if (key.id === "home" || isActive(pathname, key)) continue;');
    expect(dock).toContain("onClick={toggleSidebar}");
    expect(dock).toContain("counts.myOverdueTasks + counts.approvalsCanDecide");
  });

  it("the AI key opens a panel above the dock holding the assistant, and pages publish keys through one provider", () => {
    expect(dock).toContain("{assistant && assistantOpen && (");
    expect(dock).toContain("bottom: `calc(${DOCK_HEIGHT_PX}px + var(--phone-dock-pad, 0px))`");
    const shell = read("AppShell.tsx");
    expect(shell).toContain("<AnalystChat suggestions={DOCK_ASSISTANT_SUGGESTIONS} />");
    const dockShell = read("DockShell.tsx");
    expect(dockShell).toContain("<DockActionsProvider onChange={onChange}>");
    expect(read("dock-actions.tsx")).toContain("export function useDockActions(");
  });
});

describe("the Command Center opens from the Home Screen as an app (2026-11-04)", () => {
  const layout = readRoot("src/app/layout.tsx");
  const dashboardLayout = readRoot("src/app/(dashboard)/layout.tsx");
  const manifest = readRoot("src/app/manifest.ts");

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
    expect(read("AppShell.tsx")).toContain(
      'className="h-dvh h-screen overflow-hidden bg-muted/20"',
    );
  });
});

describe("the Products page folds its secondary filters on a phone (2026-11-04)", () => {
  const page = readRoot("src/app/(dashboard)/products/page.tsx");
  const disclosure = readRoot("src/components/data/PhoneFilterDisclosure.tsx");

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
