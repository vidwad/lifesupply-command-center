"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copy an address to the clipboard (round four, change 7).
 *
 * Clipboard access fails in more situations than people expect: an insecure
 * origin, a browser that withholds permission, an embedded webview. So the
 * address is always shown as text beside the control and the control is an
 * addition, never the only way to get it. When the write fails the button says
 * so and asks the visitor to copy the visible address instead, rather than
 * reporting a success that did not happen.
 */
export function CopyEmail({
  address,
  tone = "onLight",
}: {
  address: string;
  tone?: "onLight" | "onDark";
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const dark = tone === "onDark";

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 4000);
  }

  /**
   * The visible word plus this makes the accessible name, so this must not
   * repeat it: "Copy" + " info@lifesupply.com", never "Copy" + "Copy info@…".
   */
  const spokenSuffix =
    state === "failed" ? ` ${address} failed, select the address instead` : ` ${address}`;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className={`lsh-display inline-flex items-center gap-1.5 text-[10px] transition-colors ${
          dark
            ? "text-white/60 hover:text-[var(--lsh-red-on-ink)]"
            : "text-[var(--lsh-muted)] hover:text-[var(--lsh-brand-red)]"
        }`}
      >
        {state === "copied" ? (
          <Check size={13} aria-hidden="true" />
        ) : (
          <Copy size={13} aria-hidden="true" />
        )}
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
        <span className="sr-only">{spokenSuffix}</span>
      </button>
      {/* Announced to assistive technology without moving the layout. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? `${address} copied to the clipboard`
          : state === "failed"
            ? "Could not copy. The address is shown beside this button and can be selected."
            : ""}
      </span>
    </span>
  );
}
