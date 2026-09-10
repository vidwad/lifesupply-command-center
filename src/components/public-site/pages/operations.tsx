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
import { Callout, IconBadge } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { OPERATING_BRANDS, brandGeography, type OperatingBrandKey } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { measurementAttributes } from "@/lib/public-site/measurement";
import { BRAND_ROUTES } from "@/lib/public-site/routes";

/** The three online stores; LifeSupply Clinics has its own section. */
const STORE_KEYS: readonly OperatingBrandKey[] = ["lifesupply", "wellmart", "balkowitsch"];

/**
 * Medical Supply Solutions hub (`/medical-supply-solutions/`, restructured
 * from Our Businesses on 2026-09-08): the three online stores, each with its
 * photograph and internal page, and the hand-offs to Clinic Solutions and
 * Shop & Services. The corporate portfolio (entities, capabilities,
 * developing programs) now lives on About.
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
            <ActionLink action="shop_services" />
            <ActionLink action="clinic_solutions" variant="onDark" />
          </>
        }
      />

      {/* The stores, each with its conceptual photograph. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading eyebrow={hub.stores.eyebrow} title={hub.stores.title} />
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
        </div>
      </section>

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
                  <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <ActionLink action={hub.procurement.action as ActionKey} />
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

      {/* Choosing a store. */}
      <Callout
        icon="globe"
        eyebrow={hub.services.eyebrow}
        tone="onLight"
        action={<ActionLink action={hub.services.action as ActionKey} variant="onLight" />}
      >
        <p className="lsh-display text-2xl leading-[1.1]">{hub.services.title}</p>
        <p className="mt-2 text-[var(--lsh-muted)]">{hub.services.text}</p>
      </Callout>
    </LifeSupplyLayout>
  );
}
