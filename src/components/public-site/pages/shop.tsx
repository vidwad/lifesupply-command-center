import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import type { ActionKey } from "@/lib/public-site/actions";
import { brandGeography, getBrand, type BrandKey } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * Shop & Services (`/shop/`, Stage 3): four choices with geography, currency,
 * destination, and support boundary. The URL is kept; nothing is sold here.
 */
export function ShopServicesPage() {
  const { shop } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={shop.eyebrow} title={shop.title} description={shop.intro} />

      <section className="px-5 py-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          {shop.choices.map((choice) => {
            const record = getBrand(choice.brand as BrandKey);
            return (
              <StaggerItem key={choice.brand} className="h-full">
                <SpotlightCard
                  as="article"
                  className="lsh-lift flex h-full flex-col border border-t-4 border-[var(--lsh-rule)] border-t-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-7"
                >
                  <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                    {brandGeography(record)}
                  </p>
                  <h2 className="lsh-display mt-4 text-2xl text-[var(--lsh-charcoal)]">
                    {record.name}
                  </h2>
                  <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{choice.role}</p>
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
                  <div className="mt-auto pt-6">
                    <ActionLink action={choice.action as ActionKey} />
                  </div>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-2">
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] pl-6">
            <Eyebrow as="h2">{shop.geography.title}</Eyebrow>
            <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{shop.geography.text}</p>
          </Reveal>
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] pl-6">
            <Eyebrow as="h2">{shop.support.title}</Eyebrow>
            <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{shop.support.text}</p>
            <div className="mt-5">
              <ActionLink action="contact_directory" variant="onLight" />
            </div>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
