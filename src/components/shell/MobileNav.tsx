"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ContextSelectors } from "./ContextSelectors";
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
 * can still change context. The drawer closes itself after navigation.
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
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNav permissions={permissions} onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t p-3">
            <p className="mb-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Context
            </p>
            <ContextSelectors
              divisions={divisions}
              periods={periods}
              className="flex flex-col gap-2 px-3"
              fullWidth
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
