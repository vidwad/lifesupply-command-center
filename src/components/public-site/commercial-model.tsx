import { Container, Eyebrow, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";

/**
 * The proposed supply and service model, in one place, so a business reader
 * does not have to reconstruct it from several pages (round two, 2026-09-10;
 * drafted with Codex against the evidence register).
 *
 * A table from md up, one card per category below that, both from the same
 * content. The table is the comparison; the cards repeat every field with
 * its own label so nothing depends on remembering a column heading. Every
 * row states its status and what the clinical or pharmacy provider keeps,
 * and the closing line says the model is proposed and establishes no
 * contract or integration. No price, percentage or volume appears.
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
  const fields = (row: Model["rows"][number]) =>
    [
      [model.labels.customer, row.customer],
      [model.labels.provided, row.provided],
      [model.labels.revenue, row.revenue],
      [model.labels.frequency, row.frequency],
      [model.labels.status, row.status],
      [model.labels.retained, row.retained],
    ] as const;

  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
      <Container className="min-w-0">
        <Reveal>
          <SectionHeading eyebrow={model.eyebrow} title={model.title} description={model.intro} />
        </Reveal>

        {/* Phones and small tablets: one card per category. */}
        <Stagger as="ul" className="mt-10 grid gap-4 lg:hidden">
          {model.rows.map((row) => (
            <StaggerItem
              as="li"
              key={row.category}
              className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-6"
            >
              <h3 className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                {row.category}
              </h3>
              <dl className="mt-4 grid gap-3">
                {fields(row).map(([label, value]) => (
                  <div key={label}>
                    <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{label}</dt>
                    <dd className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Desktop: the same content as a comparison table. */}
        <Reveal className="mt-10 hidden min-w-0 overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="lsh-display align-bottom text-[10px] text-[var(--lsh-brand-red)]">
                <th scope="col" className="border-b border-[var(--lsh-rule-strong)] py-3 pr-4">
                  Category
                </th>
                {Object.values(model.labels).map((label) => (
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
                  {fields(row).map(([label, value]) => (
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

        <Reveal className="mt-8 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-5">
          <Eyebrow as="h3">Status</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{model.note}</p>
        </Reveal>
      </Container>
    </section>
  );
}
