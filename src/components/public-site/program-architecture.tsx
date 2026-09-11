import Link from "next/link";

import { Container, Eyebrow, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import type { architecture as Architecture } from "@/lib/public-site/content/architecture";

/**
 * The three tiers of the business in one view (round three, outcome 3):
 * operating, in development, under evaluation.
 *
 * Built as a typeset block rather than a raster diagram, so every label is
 * real text: it reads on a phone, it is selectable, it translates, and a
 * screen reader gets the same structure a sighted reader does. One column per
 * tier from `lg` up, stacked below that, with the status carried as a badge on
 * each tier rather than repeated on every item. Items that have a page of
 * their own link to it.
 */
export function ProgramArchitecture({ content }: { content: typeof Architecture }) {
  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
      <Container className="min-w-0">
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.intro}
          />
        </Reveal>

        <Stagger as="ul" className="mt-10 grid items-start gap-5 lg:grid-cols-3">
          {content.tiers.map((tier) => (
            <StaggerItem
              as="li"
              key={tier.status}
              className="flex h-full min-w-0 flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-6"
            >
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                {content.statusLabel}
              </p>
              <h3 className="lsh-display mt-1 text-2xl leading-tight text-[var(--lsh-charcoal)]">
                {tier.status}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{tier.meaning}</p>

              <ul className="mt-5 grid gap-4 border-t border-[var(--lsh-rule)] pt-5">
                {tier.items.map((item) => (
                  <li key={item.title} className="lsh-bullet">
                    <h4 className="lsh-display text-base leading-tight text-[var(--lsh-charcoal)]">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="transition-colors hover:text-[var(--lsh-brand-red)]"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-6">
            <Eyebrow as="h3">{content.note.title}</Eyebrow>
            <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{content.note.text}</p>
          </Reveal>
          <Reveal
            delay={0.05}
            className="border-l-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-paper)] p-6"
          >
            <Eyebrow as="h3">{content.principle.title}</Eyebrow>
            <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
              {content.principle.text}
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
