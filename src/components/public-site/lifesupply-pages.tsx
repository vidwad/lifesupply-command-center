import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink, Mail, Phone, ShieldCheck } from "lucide-react";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { getCommandCenterLoginUrl } from "@/lib/public-site/command-center";
import { LIFE_SUPPLY_CONTENT, LIFE_SUPPLY_ROUTES } from "@/lib/public-site/lifesupply-content";

function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8 lg:py-28">
      <div className="absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_82%_12%,rgba(222,0,0,0.72),transparent_27%),linear-gradient(125deg,rgba(29,29,29,0.96),rgba(0,0,0,0.96))]" />
      <div
        className="absolute bottom-0 left-0 h-1 w-28 bg-[var(--lsh-brand-red)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl">
        <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">{eyebrow}</p>
        <h1 className="lsh-display mt-5 max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{description}</p>
      </div>
    </section>
  );
}
function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">{eyebrow}</p>
      <h2 className="lsh-display mt-4 text-3xl leading-[1.08] text-[var(--lsh-charcoal)] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-[var(--lsh-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="lsh-primary-action lsh-display inline-flex items-center gap-2 px-5 py-3 text-[11px] transition-colors"
    >
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}

export function LifeSupplyHome() {
  const { homepage } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <section className="relative overflow-hidden bg-[var(--lsh-ink)] px-5 pb-20 pt-20 text-white lg:px-8 lg:pb-28 lg:pt-28">
        <div className="absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_80%_16%,rgba(222,0,0,0.88),transparent_28%),linear-gradient(120deg,rgba(29,29,29,0.98),rgba(0,0,0,0.96))]" />
        <div
          className="absolute bottom-0 left-0 h-1 w-40 bg-[var(--lsh-brand-red)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
              {homepage.eyebrow}
            </p>
            <h1 className="lsh-display mt-6 max-w-4xl text-5xl leading-[0.96] sm:text-6xl lg:text-7xl">
              {homepage.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">{homepage.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryLink href={LIFE_SUPPLY_ROUTES.about}>Explore LifeSupply</PrimaryLink>
              <Link
                href={LIFE_SUPPLY_ROUTES.investorRelations}
                className="lsh-display inline-flex items-center gap-2 border border-white/35 px-5 py-3 text-[11px] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                Investor relations <ArrowRight size={16} />
              </Link>
              <a
                href={getCommandCenterLoginUrl()}
                className="lsh-display inline-flex items-center gap-2 border border-white/35 px-5 py-3 text-[11px] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                Command Center login <ExternalLink size={16} />
              </a>
            </div>
          </div>
          <div className="border-l border-white/15 pl-6 lg:pl-10">
            <p className="lsh-display text-[11px] text-white/50">Public operating context</p>
            <p className="lsh-display mt-4 text-3xl leading-[1.05] text-white/95">
              Health, safety, medical, and industrial supply categories across Canada and the United
              States.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-px bg-[#d6d6d6] px-5 lg:grid-cols-3 lg:px-8">
        {homepage.pillars.map((pillar) => (
          <article key={pillar.index} className="bg-[var(--lsh-paper)] px-7 py-10">
            <p className="lsh-display text-sm text-[var(--lsh-brand-red)]">{pillar.index}</p>
            <h2 className="lsh-display mt-7 text-3xl text-[var(--lsh-charcoal)]">{pillar.title}</h2>
            <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{pillar.text}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <SectionTitle
          eyebrow="LifeSupply at a glance"
          title="Publicly reported scale, with source context."
          description="These figures are cited in the 2025 annual-report narrative and should be read with the report’s stated qualifications."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {homepage.publicMetrics.map((metric) => (
            <div
              key={metric.label}
              className="border-t-4 border-[var(--lsh-brand-red)] bg-white px-5 py-7 shadow-sm"
            >
              <p className="lsh-display text-4xl text-[var(--lsh-charcoal)]">{metric.value}</p>
              <p className="mt-3 text-sm leading-5 text-[var(--lsh-muted)]">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 lg:flex-row lg:items-center">
          <div>
            <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
              Corporate overview
            </p>
            <h2 className="lsh-display mt-3 text-3xl text-[var(--lsh-charcoal)]">
              Explore the operations, people, and investor context behind LifeSupply.
            </h2>
          </div>
          <PrimaryLink href={LIFE_SUPPLY_ROUTES.operations}>Our operations</PrimaryLink>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function AboutPage() {
  const { about, brand } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PageHero
        eyebrow="About LifeSupply"
        title="A platform approach to medical-supply access."
        description={about.growth}
      />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-8">
          <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">Mission</p>
          <p className="lsh-display mt-5 text-3xl leading-[1.1] text-[var(--lsh-charcoal)]">
            {about.mission}
          </p>
        </div>
        <div className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white">
          <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">Vision</p>
          <p className="lsh-display mt-5 text-3xl leading-[1.1] text-white">{about.vision}</p>
        </div>
      </section>
      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Portfolio"
            title="Operating brands in the public LifeSupply overview."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {about.brands.map((brandItem) => (
              <a
                key={brandItem.name}
                href={brandItem.url}
                target="_blank"
                rel="noreferrer"
                className="lsh-lift group border border-[#d6d6d6] p-7"
              >
                <Building2 className="text-[var(--lsh-brand-red)]" />
                <h3 className="lsh-display mt-8 text-2xl text-[var(--lsh-charcoal)]">
                  {brandItem.name}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{brandItem.description}</p>
                <span className="lsh-display mt-6 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                  Visit brand <ExternalLink size={15} />
                </span>
              </a>
            ))}
          </div>
          <Image
            src={brand.portfolioImage}
            alt="LifeSupply portfolio logos"
            width={640}
            height={130}
            className="mt-14 h-auto w-full max-w-xl opacity-75"
          />
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function OperationsPage() {
  return (
    <LifeSupplyLayout>
      <PageHero
        eyebrow="Our operations"
        title="Connected channels designed around medical-product access."
        description="The public operating narrative describes online commerce, fulfillment, retail, wholesale, and regulated-care infrastructure as complementary functions."
      />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="grid gap-4">
          {LIFE_SUPPLY_CONTENT.operations.map((operation, index) => (
            <article key={operation.title} className="flex gap-5 border-b border-[#d6d6d6] pb-6">
              <span className="lsh-display text-3xl text-[var(--lsh-brand-red)]">0{index + 1}</span>
              <div>
                <h2 className="lsh-display text-2xl text-[var(--lsh-charcoal)]">
                  {operation.title}
                </h2>
                <p className="mt-2 leading-7 text-[var(--lsh-muted)]">{operation.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-4">
          <Image
            src={LIFE_SUPPLY_CONTENT.operationsTimeline}
            alt="LifeSupply operations timeline"
            width={1000}
            height={700}
            className="h-auto w-full rounded-2xl object-cover"
          />
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function TeamPage() {
  const { management, board } = LIFE_SUPPLY_CONTENT.team;
  return (
    <LifeSupplyLayout>
      <PageHero
        eyebrow="Our team"
        title="Leadership across operations, finance, business development, and technology."
        description="Profiles below preserve publicly sourced historical information and should be reviewed in the Command Center publication workflow before future updates."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {management.map((member) => (
            <Link
              key={member.slug}
              href={`/${member.slug}/`}
              className="lsh-lift group border border-[#d6d6d6] bg-white p-7"
            >
              <div className="flex items-start gap-5">
                {"image" in member ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={92}
                    height={92}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="lsh-display flex h-20 w-20 items-center justify-center rounded-full bg-[var(--lsh-surface)] text-2xl text-[var(--lsh-brand-red)]">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                )}
                <div>
                  <h2 className="lsh-display text-2xl text-[var(--lsh-charcoal)]">{member.name}</h2>
                  <p className="lsh-display mt-1 text-[10px] text-[var(--lsh-brand-red)]">
                    {member.role}
                  </p>
                </div>
              </div>
              <p className="mt-6 leading-7 text-[var(--lsh-muted)]">{member.summary}</p>
              <span className="lsh-display mt-6 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                View profile <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-16 border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white">
          <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">Board of directors</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {board.map((name) => (
              <span key={name} className="border border-white/20 px-4 py-2 text-sm text-white/80">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function InvestorRelationsPage() {
  const investor = LIFE_SUPPLY_CONTENT.investorRelations;
  return (
    <LifeSupplyLayout>
      <PageHero
        eyebrow="Investor relations"
        title={investor.title}
        description={investor.description}
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-4">
          <Image
            src={investor.preview}
            alt="LifeSupply investor presentation preview"
            width={1000}
            height={700}
            className="h-auto w-full rounded-2xl"
          />
        </div>
        <div>
          <SectionTitle
            eyebrow={investor.currentReport.period}
            title="Current report context"
            description={investor.currentReport.status}
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {investor.currentReport.highlights.map((item) => (
              <div
                key={item.label}
                className="border-t-4 border-[var(--lsh-brand-red)] bg-white px-4 py-6 shadow-sm"
              >
                <p className="lsh-display text-3xl text-[var(--lsh-charcoal)]">{item.value}</p>
                <p className="mt-2 text-sm text-[var(--lsh-muted)]">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
            <div className="lsh-display flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
              <ShieldCheck size={18} /> Disclosure context
            </div>
            <p className="mt-3 leading-7 text-[var(--lsh-muted)]">
              {investor.expansionContext.description}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${investor.contact.email}`}
              className="lsh-primary-action lsh-display inline-flex items-center gap-2 px-5 py-3 text-[11px]"
            >
              <Mail size={16} /> {investor.contact.email}
            </a>
            <a
              href={`tel:${investor.contact.phone.replace(/[^+\d]/g, "")}`}
              className="lsh-display inline-flex items-center gap-2 border border-[#bdbdbd] px-5 py-3 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              <Phone size={16} /> {investor.contact.phone}
            </a>
          </div>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function NewsPage() {
  return (
    <LifeSupplyLayout>
      <PageHero
        eyebrow="Company news"
        title="Historical news and corporate announcements."
        description="This archive preserves public source links while the Command Center publication workflow is introduced for future news."
      />
      <section className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
        <div className="grid gap-4">
          {LIFE_SUPPLY_CONTENT.news.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="lsh-lift group border border-[#d6d6d6] bg-white p-7"
            >
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                {item.date} · {item.source}
              </p>
              <h2 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">{item.title}</h2>
              <span className="lsh-display mt-5 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                Read source <ExternalLink size={15} />
              </span>
            </a>
          ))}
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function ContactPage() {
  return (
    <LifeSupplyLayout>
      <PageHero
        eyebrow="Contact"
        title="Direct public channels for the right LifeSupply conversation."
        description="Published contact details are treated as a verified corporate directory. Future form routing will be managed through the Command Center publication and approval workflow."
      />
      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-20 md:grid-cols-2 lg:px-8">
        {LIFE_SUPPLY_CONTENT.contact.channels.map((channel) => (
          <article
            key={channel.label}
            className="border-t-4 border-[var(--lsh-brand-red)] bg-white p-7 shadow-sm"
          >
            <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{channel.label}</p>
            <h2 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">{channel.name}</h2>
            <div className="mt-5 grid gap-2 text-sm text-[var(--lsh-muted)]">
              <a
                href={`mailto:${channel.email}`}
                className="inline-flex items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
              >
                <Mail size={15} /> {channel.email}
              </a>
              {"phone" in channel ? (
                <a
                  href={`tel:${channel.phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
                >
                  <Phone size={15} /> {channel.phone}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </section>
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Operating entities" title="LifeSupply public subsidiaries" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {LIFE_SUPPLY_CONTENT.contact.subsidiaries.map((entity) => (
              <a
                key={entity.name}
                href={entity.url}
                target="_blank"
                rel="noreferrer"
                className="lsh-lift border border-transparent bg-white p-6"
              >
                <h3 className="lsh-display text-xl text-[var(--lsh-charcoal)]">{entity.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{entity.detail}</p>
                <p className="lsh-display mt-3 text-[10px] text-[var(--lsh-brand-red)]">
                  {entity.phone}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function ShopBoundaryPage() {
  return (
    <LifeSupplyLayout>
      <PageHero
        eyebrow="Product access"
        title="Commerce occurs through LifeSupply’s approved operating channels."
        description="This corporate website does not process transactions. Future product discovery will be published from a channel-approved Command Center projection, while orders remain in the designated commerce system."
      />
      <section className="mx-auto max-w-4xl px-5 py-20 text-center lg:px-8">
        <p className="lsh-display text-3xl text-[var(--lsh-charcoal)]">
          Looking for medical products?
        </p>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-[var(--lsh-muted)]">
          Visit LifeSupply’s consumer-facing ecommerce channel for current catalogue, availability,
          fulfillment, payment, and customer-service information.
        </p>
        <a
          href="https://lifesupply.ca"
          target="_blank"
          rel="noreferrer"
          className="lsh-primary-action lsh-display mt-8 inline-flex items-center gap-2 px-6 py-3 text-[11px]"
        >
          Visit LifeSupply.ca <ExternalLink size={16} />
        </a>
      </section>
    </LifeSupplyLayout>
  );
}

export function LegacyProfilePage({ slug }: { slug: string }) {
  const profile = LIFE_SUPPLY_CONTENT.team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) return null;
  return (
    <LifeSupplyLayout>
      <PageHero eyebrow="Leadership profile" title={profile.name} description={profile.role} />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <div className="border-t-4 border-[var(--lsh-brand-red)] bg-white p-8 shadow-sm sm:p-12">
          <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
            Historical public profile
          </p>
          <p className="mt-6 text-lg leading-8 text-[var(--lsh-muted)]">{profile.bio}</p>
          <p className="mt-8 border-t border-[#d6d6d6] pt-6 text-sm leading-6 text-[var(--lsh-muted)]">
            This preserved biography is sourced from the prior public website. The Command Center
            publication workflow will govern subsequent current-role or biography updates.
          </p>
          <PrimaryLink href={LIFE_SUPPLY_ROUTES.team}>Return to team</PrimaryLink>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}
