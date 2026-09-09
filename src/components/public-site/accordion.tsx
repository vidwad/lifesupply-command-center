"use client";

/**
 * FAQ accordion, adapted from the 21st.dev motion-primitives Accordion
 * (ibelick): one open panel at a time, animated height, chevron rotation.
 * Rewritten for this site: plain state instead of a provider, the `motion`
 * package (not framer-motion), reduced-motion respected, native button
 * semantics with aria-expanded and aria-controls, and the LifeSupply tokens.
 */
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

export function Accordion({
  items,
  tone = "onLight",
}: {
  items: readonly { q: string; a: string }[];
  tone?: "onLight" | "onDark";
}) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  const id = useId();
  const dark = tone === "onDark";
  return (
    <div
      className={`divide-y ${dark ? "divide-white/15" : "divide-[var(--lsh-rule)]"} border-y ${
        dark ? "border-white/15" : "border-[var(--lsh-rule)]"
      }`}
    >
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `${id}-panel-${index}`;
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpen(expanded ? null : index)}
              className={`group flex w-full items-center justify-between gap-6 py-5 text-left transition-colors ${
                dark
                  ? "text-white hover:text-[var(--lsh-red-on-ink)]"
                  : "text-[var(--lsh-charcoal)] hover:text-[var(--lsh-brand-red)]"
              }`}
            >
              <span className="lsh-display text-base sm:text-lg">{item.q}</span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                  expanded ? "rotate-180" : ""
                } ${dark ? "text-[var(--lsh-red-on-ink)]" : "text-[var(--lsh-brand-red)]"}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={panelId}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p
                    className={`max-w-3xl pb-6 leading-7 ${dark ? "text-white/75" : "text-[var(--lsh-muted)]"}`}
                  >
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
