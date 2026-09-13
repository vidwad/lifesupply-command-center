"use client";

import { useEffect, useState } from "react";

import { Container } from "@/components/public-site/lifesupply-primitives";

/**
 * In-page navigation for a consolidated page, with the current section marked.
 *
 * Plain anchors, rendered as real links: they work with JavaScript disabled,
 * they are text for a screen reader, and the browser's own fragment handling
 * does the scrolling. The only thing JavaScript adds is the current-section
 * mark, so nothing essential depends on it.
 *
 * The mark is an underline and a weight change, never colour alone, so it
 * survives a colour-vision difference and a high-contrast mode.
 *
 * Sticky below the header on desktop only. `scroll-mt` on each target section
 * is what keeps the header and this bar from covering a heading a visitor has
 * just jumped to; this component does not scroll anything itself.
 *
 * Observing sections does not touch the address bar, so the back button still
 * goes back a page rather than through every section the visitor scrolled by.
 */
export function SectionNav({
  items,
  label = "On this page",
}: {
  items: readonly { href: string; label: string }[];
  label?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;

    // The section whose top has most recently passed under the header is the
    // one being read. A band across the upper third keeps that stable while a
    // long section scrolls, instead of flickering between neighbours.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={label}
      className="border-y border-[var(--lsh-rule)] bg-[var(--lsh-paper)] px-5 py-4 lg:sticky lg:top-[4.5rem] lg:z-40 lg:px-8"
    >
      <Container className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <span className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{label}</span>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {items.map((item) => {
            const current = active === item.href;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={current ? "true" : undefined}
                  className={`lsh-display inline-block border-b-2 py-1 text-[11px] transition-colors ${
                    current
                      ? "border-[var(--lsh-brand-red)] text-[var(--lsh-charcoal)]"
                      : "border-transparent text-[var(--lsh-muted)] hover:border-[var(--lsh-rule-strong)] hover:text-[var(--lsh-charcoal)]"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
