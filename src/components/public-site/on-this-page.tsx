import { Container } from "@/components/public-site/lifesupply-primitives";

/**
 * Compact section navigation for the consolidated Solutions pages
 * (consolidation stage 1, 2026-09-10).
 *
 * Each Solutions page is now one long page rather than a hub and several
 * children, so a reader needs to see its shape and jump into it. Plain anchor
 * links: they work with JavaScript disabled, they are real text for a screen
 * reader, and the browser's own fragment handling does the scrolling.
 *
 * The `scroll-mt` on each target section, not here, is what keeps the sticky
 * header from covering a heading a visitor has just jumped to.
 */
export function OnThisPage({
  items,
  label = "On this page",
}: {
  items: readonly { href: string; label: string }[];
  label?: string;
}) {
  return (
    <nav aria-label={label} className="border-y border-[var(--lsh-rule)] px-5 py-5 lg:px-8">
      <Container className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
        <span className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{label}</span>
        <ul className="flex flex-wrap gap-x-7 gap-y-2">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="lsh-display text-[11px] text-[var(--lsh-muted)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:text-[var(--lsh-brand-red)] hover:decoration-[var(--lsh-brand-red)]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

/**
 * A section a fragment link can land on. `scroll-mt-24` clears the sticky
 * header so the heading is not hidden under it after a jump, and the id is
 * on the section itself so the whole block is the target rather than a
 * heading floating above its own content.
 */
export function AnchoredSection({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`.trim()}>
      {children}
    </section>
  );
}
