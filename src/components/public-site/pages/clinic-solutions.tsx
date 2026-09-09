import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink, RelatedActions } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import {
  Callout,
  GraphicBand,
  IconBadge,
  IconFeatureGrid,
  SplitSection,
} from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { getBrand } from "@/lib/public-site/brands";
import { CONCEPTUAL_CAPTION } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { BRAND_ROUTES, STAGE_3_ROUTES } from "@/lib/public-site/routes";

/** The two sentences every Clinic Solutions page leads with. */
function ClinicDistinction() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  return (
    <section className="px-5 py-12 lg:px-8">
      <Reveal className="mx-auto grid max-w-7xl gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-[auto_1fr_1fr] lg:pl-8">
        <IconBadge icon="shield" />
        <p className="leading-7 text-[var(--lsh-charcoal)]">{clinics.distinction}</p>
        <p className="leading-7 text-[var(--lsh-muted)]">{clinics.attribution}</p>
      </Reveal>
    </section>
  );
}

/** A checklist block used by the three children. */
function Checklist({
  title,
  text,
  items,
  icon = "clipboardCheck",
}: {
  title: string;
  text?: string;
  items: readonly string[];
  icon?: string;
}) {
  return (
    <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
      <div className="flex items-start justify-between gap-4">
        <Eyebrow as="h2">{title}</Eyebrow>
        <IconBadge icon={icon} size={18} />
      </div>
      {text ? <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{text}</p> : null}
      <ul className="mt-5 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
        {items.map((item) => (
          <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
            {item}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/** Closing band: the conditional post-opening statement plus the page's actions. */
function ConditionalClose({ actions }: { actions: readonly ActionKey[] }) {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  return (
    <section className="bg-[var(--lsh-ink)] px-5 py-16 text-white lg:px-8">
      <Reveal className="mx-auto flex max-w-7xl flex-col justify-between gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:flex-row lg:items-center lg:pl-8">
        <div className="flex items-start gap-5">
          <IconBadge icon="workflow" tone="onDark" />
          <p className="max-w-2xl leading-7 text-white/80">{clinics.postOpening}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {actions.map((action, index) => (
            <ActionLink key={action} action={action} variant={index === 0 ? "primary" : "onDark"} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/** `/clinic-solutions/` — three needs, routed. */
export function ClinicSolutionsPage() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const { hub } = clinics;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.intro}
        actions={
          <>
            <ActionLink action="plan_clinic" />
            <ActionLink action="clinic_supply_review" variant="onDark" />
          </>
        }
      />
      <ClinicDistinction />
      <IconFeatureGrid
        numbered
        items={hub.needs.map((need) => ({
          title: need.title,
          text: need.text,
          icon: iconForTitle(need.title),
          href: STAGE_3_ROUTES[need.route],
          linkLabel: need.linkLabel,
        }))}
      />
      <GraphicBand
        graphic="examRoom"
        eyebrow={clinics.projects.eyebrow}
        statement={clinics.projects.title}
        action={<ActionLink action="view_clinic_projects" variant="onDark" />}
      />
      <ConditionalClose actions={["plan_clinic", "equipment_quote", "clinic_supply_review"]} />
      <RelatedActions actions={clinics.hub.related} />
    </LifeSupplyLayout>
  );
}

/** `/clinic-solutions/design-build/` */
export function DesignBuildPage() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.designBuild;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.intro}
        actions={<ActionLink action="plan_clinic" />}
      />
      <ClinicDistinction />
      <IconFeatureGrid
        tone="onSurface"
        columns={4}
        eyebrow="Services"
        title={clinics.brandPage.servicesHeading.title}
        description={clinics.geography}
        items={clinics.services.map((service) => ({
          title: service.title,
          text: service.items.join(". ") + ".",
          icon: iconForTitle(service.title),
        }))}
      />
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Checklist
            title={page.consultation.title}
            text={page.consultation.text}
            items={page.consultation.items}
            icon="clipboardList"
          />
          <Reveal className="border border-[var(--lsh-rule)] p-7">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">{clinics.projects.eyebrow}</Eyebrow>
              <IconBadge icon="building" size={18} />
            </div>
            <p className="lsh-display mt-4 text-2xl leading-[1.1] text-[var(--lsh-charcoal)]">
              {clinics.projects.title}
            </p>
            <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{clinics.attribution}</p>
            <Link
              href={BRAND_ROUTES.clinics}
              className="lsh-display mt-6 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]"
            >
              The Clinics process and published projects <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </Reveal>
        </Container>
      </section>
      <ConditionalClose actions={page.actions} />
    </LifeSupplyLayout>
  );
}

/** `/clinic-solutions/equipment/` */
export function EquipmentPage() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.equipment;
  const store = getBrand("lifesupply");
  const clinicCategories = store.categories.filter((category) => /clinic/i.test(category.label));
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.intro}
        actions={<ActionLink action="equipment_quote" />}
      />
      <ClinicDistinction />
      <SplitSection
        tone="onSurface"
        eyebrow="Quote request"
        title={page.quote.title}
        graphic="equipment"
        side="left"
        caption={CONCEPTUAL_CAPTION}
      >
        <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
          {page.quote.items.map((item) => (
            <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
              {item}
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <ActionLink action="equipment_quote" />
        </div>
      </SplitSection>
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="flex gap-5">
            <IconBadge icon="layout" />
            <div>
              <Eyebrow as="h2">{page.catalogue.title}</Eyebrow>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{page.catalogue.text}</p>
            </div>
          </Reveal>
          <Stagger as="ul" className="flex flex-wrap gap-2">
            {clinicCategories.map((category) => (
              <StaggerItem key={category.url} as="li">
                <a
                  href={category.url}
                  target="_blank"
                  rel="noreferrer"
                  className="lsh-display inline-flex items-center gap-1.5 border border-[var(--lsh-rule-strong)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                >
                  {category.label} <ExternalLink size={11} aria-hidden="true" />
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
      <ConditionalClose actions={page.actions} />
    </LifeSupplyLayout>
  );
}

/** `/clinic-solutions/ongoing-supplies/` */
export function OngoingSuppliesPage() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.ongoingSupplies;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.intro}
        actions={<ActionLink action="clinic_supply_review" />}
      />
      <ClinicDistinction />
      <SplitSection
        tone="onSurface"
        eyebrow="Supply categories"
        title={page.available.title}
        graphic="shipping"
        caption={CONCEPTUAL_CAPTION}
      >
        <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)] sm:grid-cols-2">
          {page.available.items.map((item) => (
            <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
              {item}
            </li>
          ))}
        </ul>
      </SplitSection>
      <Callout icon="shield" eyebrow={page.conditional.title} tone="onLight">
        <p>{page.conditional.text}</p>
      </Callout>
      <ConditionalClose actions={page.actions} />
      <RelatedActions actions={clinics.ongoingSupplies.related} />
    </LifeSupplyLayout>
  );
}
