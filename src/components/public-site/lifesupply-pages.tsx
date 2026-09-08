import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink, Mail, Phone, ShieldCheck } from "lucide-react";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
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
    <section className="relative overflow-hidden bg-[#123348] px-5 py-20 text-white lg:px-8 lg:py-28">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_80%_10%,#b5c951_0,transparent_28%),radial-gradient(circle_at_10%_90%,#7aa0a5_0,transparent_38%)]" />
      <div className="relative mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8e87f]">{eyebrow}</p>
        <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
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
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#617a36]">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl leading-tight text-[#173546] sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-[#45606d]">{description}</p>
      ) : null}
    </div>
  );
}
function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-[#b5c951] px-5 py-3 text-sm font-bold text-[#173546] transition hover:bg-[#d5e873]"
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
      <section className="relative overflow-hidden bg-[#123348] px-5 pb-20 pt-20 text-white lg:px-8 lg:pb-28 lg:pt-28">
        <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_78%_20%,#b5c951_0,transparent_26%),radial-gradient(circle_at_18%_100%,#46727c_0,transparent_38%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8e87f]">
              {homepage.eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              {homepage.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">{homepage.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryLink href={LIFE_SUPPLY_ROUTES.about}>Explore LifeSupply</PrimaryLink>
              <Link
                href={LIFE_SUPPLY_ROUTES.investorRelations}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Investor relations <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="border-l border-white/15 pl-6 lg:pl-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              Public operating context
            </p>
            <p className="mt-4 font-serif text-3xl leading-tight text-white/90">
              Health, safety, medical, and industrial supply categories across Canada and the United
              States.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-px bg-[#d3dbd5] px-5 lg:grid-cols-3 lg:px-8">
        {homepage.pillars.map((pillar) => (
          <article key={pillar.index} className="bg-[#f4f4ef] px-7 py-10">
            <p className="text-xs font-bold tracking-[0.18em] text-[#6a8541]">{pillar.index}</p>
            <h2 className="mt-7 font-serif text-3xl text-[#173546]">{pillar.title}</h2>
            <p className="mt-4 leading-7 text-[#4e6570]">{pillar.text}</p>
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
              className="border-t-2 border-[#b5c951] bg-white px-5 py-7 shadow-sm"
            >
              <p className="font-serif text-4xl text-[#173546]">{metric.value}</p>
              <p className="mt-3 text-sm leading-5 text-[#5b6d73]">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[#dce7d7] px-5 py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#617a36]">
              Corporate overview
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#173546]">
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
        <div className="rounded-3xl bg-[#e5ece0] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#617a36]">Mission</p>
          <p className="mt-5 font-serif text-3xl leading-tight text-[#173546]">{about.mission}</p>
        </div>
        <div className="rounded-3xl bg-[#163a4c] p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8e87f]">Vision</p>
          <p className="mt-5 font-serif text-3xl leading-tight text-white/95">{about.vision}</p>
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
                className="group rounded-2xl border border-[#dbe3df] p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Building2 className="text-[#6d873c]" />
                <h3 className="mt-8 font-serif text-2xl text-[#173546]">{brandItem.name}</h3>
                <p className="mt-3 leading-7 text-[#586e78]">{brandItem.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#31586a]">
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
            <article key={operation.title} className="flex gap-5 border-b border-[#d7dfd9] pb-6">
              <span className="font-serif text-3xl text-[#9aae50]">0{index + 1}</span>
              <div>
                <h2 className="font-serif text-2xl text-[#173546]">{operation.title}</h2>
                <p className="mt-2 leading-7 text-[#566d78]">{operation.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="overflow-hidden rounded-3xl bg-[#dce7d7] p-4">
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
              className="group rounded-2xl border border-[#dce4df] bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
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
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dce7d7] font-serif text-2xl text-[#31586a]">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                )}
                <div>
                  <h2 className="font-serif text-2xl text-[#173546]">{member.name}</h2>
                  <p className="mt-1 text-sm font-bold uppercase tracking-[0.12em] text-[#66813d]">
                    {member.role}
                  </p>
                </div>
              </div>
              <p className="mt-6 leading-7 text-[#566d78]">{member.summary}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#31586a]">
                View profile <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-16 rounded-2xl bg-[#163a4c] p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8e87f]">
            Board of directors
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {board.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80"
              >
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
        <div className="overflow-hidden rounded-3xl bg-[#e5ece0] p-4">
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
                className="border-t-2 border-[#b5c951] bg-white px-4 py-6 shadow-sm"
              >
                <p className="font-serif text-3xl text-[#173546]">{item.value}</p>
                <p className="mt-2 text-sm text-[#596e78]">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-[#d9e2dc] bg-[#f9faf8] p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-[#4c6b35]">
              <ShieldCheck size={18} /> Disclosure context
            </div>
            <p className="mt-3 leading-7 text-[#4d626d]">{investor.expansionContext.description}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${investor.contact.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#173546] px-5 py-3 text-sm font-bold text-white"
            >
              <Mail size={16} /> {investor.contact.email}
            </a>
            <a
              href={`tel:${investor.contact.phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#bfcfc5] px-5 py-3 text-sm font-bold text-[#173546]"
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
              className="group rounded-2xl border border-[#dce4df] bg-white p-7 transition hover:border-[#b5c951] hover:shadow-lg"
            >
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#687e42]">
                {item.date} · {item.source}
              </p>
              <h2 className="mt-3 font-serif text-2xl text-[#173546]">{item.title}</h2>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#31586a]">
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
          <article key={channel.label} className="rounded-2xl border border-[#dbe3df] bg-white p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#69833e]">
              {channel.label}
            </p>
            <h2 className="mt-3 font-serif text-2xl text-[#173546]">{channel.name}</h2>
            <div className="mt-5 grid gap-2 text-sm text-[#526873]">
              <a
                href={`mailto:${channel.email}`}
                className="inline-flex items-center gap-2 hover:text-[#173546]"
              >
                <Mail size={15} /> {channel.email}
              </a>
              {"phone" in channel ? (
                <a
                  href={`tel:${channel.phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-center gap-2 hover:text-[#173546]"
                >
                  <Phone size={15} /> {channel.phone}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </section>
      <section className="bg-[#e5ece0] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Operating entities" title="LifeSupply public subsidiaries" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {LIFE_SUPPLY_CONTENT.contact.subsidiaries.map((entity) => (
              <a
                key={entity.name}
                href={entity.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-white p-6"
              >
                <h3 className="font-serif text-xl text-[#173546]">{entity.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#596f78]">{entity.detail}</p>
                <p className="mt-3 text-sm font-semibold text-[#31586a]">{entity.phone}</p>
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
        <p className="font-serif text-3xl text-[#173546]">Looking for medical products?</p>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#586e78]">
          Visit LifeSupply’s consumer-facing ecommerce channel for current catalogue, availability,
          fulfillment, payment, and customer-service information.
        </p>
        <a
          href="https://lifesupply.ca"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#173546] px-6 py-3 text-sm font-bold text-white"
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
        <div className="rounded-3xl border border-[#dbe3df] bg-white p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687e42]">
            Historical public profile
          </p>
          <p className="mt-6 text-lg leading-8 text-[#4f6570]">{profile.bio}</p>
          <p className="mt-8 border-t border-[#dce4df] pt-6 text-sm leading-6 text-[#6a7d84]">
            This preserved biography is sourced from the prior public website. The Command Center
            publication workflow will govern subsequent current-role or biography updates.
          </p>
          <PrimaryLink href={LIFE_SUPPLY_ROUTES.team}>Return to team</PrimaryLink>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}
