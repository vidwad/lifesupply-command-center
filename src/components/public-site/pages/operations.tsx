import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandImage } from "@/components/public-site/brand-image";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { PublicHero, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { Callout } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { OPERATING_BRANDS, brandGeography, type OperatingBrandKey } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
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
                  <article className="group relative flex h-full flex-col p-7">
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
                    <Link
                      href={BRAND_ROUTES[record.key as OperatingBrandKey]}
                      className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)] after:absolute after:inset-0 after:content-['']"
                    >
                      About {record.name}{" "}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </Link>
                  </article>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
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
