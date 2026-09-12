import Image from "next/image";
import { ExternalLink, Mail, Phone } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge, SplitSection } from "@/components/public-site/sections";
import { SiteScreen } from "@/components/public-site/site-screen";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import type { ActionKey } from "@/lib/public-site/actions";
import { brandGeography, getBrand, type BrandRecord } from "@/lib/public-site/brands";
import { BRAND_GRAPHICS, getGraphic, type GraphicKey } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/** The photograph each store page carries beside its audience statement. */
const STORE_GRAPHICS: Record<"lifesupply" | "wellmart" | "balkowitsch", GraphicKey> = {
  lifesupply: BRAND_GRAPHICS.lifesupply,
  wellmart: BRAND_GRAPHICS.wellmart,
  balkowitsch: BRAND_GRAPHICS.balkowitsch,
};

/** A second, conceptual category visual keeps the three storefront pages image-led without inventing store inventory. */
const STORE_CATEGORY_GRAPHICS: Record<"lifesupply" | "wellmart" | "balkowitsch", GraphicKey> = {
  lifesupply: "suppliesFlatlay",
  wellmart: "equipment",
  balkowitsch: "shipping",
};

export function StoreCategoryVisual({
  brandKey,
}: {
  brandKey: "lifesupply" | "wellmart" | "balkowitsch";
}) {
  const graphic = getGraphic(STORE_CATEGORY_GRAPHICS[brandKey]);
  return (
    <div
      aria-hidden="true"
      data-storefront-category-visual={brandKey}
      className="lsh-storefront-category-visual"
    >
      <Image
        src={graphic.src}
        alt=""
        fill
        sizes="(min-width: 1024px) 42vw, 100vw"
        className="object-cover"
      />
      <span className="lsh-storefront-category-rule" />
      <span className="lsh-storefront-category-mark lsh-storefront-category-mark--one" />
      <span className="lsh-storefront-category-mark lsh-storefront-category-mark--two" />
    </div>
  );
}

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
/**
 * The conceptual image behind each store's hero. Balkowitsch's brand image
 * shows a synthetic person, who must never stand behind a page as if staff,
 * so that store takes the fulfilment aisle instead.
 */
const STORE_BACKDROP = {
  lifesupply: "brandLifeSupply",
  wellmart: "brandWellmart",
  balkowitsch: "warehouse",
} as const;

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
        media={
          <GraphicBackdrop
            graphic={STORE_BACKDROP[brandKey]}
            position="65% 55%"
            dim={brandKey !== "balkowitsch"}
          />
        }
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
      >
        <p>{page.audience.text}</p>
      </SplitSection>

      {/* Verified categories stay as external links; the visual is conceptual and carries no inventory claim. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <Reveal className="lsh-storefront-category-copy p-6 lg:p-9">
            <div className="flex items-start gap-5">
              <IconBadge icon={iconForTitle(page.categories.title)} />
              <div>
                <Eyebrow as="h2">{page.categories.title}</Eyebrow>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{page.categories.text}</p>
              </div>
            </div>
            <div className="mt-7">
              <CategoryLinks record={record} />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <StoreCategoryVisual brandKey={brandKey} />
          </Reveal>
        </Container>
      </section>

      <section className="lsh-storefront-terminal px-5 py-16 text-white lg:px-8 lg:py-20">
        <Container className="grid gap-8 lg:grid-cols-2">
          <Reveal className="lsh-storefront-screen-frame">
            {/* The store's actual home page, dated, on a laptop frame. */}
            <SiteScreen site={brandKey} />
          </Reveal>
          <Reveal
            delay={0.08}
            className="flex flex-col justify-center border-l-4 border-[var(--lsh-brand-red)] pl-6 sm:pl-8"
          >
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2" tone="onDark">
                On this site
              </Eyebrow>
              <IconBadge icon="globe" size={18} />
            </div>
            <p className="text-white/78 mt-5 max-w-xl leading-7">
              {LIFE_SUPPLY_CONTENT.businesses.hub.stores.support.text}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink action="medical_supply_stores" variant="onDark" />
              <ActionLink action="contact_directory" variant="onDark" />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-[var(--lsh-paper)] px-5 py-16 lg:px-8 lg:py-20">
        <Container>
          <ServiceChannels record={record} title={page.channels.title} text={page.channels.text} />
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
