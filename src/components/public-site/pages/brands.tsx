import { ExternalLink, Mail, Phone } from "lucide-react";

import { ActionLink, RelatedActions } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge, SplitSection } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { brandGeography, getBrand, type BrandRecord } from "@/lib/public-site/brands";
import { BRAND_GRAPHICS, CONCEPTUAL_CAPTION, type GraphicKey } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/** The photograph each store page carries beside its audience statement. */
const STORE_GRAPHICS: Record<"lifesupply" | "wellmart" | "balkowitsch", GraphicKey> = {
  lifesupply: BRAND_GRAPHICS.lifesupply,
  wellmart: BRAND_GRAPHICS.wellmart,
  balkowitsch: BRAND_GRAPHICS.balkowitsch,
};

/** Verified category chips from the registry. */
function CategoryLinks({ record }: { record: BrandRecord }) {
  return (
    <Stagger as="ul" className="flex flex-wrap gap-2">
      {record.categories.map((category) => (
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
  );
}

/** A brand's own support channel and policy pages, as published. Shared with Clinic Solutions. */
export function ServiceChannels({
  record,
  title,
  text,
}: {
  record: BrandRecord;
  title: string;
  text: string;
}) {
  return (
    <Reveal className="border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
      <div className="flex items-start justify-between gap-4">
        <Eyebrow as="h2">{title}</Eyebrow>
        <IconBadge icon="mail" size={18} />
      </div>
      <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{text}</p>
      <ul className="mt-5 grid gap-2 text-sm text-[var(--lsh-charcoal)]">
        {record.supportPhone ? (
          <li>
            <a
              href={telHref(record.supportPhone)}
              className="inline-flex items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
            >
              <Phone size={14} aria-hidden="true" /> {record.supportPhone}
            </a>
          </li>
        ) : null}
        {record.supportEmail ? (
          <li>
            <a
              href={`mailto:${record.supportEmail}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
            >
              <Mail size={14} aria-hidden="true" /> {record.supportEmail}
            </a>
          </li>
        ) : null}
        {record.supportHours ? (
          <li className="text-[var(--lsh-muted)]">Hours: {record.supportHours}</li>
        ) : null}
        {record.supportUrl ? (
          <li>
            <a
              href={record.supportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:text-[var(--lsh-brand-red)]"
            >
              Store contact page <ExternalLink size={12} aria-hidden="true" />
            </a>
          </li>
        ) : null}
        {record.storeLinks.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:text-[var(--lsh-brand-red)]"
            >
              {link.label} <ExternalLink size={12} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/**
 * Store page template under Medical Supply Solutions: LifeSupply, Wellmart
 * Medical, and Balkowitsch Worldwide. Copy comes from the content model;
 * geography, categories, and service channels come from the brand registry;
 * actions from the action registry. Store terms are never restated.
 */
export function StoreBrandPage({
  brandKey,
}: {
  brandKey: "lifesupply" | "wellmart" | "balkowitsch";
}) {
  const record = getBrand(brandKey);
  const page = LIFE_SUPPLY_CONTENT.businesses.pages[brandKey];
  const [primary, secondary] = page.actions as readonly ActionKey[];
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.intro}
        actions={
          <>
            {primary ? <ActionLink action={primary} /> : null}
            {secondary ? <ActionLink action={secondary} variant="onDark" /> : null}
          </>
        }
      />

      {/* Audience, beside the store's photograph. */}
      <SplitSection
        eyebrow={brandGeography(record)}
        title={page.audience.title}
        graphic={STORE_GRAPHICS[brandKey]}
        caption={CONCEPTUAL_CAPTION}
      >
        <p>{page.audience.text}</p>
      </SplitSection>

      {/* Verified categories, from the registry. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="flex items-start gap-5">
            <IconBadge icon={iconForTitle(page.categories.title)} />
            <div>
              <Eyebrow as="h2">{page.categories.title}</Eyebrow>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{page.categories.text}</p>
            </div>
          </Reveal>
          <div>
            <CategoryLinks record={record} />
          </div>
        </Container>
      </section>

      <section className="bg-[var(--lsh-paper)] py-20">
        <Container className="grid gap-8 lg:grid-cols-2">
          <ServiceChannels record={record} title={page.channels.title} text={page.channels.text} />
          <Reveal className="flex flex-col justify-between border border-[var(--lsh-rule)] p-7">
            <div>
              <div className="flex items-start justify-between gap-4">
                <Eyebrow as="h2">On this site</Eyebrow>
                <IconBadge icon="globe" size={18} />
              </div>
              <p className="mt-4 leading-7 text-[var(--lsh-muted)]">
                {LIFE_SUPPLY_CONTENT.shop.support.text}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink action="shop_services" variant="onLight" />
              <ActionLink action="contact_directory" variant="onLight" />
            </div>
          </Reveal>
        </Container>
      </section>
      <RelatedActions actions={"related" in page ? page.related : undefined} />
    </LifeSupplyLayout>
  );
}
