import Link from "next/link";

import { Container, Eyebrow, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";

/**
 * The eight metabolic pathways side by side, so a visitor can compare them
 * without opening eight pages (round two, 2026-09-10).
 *
 * Every value comes from the pathway's own entry in the content model; this
 * component adds no claim. A table from `lg` up and one card per pathway
 * below it, from the same data, so the comparison survives a phone. Each
 * row names its status, and the closing note says the pathways overlap on
 * purpose and that starter equipment is chosen once rather than replenished.
 */
type Pathway = {
  id: string;
  slug: string;
  label: string;
  audience: string;
  purpose: string;
  roles: string;
  status: string;
  /** The pathway's own page. Every name here is the way into its detail. */
  href: string;
};

type Comparison = {
  eyebrow: string;
  title: string;
  intro: string;
  labels: { audience: string; purpose: string; role: string; status: string };
  note: string;
};

export function PathwayComparison({
  comparison,
  pathways,
}: {
  comparison: Comparison;
  pathways: readonly Pathway[];
}) {
  const fields = (p: Pathway) =>
    [
      [comparison.labels.audience, p.audience],
      [comparison.labels.purpose, p.purpose],
      [comparison.labels.role, p.roles],
      [comparison.labels.status, p.status],
    ] as const;

  return (
    <section className="px-5 py-20 lg:px-8">
      <Container className="min-w-0">
        <Reveal>
          <SectionHeading
            eyebrow={comparison.eyebrow}
            title={comparison.title}
            description={comparison.intro}
          />
        </Reveal>

        <Stagger as="ul" className="mt-10 grid gap-4 sm:grid-cols-2 lg:hidden">
          {pathways.map((p) => (
            <StaggerItem
              as="li"
              key={p.slug}
              className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-5"
            >
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{p.id}</p>
              <h3 className="lsh-display mt-1 text-lg leading-tight text-[var(--lsh-charcoal)]">
                <Link href={p.href} className="transition-colors hover:text-[var(--lsh-brand-red)]">
                  {p.label}
                </Link>
              </h3>
              <dl className="mt-4 grid gap-3">
                {fields(p).map(([label, value]) => (
                  <div key={label}>
                    <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{label}</dt>
                    <dd className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 hidden min-w-0 overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="lsh-display align-bottom text-[10px] text-[var(--lsh-brand-red)]">
                <th scope="col" className="border-b border-[var(--lsh-rule-strong)] py-3 pr-4">
                  Pathway
                </th>
                {Object.values(comparison.labels).map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="border-b border-[var(--lsh-rule-strong)] py-3 pr-4"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pathways.map((p) => (
                <tr key={p.slug} className="align-top">
                  <th
                    scope="row"
                    className="border-b border-[var(--lsh-rule)] py-4 pr-4 font-medium text-[var(--lsh-charcoal)]"
                  >
                    <Link
                      href={p.href}
                      className="transition-colors hover:text-[var(--lsh-brand-red)]"
                    >
                      {p.label}
                    </Link>
                    <span className="mt-1 block text-xs font-normal text-[var(--lsh-muted)]">
                      {p.id}
                    </span>
                  </th>
                  {fields(p).map(([label, value]) => (
                    <td
                      key={label}
                      className="border-b border-[var(--lsh-rule)] py-4 pr-4 text-[var(--lsh-muted)]"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <Reveal className="mt-8 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-5">
          <Eyebrow as="h3">How to read this</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{comparison.note}</p>
        </Reveal>
      </Container>
    </section>
  );
}
