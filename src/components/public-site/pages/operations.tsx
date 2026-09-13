import Image from "next/image";
import { ChevronDown, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection } from "@/components/public-site/on-this-page";
import { SectionNav } from "@/components/public-site/section-nav";
import { SupplierProcess } from "@/components/public-site/supplier-process";
import type { ActionKey } from "@/lib/public-site/actions";
import { OPERATING_BRANDS, brandGeography, getBrand } from "@/lib/public-site/brands";
import type { BrandRecord, OperatingBrandKey } from "@/lib/public-site/brands";
import { BRAND_GRAPHICS, getGraphic } from "@/lib/public-site/graphics";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { measurementAttributes } from "@/lib/public-site/measurement";

/** The three online stores, in the order the page compares them. */
const STORE_KEYS: readonly OperatingBrandKey[] = ["lifesupply", "wellmart", "balkowitsch"];

/** The anchor each store profile answers on; a retired brand page redirects to it. */
const STORE_ANCHORS: Record<OperatingBrandKey, string> = {
  clinics: "clinic-solutions",
  lifesupply: "lifesupply",
  wellmart: "wellmart-medical",
  balkowitsch: "balkowitsch",
};

/** Which store's shop button is which registry action. */
const SHOP_ACTIONS: Record<OperatingBrandKey, ActionKey> = {
  clinics: "shop_clinics",
  lifesupply: "shop_lifesupply",
  wellmart: "shop_wellmart",
  balkowitsch: "shop_balkowitsch",
};

/**
 * One store profile: the picture, where it trades, what it is, what it sells,
 * where to buy, and who to ask. The whole card is deliberately not a link,
 * because it carries several destinations; each is its own control.
 */
export function StoreProfile({ record }: { record: BrandRecord }) {
  const profile = record.profile;
  if (!profile) return null;
  const key = record.key as OperatingBrandKey;
  const anchor = STORE_ANCHORS[key];
  // Balkowitsch's shared brand photograph shows a person packing in a
  // warehouse, which could be read as an employee or an operating site, so
  // this page uses a product still life instead. The shared asset is
  // untouched and still serves the pages that use it.
  //
  // Both come from the registry and both fill the same 3:2 frame. Rendering
  // one through `BrandImage` and one directly put a 16:9 figure inside a 3:2
  // box, which showed as a black band under the two Canadian photographs.
  const picture =
    record.key === "balkowitsch"
      ? getGraphic("balkowitschProducts")
      : getGraphic(BRAND_GRAPHICS[key]);
  return (
    <article id={anchor} className="flex h-full scroll-mt-40 flex-col">
      <figure className="group relative aspect-[3/2] overflow-hidden bg-[var(--lsh-charcoal)]">
        <Image
          src={picture.src}
          alt={picture.alt}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
          style={{ objectPosition: picture.position ?? "50% 50%" }}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </figure>
      <span aria-hidden="true" className="block h-0.5 w-full bg-[var(--lsh-brand-red)]" />

      <p className="lsh-display mt-5 text-[10px] text-[var(--lsh-brand-red)]">
        {brandGeography(record)}
      </p>
      <h3 className="lsh-display mt-2 text-2xl leading-tight text-[var(--lsh-charcoal)]">
        {record.name}
      </h3>
      <p className="lsh-display mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
        {profile.positioning}
      </p>
      {profile.description.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
          {paragraph}
        </p>
      ))}

      {/*
       * Shop, categories and support sit together at the foot of the column,
       * so the three read as one comparison row rather than stepping down
       * wherever a description happens to end. The descriptions keep their
       * own length; only the controls line up.
       */}
      <div className="mt-auto pt-6">
        <ActionLink action={SHOP_ACTIONS[key]}>{profile.shopLabel}</ActionLink>

        {/*
         * Native disclosure: the category links are in the document whether it
         * is open or shut, several may be open at once, it works with the
         * keyboard and with JavaScript off, and the browser draws its own
         * expanded state which the marker rotation follows.
         */}
        {record.categories.length > 0 ? (
          <details className="lsh-disclosure group mt-6 border-t border-[var(--lsh-rule)] pt-4">
            <summary className="lsh-display flex cursor-pointer list-none items-center justify-between gap-4 text-[11px] text-[var(--lsh-charcoal)]">
              {profile.categoriesLabel}
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <ul className="mt-4 grid gap-1">
              {record.categories.map((category) => (
                <li key={category.url}>
                  <a
                    href={category.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 py-1 text-sm leading-6 text-[var(--lsh-muted)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:text-[var(--lsh-brand-red)] hover:decoration-[var(--lsh-brand-red)]"
                  >
                    {category.displayLabel ?? category.label}
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {record.supportUrl ? (
          <a
            {...measurementAttributes("brand_destination_click", { brand: record.key })}
            href={record.supportUrl}
            target="_blank"
            rel="noreferrer"
            className="lsh-display mt-5 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-muted)] transition-colors hover:text-[var(--lsh-brand-red)]"
          >
            {profile.supportLabel} <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Medical Supply Solutions — `/medical-supply-solutions/`, consolidated on
 * 2026-09-12 at the product owner's direction.
 *
 * The three store pages and the suppliers page became sections of this one,
 * so the page answers three questions in the order a visitor asks them:
 *
 *   1. Our stores            — where should I shop
 *   2. Professional purchasing — who helps me buy for a practice
 *   3. Ordering & support    — how does buying actually work
 *   4. Suppliers             — how do I introduce my products
 *
 * Each section is composed differently on purpose: the store comparison is
 * the only three-across grid, professional purchasing is asymmetric on pale
 * grey, ordering is a quiet rule-bound block, suppliers is a narrow column
 * beside four rows with the process graphic beneath, and the close is a
 * shallow charcoal band.
 *
 * `/medical-supply-solutions/lifesupply`, `/wellmart-medical`, `/balkowitsch`
 * and `/partners/suppliers` redirect to the four anchors here.
 */
export function MedicalSupplySolutionsPage() {
  const { hub } = LIFE_SUPPLY_CONTENT.businesses;
  const stores = OPERATING_BRANDS.filter((record) =>
    STORE_KEYS.includes(record.key as OperatingBrandKey),
  );
  return (
    <LifeSupplyLayout>
      {/*
       * The flatlay has its subject on the right and space on the left, so
       * the copy sits in the left 55% and the equipment stays visible. On a
       * phone the scrim goes almost solid behind the text rather than the
       * desktop overlay being squeezed into a narrow strip.
       */}
      <PublicHero
        media={<GraphicBackdrop graphic="suppliesFlatlay" position="80% 50%" />}
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.description}
        actions={
          <>
            <a
              href="#stores"
              className="lsh-display inline-flex items-center gap-2 bg-[var(--lsh-brand-red)] px-5 py-3 text-[11px] text-white transition-colors hover:bg-[var(--lsh-charcoal)]"
            >
              {hub.actions.stores}
            </a>
            <a
              href="#professional-buyers"
              className="lsh-display inline-flex items-center gap-2 border border-white/40 px-5 py-3 text-[11px] text-white transition-colors hover:border-white"
            >
              {hub.actions.professional}
            </a>
            <a
              href="#suppliers"
              className="lsh-display inline-flex items-center gap-2 py-3 text-[11px] text-white/80 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              {hub.actions.suppliers}
            </a>
          </>
        }
      />

      <SectionNav items={hub.sections} />

      {/* Our stores: the one three-across grid on the page. */}
      <AnchoredSection id="stores" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={hub.stores.eyebrow}
              title={hub.stores.title}
              description={hub.stores.intro}
            />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {stores.map((record) => (
              <StaggerItem key={record.key} as="li" className="h-full">
                <StoreProfile record={record} />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </AnchoredSection>

      {/* Professional purchasing: asymmetric, on pale grey, no photograph. */}
      <AnchoredSection
        id="professional-buyers"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Reveal>
              <SectionHeading
                eyebrow={hub.professional.eyebrow}
                title={hub.professional.title}
                description={hub.professional.paragraphs}
              />
            </Reveal>
            <Reveal delay={0.05} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ActionLink action={hub.professional.action as ActionKey}>
                {hub.professional.actionLabel}
              </ActionLink>
              <ActionLink action={hub.professional.supportingAction as ActionKey} variant="onLight">
                {hub.professional.supportingLabel}
              </ActionLink>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 border-t border-[var(--lsh-rule)] pt-5 text-sm leading-6 text-[var(--lsh-muted)]">
                {hub.professional.note}
              </p>
            </Reveal>
          </div>
          <div>
            <Reveal>
              <Eyebrow as="h3">{hub.professional.checklistTitle}</Eyebrow>
            </Reveal>
            <Stagger as="ol" className="mt-6 grid gap-px bg-[var(--lsh-rule)]">
              {hub.professional.checklist.map((item, index) => (
                <StaggerItem
                  key={item}
                  as="li"
                  className="flex items-start gap-5 bg-[var(--lsh-paper)] px-6 py-5"
                >
                  <span className="lsh-display shrink-0 text-lg leading-none text-[var(--lsh-brand-red)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-7 text-[var(--lsh-muted)]">{item}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </AnchoredSection>

      {/*
       * Ordering and support: quieter than the profiles, rules instead of an
       * image. The three store support links sit under the sentence that
       * tells a visitor to use them, rather than in a full-width row of their
       * own: that row put four short items under the left half of a rule
       * spanning the whole container, which read as unfinished.
       */}
      <AnchoredSection id="ordering-support" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container className="border-y border-[var(--lsh-rule)] py-10">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <Reveal>
                <SectionHeading
                  eyebrow={hub.ordering.eyebrow}
                  title={hub.ordering.title}
                  description={hub.ordering.intro}
                />
              </Reveal>
            </div>
            <div className="divide-y divide-[var(--lsh-rule)] border-y border-[var(--lsh-rule)]">
              {hub.ordering.disclosures.map((item) => (
                <details key={item.question} className="lsh-disclosure group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left leading-7 text-[var(--lsh-charcoal)]">
                    {item.question}
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--lsh-muted)]">
                    {item.answer}
                  </p>
                </details>
              ))}
              {/*
               * The three stores' own support pages, directly under "Who can
               * help with an existing order?", which is the question they
               * answer. An inline row rather than a stack, so the column does
               * not outgrow the questions above it.
               */}
              <div className="pt-5">
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                  {hub.ordering.supportLabel}
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-8">
                  {hub.ordering.supportLinks.map((link) => (
                    <li key={link.brand}>
                      <a
                        href={getBrand(link.brand as OperatingBrandKey).supportUrl ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="lsh-display inline-flex min-h-11 items-center gap-2 text-[11px] text-[var(--lsh-muted)] transition-colors hover:text-[var(--lsh-brand-red)]"
                      >
                        {link.label} <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </AnchoredSection>

      {/* Suppliers: a narrow column beside four rows, then the process. */}
      <AnchoredSection
        id="suppliers"
        offset="sectionNav"
        className="bg-[var(--lsh-paper)] px-5 py-20 lg:px-8"
      >
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            {/* Sticky below both bars, so the introduction stays with the
                requirements a reader is working down. */}
            <Reveal className="lg:sticky lg:top-44 lg:self-start">
              <SectionHeading
                eyebrow={hub.suppliers.eyebrow}
                title={hub.suppliers.title}
                description={hub.suppliers.paragraphs}
              />
            </Reveal>
            <div>
              <Reveal>
                <Eyebrow as="h3">{hub.suppliers.requirementsTitle}</Eyebrow>
              </Reveal>
              <Stagger as="dl" className="mt-6 grid gap-8">
                {hub.suppliers.requirements.map((item) => (
                  <StaggerItem
                    key={item.title}
                    className="border-t border-[var(--lsh-rule-strong)] pt-5"
                  >
                    <dt className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                      {item.title}
                    </dt>
                    <dd className="mt-2 leading-7 text-[var(--lsh-muted)]">{item.text}</dd>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
          <div className="mt-16 border-t border-[var(--lsh-rule)] pt-12">
            <SupplierProcess title={hub.suppliers.processTitle} steps={hub.suppliers.process} />
            <Reveal className="mt-12 flex flex-col gap-5 border-t border-[var(--lsh-rule)] pt-8 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-[var(--lsh-muted)]">
                {hub.suppliers.note}
              </p>
              <div className="shrink-0">
                <ActionLink action={hub.suppliers.action as ActionKey}>
                  {hub.suppliers.actionLabel}
                </ActionLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </AnchoredSection>

      {/* The close: shallow, charcoal, one red action. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-16 text-white lg:px-8">
        <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-2xl">
            <h2 className="lsh-display text-3xl leading-tight sm:text-4xl">{hub.closing.title}</h2>
            <p className="mt-4 leading-7 text-white/75">{hub.closing.text}</p>
          </Reveal>
          <Reveal delay={0.05} className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ActionLink action={hub.closing.action as ActionKey}>
              {hub.closing.actionLabel}
            </ActionLink>
            <a
              href="#stores"
              className="lsh-display inline-flex items-center gap-2 text-[11px] text-white/80 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              {hub.closing.backLabel}
            </a>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
