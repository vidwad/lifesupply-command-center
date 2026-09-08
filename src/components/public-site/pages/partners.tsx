import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import type { ActionKey } from "@/lib/public-site/actions";
import { partners } from "@/lib/public-site/content/partners";
import { STAGE_5_ROUTES } from "@/lib/public-site/routes";

const RELATIONSHIP_ROUTES = {
  clinics: STAGE_5_ROUTES.partnerClinics,
  pharmacies: STAGE_5_ROUTES.partnerPharmacies,
  suppliers: STAGE_5_ROUTES.partnerSuppliers,
  acquisitions: STAGE_5_ROUTES.partnerAcquisitions,
} as const;

/** Bulleted rules in the house style. */
function RuleList({ items, tone = "red" }: { items: readonly string[]; tone?: "red" | "ink" }) {
  const border = tone === "red" ? "border-[var(--lsh-brand-red)]" : "border-[var(--lsh-charcoal)]";
  return (
    <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
      {items.map((item) => (
        <li key={item} className={`border-l-2 ${border} pl-3`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps on ink. */
function Steps({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: readonly { index: string; title: string; text: string }[];
}) {
  return (
    <section className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading tone="onDark" eyebrow={eyebrow} title={title} />
        </Reveal>
        <Stagger className="mt-12 grid gap-px bg-white/15 md:grid-cols-2 xl:grid-cols-4">
          {items.map((step) => (
            <StaggerItem key={step.index} as="article" className="bg-[var(--lsh-charcoal)] p-8">
              <p className="lsh-display text-sm text-[var(--lsh-red-on-ink)]">{step.index}</p>
              <h3 className="lsh-display mt-3 text-2xl">{step.title}</h3>
              <p className="mt-3 leading-7 text-white/75">{step.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/** Boundaries plus the page's actions. */
function BoundariesClose({
  boundaries,
  actions,
}: {
  boundaries: readonly string[];
  actions: readonly string[];
}) {
  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
      <Container className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <Reveal className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-paper)] p-7">
          <Eyebrow as="h2">Boundaries</Eyebrow>
          <RuleList items={boundaries} tone="ink" />
        </Reveal>
        <Reveal className="flex flex-wrap gap-3 lg:justify-end">
          {actions.map((action, index) => (
            <ActionLink
              key={action}
              action={action as ActionKey}
              variant={index === 0 ? "primary" : "onLight"}
            />
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

/** `/partners/` */
export function PartnersPage() {
  const { hub } = partners;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={hub.eyebrow} title={hub.title} description={hub.intro} />
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {hub.relationships.map((relationship) => (
              <StaggerItem key={relationship.key} className="h-full">
                <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                  <Link
                    href={RELATIONSHIP_ROUTES[relationship.route]}
                    className="group flex h-full flex-col p-7"
                  >
                    <h2 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)]">
                      {relationship.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                      {relationship.text}
                    </p>
                    <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]">
                      How it works{" "}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </span>
                  </Link>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] pl-6">
            <Eyebrow as="h2">{hub.procurement.eyebrow}</Eyebrow>
            <h3 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">
              {hub.procurement.title}
            </h3>
            <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{hub.procurement.text}</p>
          </Reveal>
          <Reveal className="flex lg:justify-end">
            <ActionLink action={hub.procurement.action as ActionKey} variant="onLight" />
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/partners/clinics/` */
export function PartnerClinicsPage() {
  const c = partners.clinics;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.intro}
        actions={<ActionLink action="clinic_collaboration" />}
      />
      <section className="px-5 py-16 lg:px-8">
        <Container>
          <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
            <Eyebrow as="h2">{c.distinction.title}</Eyebrow>
            <RuleList items={c.distinction.items} />
          </Reveal>
        </Container>
      </section>
      <section className="px-5 pb-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={c.collaboration.eyebrow} title={c.collaboration.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {c.collaboration.items.map((item) => (
              <StaggerItem key={item.title} as="article" className="bg-[var(--lsh-paper)] p-7">
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{item.status}</p>
                <h3 className="lsh-display mt-3 text-xl text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
      <BoundariesClose boundaries={c.boundaries} actions={c.actions} />
    </LifeSupplyLayout>
  );
}

/** `/partners/pharmacies/` */
export function PartnerPharmaciesPage() {
  const p = partners.pharmacies;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={p.eyebrow}
        title={p.title}
        description={p.intro}
        actions={<ActionLink action="discuss_program" />}
      />
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={p.model.eyebrow} title={p.model.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {p.model.items.map((item, index) => (
              <StaggerItem key={item.title} as="article" className="bg-[var(--lsh-surface)] p-7">
                <p className="lsh-display text-sm text-[var(--lsh-brand-red)]">0{index + 1}</p>
                <h3 className="lsh-display mt-3 text-xl text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
            <Eyebrow as="h2">{p.responsibilities.title}</Eyebrow>
            <RuleList items={p.responsibilities.items} />
          </Reveal>
        </Container>
      </section>
      <BoundariesClose boundaries={p.boundaries} actions={p.actions} />
    </LifeSupplyLayout>
  );
}

/** `/partners/suppliers/` */
export function PartnerSuppliersPage() {
  const s = partners.suppliers;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={s.eyebrow}
        title={s.title}
        description={s.intro}
        actions={<ActionLink action="supplier_inquiry" />}
      />
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow={s.fit.eyebrow} title={s.fit.title} description={s.fit.text} />
          </Reveal>
          <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
            <Eyebrow as="h2">{s.requirements.title}</Eyebrow>
            <RuleList items={s.requirements.items} />
          </Reveal>
        </Container>
      </section>
      <Steps eyebrow="Process" title={s.process.title} items={s.process.items} />
      <BoundariesClose boundaries={s.boundaries} actions={s.actions} />
    </LifeSupplyLayout>
  );
}

/** `/partners/acquisitions/` */
export function PartnerAcquisitionsPage() {
  const a = partners.acquisitions;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={a.eyebrow}
        title={a.title}
        description={a.intro}
        actions={<ActionLink action="acquisition_inquiry" />}
      />
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={a.criteria.eyebrow} title={a.criteria.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {a.criteria.items.map((item) => (
              <StaggerItem key={item.title} as="article" className="bg-[var(--lsh-surface)] p-7">
                <h3 className="lsh-display text-xl text-[var(--lsh-charcoal)]">{item.title}</h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 border-l-4 border-[var(--lsh-brand-red)] pl-6">
            <Eyebrow as="h2">{a.structures.title}</Eyebrow>
            <p className="mt-3 max-w-3xl leading-7 text-[var(--lsh-muted)]">{a.structures.text}</p>
          </Reveal>
        </Container>
      </section>
      <Steps eyebrow="Process" title={a.process.title} items={a.process.items} />
      <BoundariesClose boundaries={a.boundaries} actions={a.actions} />
    </LifeSupplyLayout>
  );
}
