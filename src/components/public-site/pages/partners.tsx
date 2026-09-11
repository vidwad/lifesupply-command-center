import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal } from "@/components/public-site/motion";
import {
  BentoGrid,
  Callout,
  IconFeatureGrid,
  ProcessSteps,
  SplitSection,
} from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { partners } from "@/lib/public-site/content/partners";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { STAGE_3_ROUTES, STAGE_5_ROUTES, sectionRoute } from "@/lib/public-site/routes";

/**
 * Where each relationship is described. Clinic collaboration moved onto the
 * Clinic Solutions page as a section on 2026-09-10 (website consolidation,
 * stage 1), so the hub sends a visitor to that section rather than keeping a
 * page whose only job was to repeat the clinic context.
 */
const RELATIONSHIP_ROUTES = {
  clinics: sectionRoute(STAGE_3_ROUTES.clinicSolutions, "collaboration"),
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

/** The page's actions, closing the page. */
function ActionsClose({ actions }: { actions: readonly string[] }) {
  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
      <Container>
        <Reveal className="flex flex-wrap gap-3">
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
      >
        <RuleList items={p.responsibilities.items} />
      </SplitSection>
      <ActionsClose actions={p.actions} />
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
      <SplitSection eyebrow={s.fit.eyebrow} title={s.fit.title} graphic="warehouse">
        <p>{s.fit.text}</p>
        <div className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
          <Eyebrow as="h3">{s.requirements.title}</Eyebrow>
          <RuleList items={s.requirements.items} />
        </div>
      </SplitSection>
      <Steps eyebrow="Process" title={s.process.title} items={s.process.items} />
      <ActionsClose actions={s.actions} />
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
      >
        <p>{a.structures.text}</p>
      </SplitSection>
      <Steps eyebrow="Process" title={a.process.title} items={a.process.items} />
      <ActionsClose actions={a.actions} />
    </LifeSupplyLayout>
  );
}
