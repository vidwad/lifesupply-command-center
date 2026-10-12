"use client";

import { useEffect, useRef, useState } from "react";

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
 * Sticky below the header on desktop only, at whatever height the header
 * currently occupies: the shell publishes `--lsh-header-offset`, which is
 * the header's height while it is shown and zero once it has hidden on the
 * way down, and the bar transitions between the two at the header's own
 * pace so the two move together. `scroll-mt` on each target section is what
 * keeps the header and this bar from covering a heading a visitor has just
 * jumped to; this component does not scroll anything itself.
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
  const listRef = useRef<HTMLUListElement>(null);

  // On a phone the list is one line that scrolls sideways, so the current
  // section's link is brought into view as the visitor reads down; otherwise
  // the mark could sit off the right edge. Only the row scrolls, never the
  // page, and only when the row actually overflows. The motion comes from
  // the row's CSS scroll-behavior, which the reduced-motion rule switches off.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const link = list.querySelector<HTMLElement>(`a[href="${active}"]`);
    const item = link?.parentElement;
    if (!item) return;
    list.scrollTo({ left: Math.max(0, item.offsetLeft - 20) });
  }, [active]);

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
      className="border-y border-[var(--lsh-rule)] bg-[var(--lsh-paper)] px-5 py-4 transition-[top] duration-300 ease-out motion-reduce:transition-none lg:sticky lg:top-[var(--lsh-header-offset,4.5rem)] lg:z-40 lg:px-8"
    >
      {/*
       * Below the large breakpoint the list is one line that scrolls sideways
       * and runs to the screen's edge, so a cut-off label shows there is
       * more; the label stays put. From lg up it wraps as before. The list is
       * positioned so each item's offset is measured from the list itself.
       */}
      <Container className="flex items-baseline gap-x-5 lg:flex-wrap lg:gap-x-8 lg:gap-y-2">
        <span className="lsh-display shrink-0 text-[10px] text-[var(--lsh-brand-red)]">
          {label}
        </span>
        <ul
          ref={listRef}
          className="lsh-scroll-row relative -mr-5 min-w-0 flex-1 gap-x-6 pr-5 lg:mr-0 lg:flex-none lg:gap-y-1 lg:pr-0"
        >
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
