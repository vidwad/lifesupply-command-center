"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ContextOptionLists } from "./ContextOptionLists";
import { SidebarNav } from "./SidebarNav";

type Option = { value: string; label: string };

type Props = {
  permissions: string[];
  divisions: Option[];
  periods: Option[];
};

/**
 * Below the `md` breakpoint the sidebar is not rendered, so this button
 * opens the same navigation as a left drawer. The division and period
 * selectors, hidden from the top bar below `lg`, live here too so a phone
 * can still change context. They are plain option lists rather than native
 * selects: a select inside this modal drawer did not always open on the
 * first touch (2026-10-29). The whole drawer scrolls as one, so an expanded
 * list is reachable. The drawer closes itself after navigation.
 */
export function MobileNav({ permissions, divisions, periods }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close when the route changes under an open drawer (back/forward, or a
  // link whose onClick did not fire). Resetting state during render is the
  // React-sanctioned form; an effect would re-render twice.
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (seenPathname !== pathname) {
    setSeenPathname(pathname);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 max-w-[85vw] p-0"
        title="Navigation"
        description="Modules and context"
        hideClose
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* A plain block, so the navigation's full-height layout resolves
              to its content height and it does not scroll inside itself. */}
          <div>
            <SidebarNav permissions={permissions} onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t p-3">
            <p className="mb-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Context
            </p>
            <div className="px-3">
              <ContextOptionLists divisions={divisions} periods={periods} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
