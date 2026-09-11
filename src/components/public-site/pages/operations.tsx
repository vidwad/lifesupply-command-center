import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandImage } from "@/components/public-site/brand-image";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection } from "@/components/public-site/on-this-page";
import { Callout, IconBadge } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { OPERATING_BRANDS, brandGeography, type OperatingBrandKey } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { measurementAttributes } from "@/lib/public-site/measurement";
import { BRAND_ROUTES } from "@/lib/public-site/routes";

/** The three online stores; LifeSupply Clinics has its own section. */
const STORE_KEYS: readonly OperatingBrandKey[] = ["lifesupply", "wellmart", "balkowitsch"];

/**
 * Medical Supply Solutions (`/medical-supply-solutions/`, restructured from
 * Our Businesses on 2026-09-08): the three online stores, each with its
 * photograph, its support channel and its internal page, and the hand-off to
 * Clinic Solutions. The corporate portfolio (entities, capabilities,
 * developing programs) lives on About.
 *
 * Shop & Services merged into the `#stores` section on 2026-09-10 (website
 * consolidation, stage 1). `/shop` permanently redirects here.
 */
export function MedicalSupplySolutionsPage() {
  const { hub } = LIFE_SUPPLY_CONTENT.businesses;
  const stores = OPERATING_BRANDS.filter((record) =>
    STORE_KEYS.includes(record.key as OperatingBrandKey),
  );
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.description}
        actions={
          <>
            <ActionLink action="medical_supply_stores" />
            <ActionLink action="clinic_solutions" variant="onDark" />
          </>
        }
      />

      {/* The stores, each with its conceptual photograph and its own support channel. */}
      <AnchoredSection id="stores" className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow={hub.stores.eyebrow}
              title={hub.stores.title}
              description={hub.stores.intro}
            />
          </Reveal>
          <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
            {stores.map((record) => (
              <StaggerItem key={record.key} className="h-full">
                <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                  <article className="group flex h-full flex-col p-7">
                    <BrandImage
                      brand={record.key as OperatingBrandKey}
                      presentation="square"
                      className="-mx-7 -mt-7 mb-6"
                    />
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {brandGeography(record)}
                    </p>
                    <h3 className="lsh-display mt-4 text-2xl text-[var(--lsh-charcoal)]">
                      {record.name}
                    </h3>
                    <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{record.purpose}</p>
                    {/*
                     * The store's own support channel, carried over from Shop
                     * & Services when it merged in (2026-09-10). A visitor
                     * with an existing order needs the store that took it,
                     * not this site.
                     */}
                    <dl className="mt-5 grid gap-1 text-sm text-[var(--lsh-muted)]">
                      {record.supportPhone ? (
                        <div className="flex gap-2">
                          <dt className="lsh-display text-[10px] text-[var(--lsh-charcoal)]">
                            Support
                          </dt>
                          <dd>{record.supportPhone}</dd>
                        </div>
                      ) : null}
                      {record.supportEmail ? (
                        <div className="flex gap-2">
                          <dt className="lsh-display text-[10px] text-[var(--lsh-charcoal)]">
                            Email
                          </dt>
                          <dd className="break-all">{record.supportEmail}</dd>
                        </div>
                      ) : null}
                    </dl>
                    {/*
                     * The store is the primary action and the brand page the
                     * secondary one (round three, outcome 7). These cards used to
                     * offer only "About", so a visitor who wanted to buy had to
                     * go through a corporate page first. Two explicit links
                     * rather than one card-covering overlay, so both are
                     * reachable by pointer and keyboard alike.
                     */}
                    <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6">
                      <a
                        {...measurementAttributes("brand_destination_click", { brand: record.key })}
                        href={record.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]"
                      >
                        {hub.stores.shopLabel} {record.name}{" "}
                        <ExternalLink
                          size={15}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        />
                      </a>
                      <Link
                        href={BRAND_ROUTES[record.key as OperatingBrandKey]}
                        className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-muted)] transition-colors hover:text-[var(--lsh-charcoal)]"
                      >
                        {hub.stores.aboutLabel} {record.name}{" "}
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>

          {/*
           * Geography, currency and the support boundary: the two things Shop
           * & Services said that the store cards do not, kept at the point
           * where a visitor is choosing between them.
           */}
          <div className="mt-12 grid gap-8 border-t border-[var(--lsh-rule)] pt-10 lg:grid-cols-2">
            <Reveal className="flex gap-5 border-l-4 border-[var(--lsh-brand-red)] pl-6">
              <IconBadge icon="globe" />
              <div>
                <Eyebrow as="h3">{hub.stores.geography.title}</Eyebrow>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">
                  {hub.stores.geography.text}
                </p>
              </div>
            </Reveal>
            <Reveal
              delay={0.05}
              className="flex gap-5 border-l-4 border-[var(--lsh-brand-red)] pl-6"
            >
              <IconBadge icon="shield" />
              <div>
                <Eyebrow as="h3">{hub.stores.support.title}</Eyebrow>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{hub.stores.support.text}</p>
                <div className="mt-5">
                  <ActionLink action="contact_directory" variant="onLight" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </AnchoredSection>

      {/*
       * A distinct route for professional buyers (round three, outcome 7).
       * What a supply review covers is stated from verified capability, and
       * what it does not create is stated beside it.
       */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="min-w-0">
          <Reveal>
            <SectionHeading
              eyebrow={hub.procurement.eyebrow}
              title={hub.procurement.title}
              description={hub.procurement.text}
            />
          </Reveal>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-6">
              <Eyebrow as="h3">What a supply review covers</Eyebrow>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {hub.procurement.covers.map((item) => (
                  <li key={item} className="lsh-bullet">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-6 text-[var(--lsh-muted)]">
                {hub.procurement.clinicPointer}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {hub.procurement.actions.map((action, index) => (
                  <ActionLink
                    key={action}
                    action={action as ActionKey}
                    variant={index === 0 ? "primary" : "onLight"}
                  />
                ))}
              </div>
            </Reveal>
            <Reveal
              delay={0.05}
              className="flex gap-5 border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-paper)] p-6"
            >
              <IconBadge icon="shield" size={18} />
              <div>
                <Eyebrow as="h3">What stays with the store</Eyebrow>
                <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                  {hub.procurement.limit}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Clinic projects and clinic supply have their own section. */}
      <Callout
        icon="building"
        eyebrow={hub.clinics.eyebrow}
        action={<ActionLink action={hub.clinics.action as ActionKey} variant="onLight" />}
      >
        <p className="lsh-display text-2xl leading-[1.1]">{hub.clinics.title}</p>
        <p className="mt-2 text-[var(--lsh-muted)]">{hub.clinics.text}</p>
      </Callout>
      {/* Selling to LifeSupply: the suppliers page, which has no menu category. */}
      <Callout
        icon="truck"
        eyebrow={hub.suppliers.eyebrow}
        tone="onLight"
        action={<ActionLink action={hub.suppliers.action as ActionKey} variant="onLight" />}
      >
        <p className="lsh-display text-2xl leading-[1.1]">{hub.suppliers.title}</p>
        <p className="mt-2 text-[var(--lsh-muted)]">{hub.suppliers.text}</p>
      </Callout>
    </LifeSupplyLayout>
  );
}
