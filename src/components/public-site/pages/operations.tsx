import Image from "next/image";
import { ChevronDown, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { CategoryExplorer } from "@/components/public-site/category-explorer";
import type { ExplorerItem } from "@/components/public-site/category-explorer";
import { DemographicChart } from "@/components/public-site/demographic-chart";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  InfoBand,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection } from "@/components/public-site/on-this-page";
import { PortalConcept } from "@/components/public-site/portal-concept";
import { SectionNav } from "@/components/public-site/section-nav";
import { SupplierProcess } from "@/components/public-site/supplier-process";
import type { ActionKey } from "@/lib/public-site/actions";
import {
  OPERATING_BRANDS,
  brandGeography,
  getBrand,
  getBrandCategory,
} from "@/lib/public-site/brands";
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

const HERO_PRIMARY =
  "lsh-display inline-flex items-center gap-2 bg-[var(--lsh-brand-red)] px-5 py-3 text-[11px] text-white transition-colors hover:bg-[var(--lsh-charcoal)]";
const HERO_SECONDARY =
  "lsh-display inline-flex items-center gap-2 border border-white/40 px-5 py-3 text-[11px] text-white transition-colors hover:border-white";
const HERO_UTILITY =
  "lsh-display inline-flex items-center gap-2 py-3 text-[11px] text-white/80 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white";

/**
 * One store profile: the picture, where it trades, what it is, where to buy,
 * and who to ask. The whole card is deliberately not a link, because it
 * carries several destinations; each is its own control.
 *
 * The expandable list of category links came off on 2026-09-13: the
 * category explorer above the stores carries every verified category page,
 * organized by need, so the profile only has to prove the store exists and
 * hand the visitor to it.
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
       * Shop and support sit together at the foot of the column, so the
       * three read as one comparison row rather than stepping down wherever
       * a description happens to end.
       */}
      <div className="mt-auto pt-6">
        <ActionLink action={SHOP_ACTIONS[key]}>{profile.shopLabel}</ActionLink>
        {record.supportUrl ? (
          <a
            {...measurementAttributes("brand_destination_click", { brand: record.key })}
            href={record.supportUrl}
            target="_blank"
            rel="noreferrer"
            className="lsh-display mt-5 flex w-fit items-center gap-2 text-[11px] text-[var(--lsh-muted)] transition-colors hover:text-[var(--lsh-brand-red)]"
          >
            {profile.supportLabel} <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Medical Supply Solutions — `/medical-supply-solutions/`.
 *
 * Consolidated on 2026-09-12 (the three store pages and the suppliers page
 * became sections) and expanded on 2026-09-13 at the product owner's
 * direction into the main commercial explanation of the supply business:
 * whom it serves, what they need, the categories it supplies, and how the
 * offering could develop into longer-term purchasing relationships.
 *
 * The page runs from what operates to what is proposed:
 *
 *   1. Hero                 — supplies for home care and professional practice
 *   2. Customers            — two audiences, related but commercially different
 *   3. Supply categories    — the explorer; the most space on the page
 *   4. Market context       — one sourced demographic graphic
 *   5. Our stores           — the operating foundation, with ordering & support
 *      ─ the one status statement ─
 *   6. Business purchasing  — problems, direction, proposed capabilities, checklist
 *   7. Supply planning      — proposed information and automation capabilities
 *   8. Supply portals       — the illustrative concept and its lifecycle
 *   9. Foundation           — four evidence points
 *  10. Suppliers, and audience-specific closing actions
 *
 * `/medical-supply-solutions/lifesupply`, `/wellmart-medical`, `/balkowitsch`
 * and `/partners/suppliers` redirect to anchors here, all of which survive.
 * Every category link is resolved from the brand registry by label, so the
 * explorer can only ever point at a category page the registry has observed.
 */
export function MedicalSupplySolutionsPage() {
  const { hub } = LIFE_SUPPLY_CONTENT.businesses;
  const stores = OPERATING_BRANDS.filter((record) =>
    STORE_KEYS.includes(record.key as OperatingBrandKey),
  );
  const explorerItems: ExplorerItem[] = hub.categories.items.map((item) => ({
    slug: item.slug,
    title: item.title,
    description: item.description,
    groups: item.groups,
    picture: getGraphic(item.graphic),
    stores: item.stores.map((entry) => {
      const record = getBrand(entry.brand);
      return {
        key: record.key,
        name: record.name,
        geography: brandGeography(record),
        links: entry.categories.map((label) => {
          const category = getBrandCategory(entry.brand, label);
          return { label: category.displayLabel ?? category.label, url: category.url };
        }),
      };
    }),
  }));

  return (
    <LifeSupplyLayout>
      {/*
       * The flatlay has its subject on the right and space on the left, so
       * the copy sits in the left 55% and the equipment stays visible. Three
       * actions in order of weight: the categories, a business conversation,
       * and the stores as a plain link so a visitor who only wants products
       * is not made to read the proposition first.
       */}
      <PublicHero
        media={<GraphicBackdrop graphic="suppliesFlatlay" position="80% 50%" />}
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.description}
        actions={
          <>
            <a href="#categories" className={HERO_PRIMARY}>
              {hub.actions.categories}
            </a>
            <a href="#professional-buyers" className={HERO_SECONDARY}>
              {hub.actions.professional}
            </a>
            <a href="#stores" className={HERO_UTILITY}>
              {hub.actions.stores}
            </a>
          </>
        }
      />

      <SectionNav items={hub.sections} />

      {/* Two audiences: two editorial panels, each with its own picture. */}
      <AnchoredSection id="customers" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={hub.customers.eyebrow}
              title={hub.customers.title}
              description={hub.customers.intro}
            />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-10">
            {hub.customers.panels.map((panel) => {
              const picture = getGraphic(panel.graphic);
              return (
                <StaggerItem key={panel.key} as="li" className="h-full">
                  <article className="flex h-full flex-col">
                    <figure className="group relative aspect-[16/9] overflow-hidden bg-[var(--lsh-charcoal)]">
                      <Image
                        src={picture.src}
                        alt={picture.alt}
                        fill
                        sizes="(min-width: 1024px) 600px, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </figure>
                    <span
                      aria-hidden="true"
                      className="block h-1 w-full bg-[var(--lsh-brand-red)]"
                    />
                    <h3 className="lsh-display mt-6 text-2xl leading-tight text-[var(--lsh-charcoal)] sm:text-3xl">
                      {panel.eyebrow}
                    </h3>
                    <dl className="mt-6 grid gap-5 border-y border-[var(--lsh-rule)] py-5 sm:grid-cols-2">
                      <div>
                        <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                          {hub.customers.needsLabel}
                        </dt>
                        <dd className="mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                          {panel.needs}
                        </dd>
                      </div>
                      <div>
                        <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                          {hub.customers.propositionLabel}
                        </dt>
                        <dd className="mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                          {panel.proposition}
                        </dd>
                      </div>
                    </dl>
                    {panel.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="mt-4 leading-7 text-[var(--lsh-muted)]"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {/* The kinds of organization this is for: types, never named accounts. */}
                    {"audiences" in panel ? (
                      <p className="mt-4 text-sm leading-6 text-[var(--lsh-muted)]">
                        {panel.audiences}
                      </p>
                    ) : null}
                    <p className="mt-auto pt-6">
                      <a
                        href={panel.href}
                        className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)] transition-colors hover:text-[var(--lsh-red-hover)]"
                      >
                        {panel.actionLabel} <span aria-hidden="true">↓</span>
                      </a>
                    </p>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Container>
      </AnchoredSection>

      {/* The category explorer: the most space on the page. */}
      <AnchoredSection
        id="categories"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={hub.categories.eyebrow}
              title={hub.categories.title}
              description={hub.categories.intro}
            />
          </Reveal>
          <div className="mt-10">
            <CategoryExplorer
              items={explorerItems}
              filters={hub.categories.filters}
              filterLabel={hub.categories.filterLabel}
              storesLabel={hub.categories.storesLabel}
              countLabel={hub.categories.countLabel}
              imageNote={hub.categories.imageNote}
            />
          </div>
        </Container>
      </AnchoredSection>

      {/* Market context, on ink: the narrative beside the one chart. */}
      <AnchoredSection
        id="market"
        offset="sectionNav"
        className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8"
      >
        <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={hub.market.eyebrow}
              title={hub.market.title}
              description={hub.market.paragraphs}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <DemographicChart data={hub.market.chart} />
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* Our stores: the operating foundation, and the compact ordering block beneath. */}
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

          {/*
           * Ordering and support, kept compact under the stores it is about.
           * The three store support links sit under the question they answer.
           */}
          <div
            id="ordering-support"
            className="mt-20 grid scroll-mt-44 gap-10 border-t border-[var(--lsh-rule)] pt-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16"
          >
            <Reveal>
              <Eyebrow as="h3">{hub.ordering.eyebrow}</Eyebrow>
              <p className="lsh-display mt-4 text-2xl leading-tight text-[var(--lsh-charcoal)]">
                {hub.ordering.title}
              </p>
              <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{hub.ordering.intro}</p>
            </Reveal>
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

      {/*
       * The one status statement, on the red band, between what operates and
       * what is proposed. Everything below refers to it with conditional
       * wording rather than repeating it.
       */}
      <Reveal>
        <InfoBand eyebrow={hub.status.eyebrow} statement={hub.status.text} />
      </Reveal>

      {/* Business purchasing: the problems, the direction, the proposed capabilities, the checklist. */}
      <AnchoredSection
        id="professional-buyers"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <Reveal>
              <SectionHeading
                eyebrow={hub.professional.eyebrow}
                title={hub.professional.title}
                description={hub.professional.paragraphs}
              />
            </Reveal>
            <div>
              <Reveal>
                <Eyebrow as="h3">{hub.professional.problemsTitle}</Eyebrow>
              </Reveal>
              <Stagger as="ul" className="mt-6 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2">
                {hub.professional.problems.map((item, index) => (
                  <StaggerItem
                    key={item}
                    as="li"
                    className="flex items-start gap-4 bg-[var(--lsh-paper)] px-5 py-4"
                  >
                    <span className="lsh-display shrink-0 text-base leading-none text-[var(--lsh-brand-red)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-6 text-[var(--lsh-muted)]">{item}</span>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>

          {/*
           * The proposed capabilities as a two-column list: each row is the
           * capability and what it would do for a customer. A list of headed
           * items rather than a table, so it reads the same at every width.
           */}
          <div className="mt-16 border-t border-[var(--lsh-rule)] pt-12">
            <Reveal>
              <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                {hub.professional.capabilitiesTitle}
              </h3>
            </Reveal>
            <div
              aria-hidden="true"
              className="mt-8 hidden grid-cols-[1fr_1.6fr] gap-8 border-b border-[var(--lsh-rule-strong)] pb-3 md:grid"
            >
              <span className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                {hub.professional.capabilityLabel}
              </span>
              <span className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                {hub.professional.valueLabel}
              </span>
            </div>
            <Stagger as="ul" className="divide-y divide-[var(--lsh-rule)]">
              {hub.professional.capabilities.map((row) => (
                <StaggerItem
                  key={row.name}
                  as="li"
                  className="grid gap-2 py-5 md:grid-cols-[1fr_1.6fr] md:gap-8"
                >
                  <h4 className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                    {row.name}
                  </h4>
                  <p className="leading-7 text-[var(--lsh-muted)]">
                    <span className="lsh-display mr-2 text-[10px] text-[var(--lsh-brand-red)] md:sr-only">
                      {hub.professional.valueLabel}
                    </span>
                    {row.value}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal>
              <p className="mt-6 text-sm leading-6 text-[var(--lsh-muted)]">
                {hub.professional.capabilitiesNote}
              </p>
            </Reveal>
          </div>

          {/* What to bring, after the proposition, with the two routes in. */}
          <div className="mt-16 grid gap-12 border-t border-[var(--lsh-rule)] pt-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
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
            <Reveal delay={0.05} className="lg:pt-9">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <ActionLink action={hub.professional.action as ActionKey}>
                  {hub.professional.actionLabel}
                </ActionLink>
                <ActionLink
                  action={hub.professional.supportingAction as ActionKey}
                  variant="onLight"
                >
                  {hub.professional.supportingLabel}
                </ActionLink>
              </div>
              <p className="mt-8 border-t border-[var(--lsh-rule)] pt-5 text-sm leading-6 text-[var(--lsh-muted)]">
                {hub.professional.note}
              </p>
            </Reveal>
          </div>
        </Container>
      </AnchoredSection>

      {/* Supply planning: six proposed capabilities, each with what it could do and the benefit. */}
      <AnchoredSection id="technology" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={hub.technology.eyebrow}
              title={hub.technology.title}
              description={hub.technology.paragraphs}
            />
          </Reveal>
          <div
            aria-hidden="true"
            className="mt-12 hidden grid-cols-[0.8fr_1.3fr_1fr] gap-8 border-b border-[var(--lsh-rule-strong)] pb-3 md:grid"
          >
            <span className="lsh-display text-[10px] text-[var(--lsh-muted)]">
              {hub.technology.capabilityLabel}
            </span>
            <span className="lsh-display text-[10px] text-[var(--lsh-muted)]">
              {hub.technology.whatLabel}
            </span>
            <span className="lsh-display text-[10px] text-[var(--lsh-muted)]">
              {hub.technology.benefitLabel}
            </span>
          </div>
          <Stagger as="ul" className="mt-12 divide-y divide-[var(--lsh-rule)] md:mt-0">
            {hub.technology.capabilities.map((row) => (
              <StaggerItem
                key={row.name}
                as="li"
                className="grid gap-3 py-6 md:grid-cols-[0.8fr_1.3fr_1fr] md:gap-8"
              >
                <h3 className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                  {row.name}
                </h3>
                <p className="text-sm leading-6 text-[var(--lsh-muted)]">
                  <span className="lsh-display mb-1 block text-[10px] text-[var(--lsh-brand-red)] md:sr-only">
                    {hub.technology.whatLabel}
                  </span>
                  {row.what}
                </p>
                <p className="text-sm leading-6 text-[var(--lsh-charcoal)]">
                  <span className="lsh-display mb-1 block text-[10px] text-[var(--lsh-brand-red)] md:sr-only">
                    {hub.technology.benefitLabel}
                  </span>
                  {row.benefit}
                </p>
              </StaggerItem>
            ))}
          </Stagger>

          {/* Pricing, as disciplined management: a narrower block under the six. */}
          <Reveal className="mt-16 grid gap-6 border-t border-[var(--lsh-rule-strong)] pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
              {hub.technology.pricing.title}
            </h3>
            <div className="grid gap-4">
              {hub.technology.pricing.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="leading-7 text-[var(--lsh-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* Supply portals: the concept, its lifecycle, and where it sits beside the clinic work. */}
      <AnchoredSection
        id="portals"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={hub.portal.eyebrow}
              title={hub.portal.title}
              description={hub.portal.paragraphs}
            />
          </Reveal>
          <Reveal delay={0.05} className="mt-12">
            <PortalConcept
              label={hub.portal.concept.label}
              note={hub.portal.concept.note}
              viewsLabel={hub.portal.concept.viewsLabel}
              views={hub.portal.concept.views}
            />
          </Reveal>
          <div className="mt-16 border-t border-[var(--lsh-rule)] pt-12">
            <SupplierProcess
              title={hub.portal.lifecycleTitle}
              steps={hub.portal.lifecycle}
              columns={5}
            />
          </div>
          <Reveal className="mt-12 grid gap-6 border-t border-[var(--lsh-rule)] pt-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <p className="text-sm leading-6 text-[var(--lsh-muted)]">{hub.portal.distinction}</p>
            <div>
              <p className="text-sm leading-6 text-[var(--lsh-muted)]">{hub.portal.connecting}</p>
              <div className="mt-6">
                <ActionLink action={hub.portal.action as ActionKey}>
                  {hub.portal.actionLabel}
                </ActionLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* The foundation, on ink: four evidence points beside three short paragraphs. */}
      <AnchoredSection
        id="foundation"
        offset="sectionNav"
        className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8"
      >
        <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={hub.foundation.eyebrow}
              title={hub.foundation.title}
              description={hub.foundation.paragraphs}
            />
          </Reveal>
          <Stagger as="dl" className="grid gap-8 sm:grid-cols-2">
            {hub.foundation.points.map((point, index) => (
              <StaggerItem key={point.title} className="border-t border-white/25 pt-5">
                <span
                  aria-hidden="true"
                  className="lsh-display text-[11px] text-[var(--lsh-red-on-ink)]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <dt className="lsh-display mt-3 text-lg leading-tight text-white">{point.title}</dt>
                <dd className="mt-3 text-sm leading-6 text-white/70">{point.text}</dd>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </AnchoredSection>

      {/* Suppliers: compact, with the requirement details behind a disclosure. */}
      <AnchoredSection id="suppliers" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal className="lg:sticky lg:top-44 lg:self-start">
              <SectionHeading
                eyebrow={hub.suppliers.eyebrow}
                title={hub.suppliers.title}
                description={hub.suppliers.paragraphs}
              />
            </Reveal>
            <div>
              <SupplierProcess title={hub.suppliers.processTitle} steps={hub.suppliers.process} />
              {/*
               * The four requirement rows are secondary detail, so they sit
               * behind a native disclosure: in the document whether open or
               * shut, keyboard-operable, and working with JavaScript off.
               */}
              <details className="lsh-disclosure group mt-12 border-t border-[var(--lsh-rule-strong)] pt-5">
                <summary className="lsh-display flex cursor-pointer list-none items-center justify-between gap-4 text-[11px] text-[var(--lsh-charcoal)]">
                  {hub.suppliers.requirementsTitle}
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  {hub.suppliers.requirements.map((item) => (
                    <div key={item.title} className="border-t border-[var(--lsh-rule)] pt-4">
                      <dt className="lsh-display text-base leading-tight text-[var(--lsh-charcoal)]">
                        {item.title}
                      </dt>
                      <dd className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                        {item.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
              <Reveal className="mt-10 flex flex-col gap-5 border-t border-[var(--lsh-rule)] pt-8 lg:flex-row lg:items-center lg:justify-between">
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
          </div>
        </Container>
      </AnchoredSection>

      {/* The close: charcoal, three audience-specific actions. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-16 text-white lg:px-8">
        <Container className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-2xl">
            <h2 className="lsh-display text-3xl leading-tight sm:text-4xl">{hub.closing.title}</h2>
            <p className="mt-4 leading-7 text-white/75">{hub.closing.text}</p>
          </Reveal>
          <Reveal delay={0.05} className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <a href={hub.closing.shopHref} className={HERO_PRIMARY}>
              {hub.closing.shopLabel}
            </a>
            <ActionLink action={hub.closing.purchasingAction as ActionKey} variant="onDark">
              {hub.closing.purchasingLabel}
            </ActionLink>
            <ActionLink action={hub.closing.portalAction as ActionKey} variant="onDark">
              {hub.closing.portalLabel}
            </ActionLink>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
