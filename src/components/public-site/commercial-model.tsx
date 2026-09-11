import { ChevronDown } from "lucide-react";

import { Container, Eyebrow, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";

/**
 * The proposed supply and service model (round two, 2026-09-10; drafted with
 * Codex against the evidence register). Re-cut in round four, change 3.
 *
 * It used to be a single seven-column table: Category, Contracting party, What
 * is provided, Revenue type, Frequency, Status, Provider retains. Everything in
 * it was true and useful, and a business reader met all of it at once, which
 * is a specification rather than an explanation.
 *
 * There are two layers now. The summary answers the three questions a reader
 * has first — who contracts, what they get, and whether it exists yet — as
 * four cards. The rest sits behind a disclosure: revenue type, frequency, and
 * what the clinical or pharmacy provider keeps. Nothing was dropped and
 * nothing is duplicated, so there is no second copy to drift.
 *
 * The disclosure is a native `details`, which needs no JavaScript, carries its
 * own semantics, and can be opened before the content is judged. Inside it,
 * a semantic table from `md` up and labelled stacked entries below.
 */
type Model = {
  eyebrow: string;
  title: string;
  intro: string;
  labels: {
    customer: string;
    provided: string;
    revenue: string;
    frequency: string;
    status: string;
    retained: string;
  };
  rows: readonly {
    category: string;
    customer: string;
    provided: string;
    revenue: string;
    frequency: string;
    status: string;
    retained: string;
  }[];
  note: string;
};

export function CommercialModel({ model }: { model: Model }) {
  const detailLabels = [model.labels.revenue, model.labels.frequency, model.labels.retained];
  const detailFields = (row: Model["rows"][number]) =>
    [
      [model.labels.revenue, row.revenue],
      [model.labels.frequency, row.frequency],
      [model.labels.retained, row.retained],
    ] as const;

  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
      <Container className="min-w-0">
        <Reveal>
          <SectionHeading eyebrow={model.eyebrow} title={model.title} description={model.intro} />
        </Reveal>

        {/* The summary: who contracts, what they get, whether it exists yet. */}
        <Stagger as="ul" className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
          {model.rows.map((row) => (
            <StaggerItem as="li" key={row.category} className="flex h-full flex-col">
              <span aria-hidden="true" className="block h-1 w-full bg-[var(--lsh-brand-red)]" />
              <h3 className="lsh-display mt-5 text-xl leading-none text-[var(--lsh-charcoal)]">
                {row.category}
              </h3>
              <dl className="mt-5 grid gap-4">
                {(
                  [
                    [model.labels.customer, row.customer],
                    [model.labels.provided, row.provided],
                    [model.labels.status, row.status],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{label}</dt>
                    <dd className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </StaggerItem>
          ))}
        </Stagger>

        {/* The detail, one level down. */}
        <Reveal className="mt-10 min-w-0">
          <details className="group border-t border-[var(--lsh-rule-strong)]">
            <summary className="lsh-display flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:text-[var(--lsh-brand-red)] [&::-webkit-details-marker]:hidden">
              Revenue, frequency, and what the provider keeps
              <ChevronDown
                size={18}
                aria-hidden="true"
                className="shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>

            {/* Phones: one labelled block per category. */}
            <ul className="grid gap-6 pb-6 md:hidden">
              {model.rows.map((row) => (
                <li key={row.category} className="lsh-bullet">
                  <p className="lsh-display text-sm text-[var(--lsh-charcoal)]">{row.category}</p>
                  <dl className="mt-3 grid gap-3">
                    {detailFields(row).map(([label, value]) => (
                      <div key={label}>
                        <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                          {label}
                        </dt>
                        <dd className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>

            {/* From md up: the same content as a four-column table. */}
            <div className="hidden min-w-0 overflow-x-auto pb-6 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Revenue type, frequency, and what the clinical or pharmacy provider retains, by
                  category
                </caption>
                <thead>
                  <tr className="lsh-display align-bottom text-[10px] text-[var(--lsh-brand-red)]">
                    <th scope="col" className="border-b border-[var(--lsh-rule-strong)] py-3 pr-4">
                      Category
                    </th>
                    {detailLabels.map((label) => (
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
                  {model.rows.map((row) => (
                    <tr key={row.category} className="align-top">
                      <th
                        scope="row"
                        className="border-b border-[var(--lsh-rule)] py-4 pr-4 font-medium text-[var(--lsh-charcoal)]"
                      >
                        {row.category}
                      </th>
                      {detailFields(row).map(([label, value]) => (
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
            </div>
          </details>
        </Reveal>

        <Reveal className="mt-8 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-5">
          <Eyebrow as="h3">Status</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{model.note}</p>
        </Reveal>
      </Container>
    </section>
  );
}
