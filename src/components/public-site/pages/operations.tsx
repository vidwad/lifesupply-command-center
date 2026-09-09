import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandImage } from "@/components/public-site/brand-image";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { PublicHero, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge, IconFeatureGrid } from "@/components/public-site/sections";
import { OPERATING_BRANDS, brandGeography, type OperatingBrandKey } from "@/lib/public-site/brands";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { BRAND_ROUTES } from "@/lib/public-site/routes";

/**
 * Our Businesses hub — the Stage 3 portfolio map (guide §3,
 * `/our-operations/`): brands, published entities, shared capabilities, and
 * developing programs, each kept distinct. Primary action: explore a
 * business. Brand tiles link to the internal brand pages; the store links
 * live on those pages and in the footer.
 */
export function OperationsPage() {
  const { businesses, operations, contact, brand } = LIFE_SUPPLY_CONTENT;
  const { hub } = businesses;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.description}
        actions={<ActionLink action="clinic_solutions" variant="onDark" />}
      />

      {/* How the map is organised. */}
      <section className="px-5 pt-20 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading eyebrow={hub.map.eyebrow} title={hub.map.title} />
          <p className="border-l-4 border-[var(--lsh-brand-red)] pl-6 leading-8 text-[var(--lsh-muted)]">
            {hub.map.text}
          </p>
        </Reveal>
      </section>

      {/* Brands: the four internal brand pages, each with its conceptual photograph. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading eyebrow={hub.brands.eyebrow} title={hub.brands.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {OPERATING_BRANDS.map((record) => (
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

      {/* Entities, as published. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading
              eyebrow={hub.entities.eyebrow}
              title={hub.entities.title}
              description={hub.entities.note}
            />
          </Reveal>
          <Stagger as="ul" className="grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2">
            <StaggerItem as="li" className="flex items-start gap-4 bg-[var(--lsh-paper)] p-6">
              <IconBadge icon="landmark" size={20} />
              <div>
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">Corporate</p>
                <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">
                  {brand.address[0]}
                </p>
              </div>
            </StaggerItem>
            {contact.subsidiaries.map((entity) => (
              <StaggerItem
                key={entity.name}
                as="li"
                className="flex items-start gap-4 bg-[var(--lsh-paper)] p-6"
              >
                <IconBadge icon="building" size={20} />
                <div>
                  <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                    Published entity
                  </p>
                  <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">
                    {entity.name}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Shared capabilities: the approved narrative, unchanged. */}
      <IconFeatureGrid
        tone="onDark"
        numbered
        columns={2}
        eyebrow={hub.capabilities.eyebrow}
        title={hub.capabilities.title}
        description={hub.capabilities.note}
        items={operations.slice(0, 4).map((operation) => ({
          title: operation.title,
          text: operation.description,
          icon: iconForTitle(operation.title),
        }))}
      />

      {/* Developing programs, with status. */}
      <IconFeatureGrid
        columns={2}
        eyebrow={hub.developing.eyebrow}
        title={hub.developing.title}
        items={hub.developing.items.map((item) => ({
          title: item.title,
          text: item.text,
          status: item.status,
          icon: iconForTitle(item.title),
        }))}
      />
    </LifeSupplyLayout>
  );
}
