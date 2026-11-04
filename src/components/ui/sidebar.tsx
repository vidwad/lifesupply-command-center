"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * A collapsible application sidebar (2026-11-04), after the shadcn sidebar
 * as the owner's pookt-operations app uses it, written for this repo's
 * Tailwind 3 and its Sheet. On a desktop it is a fixed panel that collapses
 * to an icon rail, remembered in a cookie and toggled with Ctrl/⌘ B; on a
 * phone it is a sheet from the left, opened from the header's trigger or
 * the dock's Menu key and closed when a destination is chosen.
 */

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isMobile;
}

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [open, setOpenState] = React.useState(defaultOpen);

  const setOpen = React.useCallback((value: boolean) => {
    setOpenState(value);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v);
    else setOpen(!open);
  }, [isMobile, open, setOpen]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn("group/sidebar-wrapper flex w-full", className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

/**
 * The panel. `mobileTitle` and `mobileDescription` name the sheet for a
 * screen reader; the sheet shows no visible header of its own.
 */
export function Sidebar({
  className,
  children,
  mobileTitle = "Navigation",
  mobileDescription = "Modules and context",
  ...props
}: React.ComponentProps<"div"> & { mobileTitle?: string; mobileDescription?: string }) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          data-sidebar="sidebar"
          data-mobile="true"
          className={cn("w-72 max-w-[85vw] p-0", className)}
          title={mobileTitle}
          description={mobileDescription}
          hideClose
          {...props}
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? "icon" : ""}
      data-slot="sidebar"
    >
      {/* The gap the fixed panel occupies in the flow. */}
      <div
        className={cn(
          "relative h-full w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]",
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden h-full w-[var(--sidebar-width)] transition-[width] duration-200 ease-linear md:flex",
          "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]",
          className,
        )}
        {...props}
      >
        <div data-sidebar="sidebar" className="flex h-full w-full flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar, open, isMobile } = useSidebar();
  return (
    <button
      type="button"
      data-sidebar="trigger"
      aria-label={isMobile ? "Open navigation" : open ? "Collapse navigation" : "Expand navigation"}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
  );
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
  );
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return (
    <hr data-sidebar="separator" className={cn("mx-2 border-0 border-t", className)} {...props} />
  );
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center px-2 text-[10px] font-semibold uppercase tracking-widest transition-[margin,opacity] duration-200 ease-linear",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-sidebar="menu-item" className={cn("relative", className)} {...props} />;
}

/**
 * One destination. Collapsed to the icon rail, the label is a tooltip to
 * the right; expanded, or on a phone, the label is in the row.
 */
export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
}) {
  const { isMobile, state } = useSidebar();
  const classes = cn(
    "flex h-10 w-full items-center gap-3 overflow-hidden rounded-md px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
    "[&>span:last-child]:truncate group-data-[collapsible=icon]:[&>span]:hidden [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:shrink-0",
    className,
  );
  const button = asChild ? (
    <SlotButton className={classes} isActive={isActive}>
      {children}
    </SlotButton>
  ) : (
    <button
      type="button"
      data-sidebar="menu-button"
      data-active={isActive}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Applies the button's classes to the single child element, so a Next
 * `Link` can be the menu button without nesting a button in an anchor.
 */
function SlotButton({
  children,
  className,
  isActive,
}: {
  children: React.ReactNode;
  className: string;
  isActive: boolean;
}) {
  const child = React.Children.only(children) as React.ReactElement<{
    className?: string;
    "data-active"?: boolean;
    "data-sidebar"?: string;
  }>;
  return React.cloneElement(child, {
    className: cn(className, child.props.className),
    "data-active": isActive,
    "data-sidebar": "menu-button",
  });
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-sidebar="menu-badge"
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}
