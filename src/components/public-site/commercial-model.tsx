import { Container, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { SupplyModelDiagram } from "@/components/public-site/supply-model-diagram";

/**
 * The proposed supply and service model, in the customer's terms.
 *
 * Round two drafted this as a seven-column table; round four cut it to four
 * cards over a disclosure. On 2026-09-11 it became the page's one description
 * of the four parts: the offer section that preceded it described the same
 * four, and this one's labels - "Contracting party", "Revenue type" - were
 * the voice of an investor document rather than a page for a prospective
 * clinic or pharmacy (product owner).
 *
 * The diagram states the distinction that mattered in the old table, store
 * purchasing against a contracted service, before any word is read. Each
 * card then answers what it covers, who orders, on what arrangement, and
 * whether it exists yet. Nothing is priced and nothing is duplicated.
 */
type Kind = "store" | "service";

type Model = {
  eyebrow: string;
  title: string;
  intro: string;
  kinds: Record<Kind, { title: string; status: string }>;
  labels: {
    purpose: string;
    customer: string;
    arrangement: string;
    status: string;
    retained: string;
  };
  items: readonly {
    key: string;
    kind: Kind;
    title: string;
    summary: string;
    purpose: string;
    customer: string;
    arrangement: string;
    status: string;
    retained: string;
  }[];
  note: string;
};

export function CommercialModel({ model }: { model: Model }) {
  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
      <Container className="min-w-0">
        <Reveal>
          <SectionHeading eyebrow={model.eyebrow} title={model.title} description={model.intro} />
        </Reveal>

        <Reveal delay={0.05} className="mt-12">
          <SupplyModelDiagram model={model} />
        </Reveal>

        {/* One card per part: what it covers, who orders, the arrangement, the status. */}
        <Stagger
          as="ul"
          className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-2 lg:-mx-8 xl:grid-cols-4"
        >
          {model.items.map((item) => (
            <StaggerItem as="li" key={item.key} className="h-full bg-[var(--lsh-paper)] p-5 lg:p-8">
              <span
                className={`lsh-display px-2 py-1 text-[10px] ${
                  item.kind === "service"
                    ? "border border-dashed border-[var(--lsh-rule-strong)] text-[var(--lsh-muted)]"
                    : "border border-[var(--lsh-charcoal)] text-[var(--lsh-charcoal)]"
                }`}
              >
                {model.kinds[item.kind].title}
              </span>
              <h3 className="mt-4 text-xl leading-tight text-[var(--lsh-charcoal)]">
                {item.title}
              </h3>
              <dl className="mt-4 grid gap-4">
                {(
                  [
                    [model.labels.purpose, item.purpose],
                    [model.labels.customer, item.customer],
                    [model.labels.arrangement, item.arrangement],
                    [model.labels.status, item.status],
                    [model.labels.retained, item.retained],
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
      </Container>
    </section>
  );
}
