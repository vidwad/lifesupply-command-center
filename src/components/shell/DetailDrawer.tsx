"use client";

import { useState } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  /** Trigger node — the element that opens the drawer when clicked. */
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  side?: "right" | "left";
  /** Drawer body. Render forms or detail panels here. */
  children: React.ReactNode;
};

/**
 * Right-side detail drawer per docs/08 §3.1 — used for order, supplier,
 * and customer detail panels alongside list views.
 */
export function DetailDrawer({ trigger, title, description, side = "right", children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="contents"
        aria-label={title ? `Open ${title}` : "Open details"}
      >
        {trigger}
      </button>
      <SheetContent side={side} title={title} description={description}>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Variant that accepts an open/onOpenChange to be controlled externally
 * (e.g. when the trigger is rendered far from the drawer in the tree).
 */
export function ControlledDetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  side?: "right" | "left";
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} title={title} description={description}>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
