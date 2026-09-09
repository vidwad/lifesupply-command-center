import { ExternalLink, Mail, Phone } from "lucide-react";

import { ActionLink, RelatedActions } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import {
  Callout,
  IconBadge,
  IconFeatureGrid,
  ProcessSteps,
  SplitSection,
} from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { brandGeography, getBrand, type BrandRecord } from "@/lib/public-site/brands";
import { CONCEPTUAL_CAPTION, type GraphicKey } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/** The conceptual graphic each store page carries beside its audience statement. */
const STORE_GRAPHICS: Record<"lifesupply" | "wellmart" | "balkowitsch", GraphicKey> = {
  lifesupply: "suppliesFlatlay",
  wellmart: "shipping",
  balkowitsch: "warehouse",
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

/** The brand's own support channel and policy pages, as published. */
function ServiceChannels({
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
 * Store brand page template (Stage 3, guide §3): LifeSupply, Wellmart
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

      {/* Audience, beside a conceptual graphic. */}
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

/** `/our-operations/lifesupply-clinics/` — the Clinics brand page. */
export function ClinicsBrandPage() {
  const record = getBrand("clinics");
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.brandPage;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.intro}
        actions={
          <>
            <ActionLink action="plan_clinic" />
            <ActionLink action="equipment_quote" variant="onDark" />
          </>
        }
      />

      {/* The distinction, the attribution, and the geography, stated before anything else. */}
      <section className="px-5 py-16 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-px bg-[var(--lsh-rule)] lg:grid-cols-3">
          <StaggerItem className="flex gap-5 bg-[var(--lsh-paper)] p-7">
            <IconBadge icon="shield" size={20} />
            <p className="leading-7 text-[var(--lsh-charcoal)]">{clinics.distinction}</p>
          </StaggerItem>
          <StaggerItem className="flex gap-5 bg-[var(--lsh-paper)] p-7">
            <IconBadge icon="handshake" size={20} />
            <p className="leading-7 text-[var(--lsh-muted)]">{clinics.attribution}</p>
          </StaggerItem>
          <StaggerItem className="flex gap-5 bg-[var(--lsh-paper)] p-7">
            <IconBadge icon="pin" size={20} />
            <p className="leading-7 text-[var(--lsh-muted)]">{clinics.geography}</p>
          </StaggerItem>
        </Stagger>
      </section>

      {/* Services, beside a conceptual exam room. */}
      <SplitSection
        tone="onSurface"
        eyebrow={page.servicesHeading.eyebrow}
        title={page.servicesHeading.title}
        graphic="examRoom"
        side="left"
        caption={CONCEPTUAL_CAPTION}
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {clinics.services.map((service) => (
            <li key={service.title} className="flex gap-4">
              <IconBadge icon={iconForTitle(service.title)} size={18} />
              <div>
                <h3 className="lsh-display text-lg text-[var(--lsh-charcoal)]">{service.title}</h3>
                <ul className="mt-2 grid gap-1 text-sm leading-6">
                  {service.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Eyebrow as="h3">{page.specialtiesHeading.title}</Eyebrow>
          <ul className="mt-3 flex flex-wrap gap-2">
            {clinics.specialties.map((item) => (
              <li
                key={item}
                className="lsh-display border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </SplitSection>

      {/* Process. */}
      <ProcessSteps
        eyebrow={page.processHeading.eyebrow}
        title={page.processHeading.title}
        steps={clinics.process.map((step) => ({
          index: step.index,
          title: step.title,
          text: step.text,
          icon: iconForTitle(step.title),
        }))}
      />

      {/* Published projects, as the Clinics site presents them. */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={clinics.projects.eyebrow}
              title={clinics.projects.title}
              description={clinics.attribution}
            />
          </Reveal>
          <Stagger
            as="ul"
            className="mt-10 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-2 xl:grid-cols-3"
          >
            {clinics.projects.items.map((project) => (
              <StaggerItem key={project.href} as="li" className="bg-[var(--lsh-paper)]">
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full items-center gap-4 p-6 transition-colors hover:bg-[var(--lsh-surface)]"
                >
                  <IconBadge icon="building" size={18} />
                  <span className="lsh-display flex-1 text-lg leading-tight text-[var(--lsh-charcoal)]">
                    {project.title}
                  </span>
                  <ExternalLink
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </a>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-8">
            <ActionLink action="view_clinic_projects" variant="text" />
          </div>
        </Container>
      </section>

      {/* After opening: conditional. Then service channels. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-7">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">{page.supplyHeading.eyebrow}</Eyebrow>
              <IconBadge icon="truck" size={18} />
            </div>
            <p className="lsh-display mt-4 text-2xl leading-[1.1] text-[var(--lsh-charcoal)]">
              {page.supplyHeading.title}
            </p>
            <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{clinics.postOpening}</p>
            <div className="mt-6">
              <ActionLink action="clinic_supply_review" variant="onLight" />
            </div>
          </Reveal>
          <ServiceChannels
            record={record}
            title="Service channels"
            text="Consultations and equipment quotes are handled on the Clinics site; its published contact channels are below."
          />
        </div>
      </section>
      <RelatedActions actions={clinics.brandPage.related} />
    </LifeSupplyLayout>
  );
}

/** `/our-operations/technology-fulfilment/` */
export function TechnologyFulfilmentPage() {
  const { technology } = LIFE_SUPPLY_CONTENT.businesses;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={technology.eyebrow}
        title={technology.title}
        description={technology.intro}
        actions={<ActionLink action="clinic_supply_review" />}
      />

      {/* Implemented, beside a conceptual fulfilment aisle. */}
      <SplitSection
        eyebrow={technology.implemented.eyebrow}
        title={technology.implemented.title}
        graphic="warehouse"
        caption={CONCEPTUAL_CAPTION}
      >
        <ul className="grid gap-5">
          {technology.implemented.items.map((item) => (
            <li key={item.title} className="flex gap-4">
              <IconBadge icon={iconForTitle(item.title)} size={18} />
              <div>
                <h3 className="lsh-display text-lg text-[var(--lsh-charcoal)]">{item.title}</h3>
                <p className="mt-1 text-sm leading-6">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </SplitSection>

      {/* In development, with its status on every tile. */}
      <IconFeatureGrid
        tone="onDark"
        columns={2}
        eyebrow={technology.developing.eyebrow}
        title={technology.developing.title}
        items={technology.developing.items.map((item) => ({
          title: item.title,
          text: item.text,
          status: technology.developing.eyebrow,
          icon: iconForTitle(item.title),
        }))}
      />

      <Callout
        icon="shield"
        eyebrow={technology.exceptions.title}
        tone="onLight"
        action={<ActionLink action="shop_services" variant="onLight" />}
      >
        <p>{technology.exceptions.text}</p>
      </Callout>
      <RelatedActions actions={LIFE_SUPPLY_CONTENT.businesses.technology.related} />
    </LifeSupplyLayout>
  );
}
