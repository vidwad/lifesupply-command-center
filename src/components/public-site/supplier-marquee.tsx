import Image from "next/image";

import { SUPPLIER_LOGOS } from "@/lib/public-site/supplier-logos";

/**
 * The brand band at the top of the footer (product owner, 2026-09-13): the
 * logos of brands carried across the operating stores, greyscale on light
 * grey, moving slowly across the screen in an endless loop.
 *
 * The loop is CSS: the track holds the list twice and translates by half its
 * width, so the second copy takes over exactly where the first leaves off.
 * The copy is hidden from assistive technology, so a screen reader hears
 * each brand once. Under `prefers-reduced-motion: reduce` the animation is
 * off, the copy is not rendered at all, and the single list wraps into rows
 * instead; hovering or focusing the band pauses it for anyone else.
 *
 * Every logo comes from the registry, which lists a brand only because the
 * store's own brands directory does. The label says the brands are carried,
 * which is what is verified; it never calls them partners.
 */
const DISPLAY_HEIGHT = 48;

function Track({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden ? "true" : undefined}
      className={`lsh-marquee-track items-center gap-x-14 pr-14 ${
        hidden ? "lsh-marquee-copy" : ""
      }`}
    >
      {SUPPLIER_LOGOS.map((logo) => (
        <li key={logo.slug} className="flex shrink-0 items-center">
          <Image
            src={logo.src}
            alt={hidden ? "" : logo.name}
            width={Math.round((logo.width * DISPLAY_HEIGHT) / logo.height)}
            height={DISPLAY_HEIGHT}
            sizes="200px"
            className="h-9 w-auto opacity-80 sm:h-12"
          />
        </li>
      ))}
    </ul>
  );
}

export function SupplierMarquee({ label }: { label: string }) {
  return (
    <section
      aria-label={label}
      data-supplier-marquee
      className="lsh-marquee border-b border-[var(--lsh-rule)] bg-[var(--lsh-surface)] py-8 text-[var(--lsh-charcoal)]"
    >
      <p className="lsh-display px-5 text-center text-[10px] text-[var(--lsh-muted)] lg:px-8">
        {label}
      </p>
      <div className="lsh-marquee-viewport mt-6 overflow-hidden px-5 lg:px-8">
        <div className="lsh-marquee-belt flex">
          <Track />
          <Track hidden />
        </div>
      </div>
    </section>
  );
}
