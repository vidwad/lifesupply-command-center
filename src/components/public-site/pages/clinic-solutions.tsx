import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

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
import { getBrand } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { BRAND_ROUTES, STAGE_3_ROUTES } from "@/lib/public-site/routes";

/** The two sentences every Clinic Solutions page leads with. */
function ClinicDistinction() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  return (
    <section className="px-5 py-12 lg:px-8">
      <Reveal className="mx-auto grid max-w-7xl gap-4 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-2 lg:pl-8">
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
}: {
  title: string;
  text?: string;
  items: readonly string[];
}) {
  return (
    <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
      <Eyebrow as="h2">{title}</Eyebrow>
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
        <p className="max-w-2xl leading-7 text-white/80">{clinics.postOpening}</p>
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
      <section className="px-5 pb-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-px bg-[var(--lsh-rule)] lg:grid-cols-3">
          {hub.needs.map((need) => (
            <StaggerItem key={need.index} className="h-full">
              <SpotlightCard
                as="article"
                className="group flex h-full flex-col bg-[var(--lsh-paper)] p-8"
              >
                <p className="lsh-display text-sm text-[var(--lsh-brand-red)]">{need.index}</p>
                <span
                  className="mt-3 block h-1 w-8 bg-[var(--lsh-brand-red)] transition-[width] duration-300 group-hover:w-16 motion-reduce:transition-none"
                  aria-hidden="true"
                />
                <h2 className="lsh-display mt-6 text-2xl text-[var(--lsh-charcoal)]">
                  {need.title}
                </h2>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{need.text}</p>
                <Link
                  href={STAGE_3_ROUTES[need.route]}
                  className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]"
                >
                  {need.linkLabel}{" "}
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </Link>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      <ConditionalClose actions={["plan_clinic", "equipment_quote", "clinic_supply_review"]} />
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
      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <SectionHeading
                eyebrow="Service geography and roles"
                title="British Columbia, with core partners."
                description={clinics.geography}
              />
            </Reveal>
            <Stagger className="mt-8 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2">
              {clinics.services.map((service) => (
                <StaggerItem key={service.title} as="article" className="bg-[var(--lsh-paper)] p-6">
                  <h3 className="lsh-display text-xl text-[var(--lsh-charcoal)]">
                    {service.title}
                  </h3>
                  <ul className="mt-3 grid gap-1.5 text-sm leading-6 text-[var(--lsh-muted)]">
                    {service.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal className="mt-8">
              <Link
                href={BRAND_ROUTES.clinics}
                className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]"
              >
                The Clinics process and published projects{" "}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
          <Checklist
            title={page.consultation.title}
            text={page.consultation.text}
            items={page.consultation.items}
          />
        </div>
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
      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <Checklist title={page.quote.title} items={page.quote.items} />
          <Reveal className="border border-[var(--lsh-rule)] p-7">
            <Eyebrow as="h2">{page.catalogue.title}</Eyebrow>
            <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{page.catalogue.text}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {clinicCategories.map((category) => (
                <li key={category.url}>
                  <a
                    href={category.url}
                    target="_blank"
                    rel="noreferrer"
                    className="lsh-display inline-flex items-center gap-1.5 border border-[var(--lsh-rule-strong)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                  >
                    {category.label} <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
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
      <section className="px-5 pb-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-2">
          <Checklist title={page.available.title} items={page.available.items} />
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-7">
            <Eyebrow as="h2">{page.conditional.title}</Eyebrow>
            <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{page.conditional.text}</p>
          </Reveal>
        </Container>
      </section>
      <ConditionalClose actions={page.actions} />
    </LifeSupplyLayout>
  );
}
