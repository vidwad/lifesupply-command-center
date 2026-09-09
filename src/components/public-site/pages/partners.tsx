import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal } from "@/components/public-site/motion";
import {
  BentoGrid,
  Callout,
  IconBadge,
  IconFeatureGrid,
  ProcessSteps,
  SplitSection,
} from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { partners } from "@/lib/public-site/content/partners";
import { CONCEPTUAL_CAPTION } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
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

/** Numbered steps on ink, with icons. */
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
    <ProcessSteps
      eyebrow={eyebrow}
      title={title}
      steps={items.map((step) => ({
        index: step.index,
        title: step.title,
        text: step.text,
        icon: iconForTitle(step.title),
      }))}
    />
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
          <div className="flex items-start justify-between gap-4">
            <Eyebrow as="h2">Boundaries</Eyebrow>
            <IconBadge icon="shield" size={18} />
          </div>
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
      <BentoGrid
        tiles={[
          { eyebrow: hub.eyebrow, graphic: "boardroom", span: "tall" },
          ...hub.relationships.map((relationship) => ({
            title: relationship.title,
            text: relationship.text,
            icon: iconForTitle(relationship.title),
            href: RELATIONSHIP_ROUTES[relationship.route],
            linkLabel: "How it works",
          })),
        ]}
      />
      <Callout
        icon="cart"
        eyebrow={hub.procurement.eyebrow}
        action={<ActionLink action={hub.procurement.action as ActionKey} variant="onLight" />}
      >
        <p className="lsh-display text-2xl leading-[1.1]">{hub.procurement.title}</p>
        <p className="mt-2 text-[var(--lsh-muted)]">{hub.procurement.text}</p>
      </Callout>
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
          <Reveal className="flex gap-5 border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
            <IconBadge icon="shield" />
            <div>
              <Eyebrow as="h2">{c.distinction.title}</Eyebrow>
              <RuleList items={c.distinction.items} />
            </div>
          </Reveal>
        </Container>
      </section>
      <IconFeatureGrid
        eyebrow={c.collaboration.eyebrow}
        title={c.collaboration.title}
        items={c.collaboration.items.map((item) => ({
          title: item.title,
          text: item.text,
          status: item.status,
          icon: iconForTitle(item.title),
        }))}
      />
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
      <IconFeatureGrid
        numbered
        eyebrow={p.model.eyebrow}
        title={p.model.title}
        items={p.model.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
        }))}
      />
      <SplitSection
        tone="onSurface"
        eyebrow="Responsibilities"
        title={p.responsibilities.title}
        graphic="pharmacy"
        side="left"
        caption={CONCEPTUAL_CAPTION}
      >
        <RuleList items={p.responsibilities.items} />
      </SplitSection>
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
      <SplitSection
        eyebrow={s.fit.eyebrow}
        title={s.fit.title}
        graphic="warehouse"
        caption={CONCEPTUAL_CAPTION}
      >
        <p>{s.fit.text}</p>
        <div className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
          <Eyebrow as="h3">{s.requirements.title}</Eyebrow>
          <RuleList items={s.requirements.items} />
        </div>
      </SplitSection>
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
      <IconFeatureGrid
        eyebrow={a.criteria.eyebrow}
        title={a.criteria.title}
        items={a.criteria.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
        }))}
      />
      <SplitSection
        tone="onSurface"
        eyebrow="Structures"
        title={a.structures.title}
        graphic="boardroom"
        side="left"
        caption={CONCEPTUAL_CAPTION}
      >
        <p>{a.structures.text}</p>
      </SplitSection>
      <Steps eyebrow="Process" title={a.process.title} items={a.process.items} />
      <BoundariesClose boundaries={a.boundaries} actions={a.actions} />
    </LifeSupplyLayout>
  );
}
